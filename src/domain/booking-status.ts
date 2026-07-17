import { BookingStatus } from '../generated/prisma/client'

export { BookingStatus }

export const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
	[BookingStatus.SCHEDULED]: [
		BookingStatus.CONFIRMED,
		BookingStatus.COMPLETED,
		BookingStatus.CANCELLED,
	],
	[BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
	[BookingStatus.COMPLETED]: [],
	[BookingStatus.CANCELLED]: [],
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
	if (from === to) return false
	return STATUS_TRANSITIONS[from].includes(to)
}
