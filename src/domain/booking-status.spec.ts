import { describe, expect, it } from 'vitest'
import { BookingStatus, canTransition } from './booking-status'

describe('booking status transitions', () => {
	it('allows forward moves and cancellation from active states', () => {
		expect(
			canTransition(BookingStatus.SCHEDULED, BookingStatus.CONFIRMED),
		).toBe(true)
		expect(
			canTransition(BookingStatus.SCHEDULED, BookingStatus.COMPLETED),
		).toBe(true)
		expect(
			canTransition(BookingStatus.SCHEDULED, BookingStatus.CANCELLED),
		).toBe(true)
		expect(
			canTransition(BookingStatus.CONFIRMED, BookingStatus.COMPLETED),
		).toBe(true)
		expect(
			canTransition(BookingStatus.CONFIRMED, BookingStatus.CANCELLED),
		).toBe(true)
	})

	it('rejects no-op and moves out of terminal states', () => {
		expect(
			canTransition(BookingStatus.SCHEDULED, BookingStatus.SCHEDULED),
		).toBe(false)
		expect(
			canTransition(BookingStatus.COMPLETED, BookingStatus.SCHEDULED),
		).toBe(false)
		expect(
			canTransition(BookingStatus.CANCELLED, BookingStatus.SCHEDULED),
		).toBe(false)
		expect(
			canTransition(BookingStatus.CANCELLED, BookingStatus.CONFIRMED),
		).toBe(false)
	})
})
