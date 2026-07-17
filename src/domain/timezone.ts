import { formatInTimeZone } from 'date-fns-tz'

export const APP_TIMEZONE = 'America/Sao_Paulo'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function dateStringToUtcDate(dateStr: string): Date {
	return new Date(`${dateStr}T00:00:00.000Z`)
}

export function utcDateToDateString(date: Date): string {
	return formatInTimeZone(date, 'UTC', 'yyyy-MM-dd')
}

export function isValidDateString(dateStr: string): boolean {
	if (!DATE_RE.test(dateStr)) return false
	const date = dateStringToUtcDate(dateStr)
	return !Number.isNaN(date.getTime()) && utcDateToDateString(date) === dateStr
}

export function weekdayOf(dateStr: string): number {
	return dateStringToUtcDate(dateStr).getUTCDay()
}

export function isClosedDay(dateStr: string): boolean {
	return weekdayOf(dateStr) === 0
}

export function todayInSaoPaulo(): string {
	return formatInTimeZone(new Date(), APP_TIMEZONE, 'yyyy-MM-dd')
}

export function isPastDay(dateStr: string): boolean {
	return dateStr < todayInSaoPaulo()
}
