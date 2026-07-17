import { describe, expect, it } from 'vitest'
import {
	dateStringToUtcDate,
	isClosedDay,
	isPastDay,
	isValidDateString,
	utcDateToDateString,
	weekdayOf,
} from './timezone'

describe('timezone / date helpers', () => {
	it('validates well-formed calendar dates', () => {
		expect(isValidDateString('2026-07-20')).toBe(true)
		expect(isValidDateString('2026-02-30')).toBe(false) // no Feb 30
		expect(isValidDateString('2026-13-01')).toBe(false)
		expect(isValidDateString('2026-7-1')).toBe(false) // needs zero-padding
		expect(isValidDateString('garbage')).toBe(false)
	})

	it('round-trips a date string through a UTC date', () => {
		expect(utcDateToDateString(dateStringToUtcDate('2026-07-20'))).toBe(
			'2026-07-20',
		)
	})

	it('knows weekdays and closes on Sundays', () => {
		expect(weekdayOf('2026-07-19')).toBe(0) // Sunday
		expect(weekdayOf('2026-07-20')).toBe(1) // Monday
		expect(isClosedDay('2026-07-19')).toBe(true)
		expect(isClosedDay('2026-07-20')).toBe(false)
		expect(isClosedDay('2026-07-18')).toBe(false) // Saturday still open
	})

	it('flags past days and allows far-future days', () => {
		expect(isPastDay('2000-01-01')).toBe(true)
		expect(isPastDay('2999-01-01')).toBe(false)
	})
})
