import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common'
import { canTransition } from '../../domain/booking-status'
import { dateStringToUtcDate, isValidDateString } from '../../domain/timezone'
import { PrismaService } from '../../prisma.service'
import {
	BOOKING_USER_SELECT,
	type BookingResponse,
	serializeBooking,
} from '../bookings/booking.serializer'
import type { ListBookingsQueryDTO, UpdateStatusDTO } from './admin.dto'

function isRecordNotFound(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		(error as { code: unknown }).code === 'P2025'
	)
}

const withUser = { user: { select: BOOKING_USER_SELECT } }

@Injectable()
export class AdminBookingsService {
	constructor(private readonly prisma: PrismaService) {}

	async list(filter: ListBookingsQueryDTO): Promise<BookingResponse[]> {
		const where: { date?: Date; status?: BookingResponse['status'] } = {}

		if (filter.date) {
			if (!isValidDateString(filter.date)) {
				throw new BadRequestException('date must be a valid calendar date')
			}
			where.date = dateStringToUtcDate(filter.date)
		}
		if (filter.status) {
			where.status = filter.status
		}

		const rows = await this.prisma.booking.findMany({
			where,
			orderBy: [{ date: 'asc' }, { time: 'asc' }],
			include: withUser,
		})
		return rows.map(serializeBooking)
	}

	async updateStatus(
		id: string,
		dto: UpdateStatusDTO,
	): Promise<BookingResponse> {
		const booking = await this.prisma.booking.findUnique({ where: { id } })
		if (!booking) {
			throw new NotFoundException('Booking not found')
		}

		if (!canTransition(booking.status, dto.status)) {
			throw new UnprocessableEntityException(
				`Cannot change status from ${booking.status} to ${dto.status}`,
			)
		}

		const updated = await this.prisma.booking.update({
			where: { id },
			data: { status: dto.status },
			include: withUser,
		})
		return serializeBooking(updated)
	}

	async remove(id: string): Promise<void> {
		try {
			await this.prisma.booking.delete({ where: { id } })
		} catch (error) {
			if (isRecordNotFound(error)) {
				throw new NotFoundException('Booking not found')
			}
			throw error
		}
	}
}
