import { describe, expect, it } from 'vitest'
import { isValidSlot, SLOT_TIMES } from './slots'

describe('slots grid', () => {
	it('builds hourly slots from 09:00 to 17:00 (9 slots, last ends 18:00)', () => {
		expect(SLOT_TIMES).toEqual([
			'09:00',
			'10:00',
			'11:00',
			'12:00',
			'13:00',
			'14:00',
			'15:00',
			'16:00',
			'17:00',
		])
	})

	it('accepts a valid slot and rejects invalid ones', () => {
		expect(isValidSlot('09:00')).toBe(true)
		expect(isValidSlot('17:00')).toBe(true)
		expect(isValidSlot('18:00')).toBe(false)
		expect(isValidSlot('08:00')).toBe(false)
		expect(isValidSlot('09:30')).toBe(false)
		expect(isValidSlot('nope')).toBe(false)
	})
})
