export const OPENING_HOUR = 9
export const CLOSING_HOUR = 18
export const SLOT_MINUTES = 60

function pad(n: number): string {
	return String(n).padStart(2, '0')
}

function buildSlotTimes(): string[] {
	const times: string[] = []
	const start = OPENING_HOUR * 60
	const end = CLOSING_HOUR * 60
	for (let m = start; m + SLOT_MINUTES <= end; m += SLOT_MINUTES) {
		times.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`)
	}
	return times
}

export const SLOT_TIMES: string[] = buildSlotTimes()

export function isValidSlot(time: string): boolean {
	return SLOT_TIMES.includes(time)
}
