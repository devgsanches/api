import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { CreateBookingDTO } from './bookings.dto'

async function errorsFor(payload: Record<string, unknown>): Promise<string[]> {
	const dto = plainToInstance(CreateBookingDTO, payload)
	const errors = await validate(dto)
	return errors.map((e) => e.property)
}

const valid = {
	service: 'consulta-inicial',
	date: '2026-07-20',
	time: '09:00',
}

describe('CreateBookingDTO', () => {
	it('accepts a valid payload', async () => {
		expect(await errorsFor(valid)).toEqual([])
	})

	it('rejects an unknown service', async () => {
		expect(await errorsFor({ ...valid, service: 'massagem' })).toContain(
			'service',
		)
	})

	it('rejects a non-grid time', async () => {
		expect(await errorsFor({ ...valid, time: '09:30' })).toContain('time')
	})

	it('rejects a malformed date', async () => {
		expect(await errorsFor({ ...valid, date: '20/07/2026' })).toContain('date')
	})

	it('requires every field', async () => {
		const errors = await errorsFor({})
		expect(errors).toContain('service')
		expect(errors).toContain('date')
		expect(errors).toContain('time')
	})
})
