import { BadRequestException, Injectable } from '@nestjs/common'
import { BookingStatus } from '../../domain/booking-status'
import { SLOT_TIMES } from '../../domain/slots'
import {
	dateStringToUtcDate,
	isClosedDay,
	isPastDay,
	isValidDateString,
} from '../../domain/timezone'
import { PrismaService } from '../../prisma.service'

export interface SlotAvailability {
	time: string
	available: boolean
}

export interface DayAvailability {
	date: string
	open: boolean
	slots: SlotAvailability[]
}

@Injectable()
export class AvailabilityService {
	constructor(private readonly prisma: PrismaService) {}

	async getForDate(dateStr: string): Promise<DayAvailability> {
		if (!isValidDateString(dateStr)) {
			throw new BadRequestException('date must be a valid calendar date')
		}

		if (isClosedDay(dateStr) || isPastDay(dateStr)) {
			return { date: dateStr, open: false, slots: [] }
		}

		const bookings = await this.prisma.booking.findMany({
			where: {
				date: dateStringToUtcDate(dateStr),
				status: { not: BookingStatus.CANCELLED },
			},
			select: { time: true },
		})
		const taken = new Set(bookings.map((b) => b.time))

		const slots = SLOT_TIMES.map((time) => ({
			time,
			available: !taken.has(time),
		}))
		return { date: dateStr, open: true, slots }
	}
}
