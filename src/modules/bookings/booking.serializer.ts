import type { BookingStatus } from '../../domain/booking-status'
import { utcDateToDateString } from '../../domain/timezone'

export const BOOKING_USER_SELECT = {
	id: true,
	name: true,
	email: true,
	phone: true,
} as const

export interface BookingUser {
	id: string
	name: string
	email: string
	phone: string
}

export interface BookingRow {
	id: string
	userId: string
	service: string
	date: Date
	time: string
	status: BookingStatus
	createdAt: Date
	updatedAt: Date
	user?: BookingUser
}

export interface BookingResponse {
	id: string
	userId: string
	service: string
	date: string
	time: string
	status: BookingStatus
	createdAt: Date
	updatedAt: Date
	user?: BookingUser
}

export function serializeBooking(booking: BookingRow): BookingResponse {
	const { date, user, ...rest } = booking
	return {
		...rest,
		date: utcDateToDateString(date),
		...(user ? { user } : {}),
	}
}
