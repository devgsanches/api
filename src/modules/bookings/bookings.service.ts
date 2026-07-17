import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common'
import { BookingStatus, canTransition } from '../../domain/booking-status'
import {
	dateStringToUtcDate,
	isClosedDay,
	isPastDay,
	isValidDateString,
} from '../../domain/timezone'
import { Role } from '../../generated/prisma/client'
import { PrismaService } from '../../prisma.service'
import type { JwtPayload } from '../auth/jwt-payload'
import {
	BOOKING_USER_SELECT,
	type BookingResponse,
	serializeBooking,
} from './booking.serializer'
import type { CreateBookingDTO } from './bookings.dto'

function isUniqueViolation(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		(error as { code: unknown }).code === 'P2002'
	)
}

const withUser = { user: { select: BOOKING_USER_SELECT } }

@Injectable()
export class BookingsService {
	constructor(private readonly prisma: PrismaService) {}

	async create(
		userId: string,
		dto: CreateBookingDTO,
	): Promise<BookingResponse> {
		if (!isValidDateString(dto.date)) {
			throw new BadRequestException('date must be a valid calendar date')
		}
		if (isPastDay(dto.date)) {
			throw new BadRequestException('date must not be in the past')
		}
		if (isClosedDay(dto.date)) {
			throw new BadRequestException(
				'the selected day is not available for booking',
			)
		}

		try {
			const booking = await this.prisma.booking.create({
				data: {
					userId,
					service: dto.service,
					date: dateStringToUtcDate(dto.date),
					time: dto.time,
				},
				include: withUser,
			})
			return serializeBooking(booking)
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new ConflictException(
					'This slot has just been taken. Please choose another.',
				)
			}
			throw error
		}
	}

	async findById(id: string, requester: JwtPayload): Promise<BookingResponse> {
		const booking = await this.prisma.booking.findUnique({
			where: { id },
			include: withUser,
		})
		if (
			!booking ||
			(booking.userId !== requester.sub && requester.role !== Role.ADMIN)
		) {
			throw new NotFoundException('Booking not found')
		}
		return serializeBooking(booking)
	}

	async findMine(userId: string): Promise<BookingResponse[]> {
		const rows = await this.prisma.booking.findMany({
			where: { userId },
			orderBy: [{ date: 'desc' }, { time: 'asc' }],
			include: withUser,
		})
		return rows.map(serializeBooking)
	}

	async cancelMine(id: string, userId: string): Promise<BookingResponse> {
		const booking = await this.prisma.booking.findUnique({ where: { id } })
		if (!booking || booking.userId !== userId) {
			throw new NotFoundException('Booking not found')
		}
		if (!canTransition(booking.status, BookingStatus.CANCELLED)) {
			throw new UnprocessableEntityException(
				`Cannot cancel a booking with status ${booking.status}`,
			)
		}

		const updated = await this.prisma.booking.update({
			where: { id },
			data: { status: BookingStatus.CANCELLED },
			include: withUser,
		})
		return serializeBooking(updated)
	}
}
