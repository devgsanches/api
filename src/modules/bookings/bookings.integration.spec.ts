import {
	ConflictException,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { BookingStatus } from '../../domain/booking-status'
import {
	dateStringToUtcDate,
	todayInSaoPaulo,
	weekdayOf,
} from '../../domain/timezone'
import { Role } from '../../generated/prisma/client'
import { PrismaService } from '../../prisma.service'
import { AdminBookingsService } from '../admin/admin-bookings.service'
import type { JwtPayload } from '../auth/jwt-payload'
import { AvailabilityService } from '../availability/availability.service'
import { BookingsService } from './bookings.service'

function futureOpenDate(): string {
	const d = dateStringToUtcDate(todayInSaoPaulo())
	d.setUTCDate(d.getUTCDate() + 400)
	let s = d.toISOString().slice(0, 10)
	if (weekdayOf(s) === 0) {
		d.setUTCDate(d.getUTCDate() + 1)
		s = d.toISOString().slice(0, 10)
	}
	return s
}

const TEST_DATE = futureOpenDate()
const OWNER_EMAIL = 'owner-spec@example.com'
const OTHER_EMAIL = 'other-spec@example.com'
const TEST_EMAILS = [OWNER_EMAIL, OTHER_EMAIL]

describe('bookings integration (real Postgres)', () => {
	const prisma = new PrismaService()
	const bookings = new BookingsService(prisma)
	const availability = new AvailabilityService(prisma)
	const admin = new AdminBookingsService(prisma)

	let owner: JwtPayload
	let other: JwtPayload
	const adminUser: JwtPayload = {
		sub: 'admin-spec',
		email: 'admin-spec@example.com',
		role: Role.ADMIN,
	}

	const base = { service: 'consulta-inicial', date: TEST_DATE, time: '10:00' }

	const removeUsers = () =>
		prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } })

	beforeAll(async () => {
		await prisma.onModuleInit()
		await removeUsers()

		const ownerRow = await prisma.user.create({
			data: {
				name: 'Owner Spec',
				email: OWNER_EMAIL,
				phone: '(11) 91234-5678',
				passwordHash: 'not-used',
			},
		})
		const otherRow = await prisma.user.create({
			data: {
				name: 'Other Spec',
				email: OTHER_EMAIL,
				phone: '(11) 90000-0000',
				passwordHash: 'not-used',
			},
		})
		owner = { sub: ownerRow.id, email: OWNER_EMAIL, role: Role.USER }
		other = { sub: otherRow.id, email: OTHER_EMAIL, role: Role.USER }
	})

	beforeEach(() =>
		prisma.booking.deleteMany({
			where: { date: dateStringToUtcDate(TEST_DATE) },
		}),
	)

	afterAll(async () => {
		await removeUsers()
		await prisma.$disconnect()
	})

	it('creates a booking tied to the user and returns date as YYYY-MM-DD', async () => {
		const b = await bookings.create(owner.sub, { ...base })
		expect(b.id).toBeTruthy()
		expect(b.date).toBe(TEST_DATE)
		expect(b.status).toBe(BookingStatus.SCHEDULED)
		expect(b.userId).toBe(owner.sub)
		expect(b.user?.name).toBe('Owner Spec')
	})

	it('never exposes the password hash through the booking relation', async () => {
		const b = await bookings.create(owner.sub, { ...base })
		expect(JSON.stringify(b)).not.toContain('passwordHash')
	})

	it('rejects a second active booking for the same slot, even for another user (409)', async () => {
		await bookings.create(owner.sub, { ...base })
		await expect(
			bookings.create(other.sub, { ...base }),
		).rejects.toBeInstanceOf(ConflictException)
	})

	it('enforces the slot atomically under concurrency', async () => {
		const results = await Promise.allSettled([
			bookings.create(owner.sub, { ...base, time: '11:00' }),
			bookings.create(other.sub, { ...base, time: '11:00' }),
		])
		const fulfilled = results.filter((r) => r.status === 'fulfilled')
		const rejected = results.filter((r) => r.status === 'rejected')
		expect(fulfilled).toHaveLength(1)
		expect(rejected).toHaveLength(1)
		expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
			ConflictException,
		)
	})

	it('frees the slot for rebooking after cancellation', async () => {
		const first = await bookings.create(owner.sub, { ...base, time: '14:00' })
		await admin.updateStatus(first.id, { status: BookingStatus.CANCELLED })
		const second = await bookings.create(other.sub, { ...base, time: '14:00' })
		expect(second.id).not.toBe(first.id)
		expect(second.status).toBe(BookingStatus.SCHEDULED)
	})

	it('marks occupied slots unavailable but keeps cancelled slots free', async () => {
		await bookings.create(owner.sub, { ...base, time: '09:00' })
		const cancelled = await bookings.create(owner.sub, {
			...base,
			time: '15:00',
		})
		await admin.updateStatus(cancelled.id, {
			status: BookingStatus.CANCELLED,
		})

		const day = await availability.getForDate(TEST_DATE)
		expect(day.open).toBe(true)
		const isFree = (t: string) => day.slots.find((s) => s.time === t)?.available
		expect(isFree('09:00')).toBe(false)
		expect(isFree('15:00')).toBe(true)
		expect(isFree('10:00')).toBe(true)
	})

	describe('ownership', () => {
		it('lets the owner and an admin read a booking, but hides it from others', async () => {
			const b = await bookings.create(owner.sub, { ...base })

			expect((await bookings.findById(b.id, owner)).id).toBe(b.id)
			expect((await bookings.findById(b.id, adminUser)).id).toBe(b.id)
			await expect(bookings.findById(b.id, other)).rejects.toBeInstanceOf(
				NotFoundException,
			)
		})

		it('lists only the signed-in user’s bookings', async () => {
			await bookings.create(owner.sub, { ...base, time: '09:00' })
			await bookings.create(other.sub, { ...base, time: '12:00' })

			const mine = await bookings.findMine(owner.sub)
			expect(mine).toHaveLength(1)
			expect(mine[0].time).toBe('09:00')
		})

		it('lets the owner cancel their own booking and frees the slot', async () => {
			const b = await bookings.create(owner.sub, { ...base })
			const cancelled = await bookings.cancelMine(b.id, owner.sub)
			expect(cancelled.status).toBe(BookingStatus.CANCELLED)

			const day = await availability.getForDate(TEST_DATE)
			expect(day.slots.find((s) => s.time === '10:00')?.available).toBe(true)
		})

		it('does not let a user cancel someone else’s booking', async () => {
			const b = await bookings.create(owner.sub, { ...base })
			await expect(bookings.cancelMine(b.id, other.sub)).rejects.toBeInstanceOf(
				NotFoundException,
			)

			expect((await bookings.findById(b.id, owner)).status).toBe(
				BookingStatus.SCHEDULED,
			)
		})

		it('refuses to cancel a booking in a terminal state', async () => {
			const b = await bookings.create(owner.sub, { ...base })
			await admin.updateStatus(b.id, { status: BookingStatus.COMPLETED })
			await expect(bookings.cancelMine(b.id, owner.sub)).rejects.toBeInstanceOf(
				UnprocessableEntityException,
			)
		})
	})

	describe('admin', () => {
		it('validates status transitions and 404s a missing booking', async () => {
			const b = await bookings.create(owner.sub, { ...base, time: '16:00' })
			await admin.updateStatus(b.id, { status: BookingStatus.CONFIRMED })
			await admin.updateStatus(b.id, { status: BookingStatus.COMPLETED })
			await expect(
				admin.updateStatus(b.id, { status: BookingStatus.CANCELLED }),
			).rejects.toBeInstanceOf(UnprocessableEntityException)
			await expect(
				admin.updateStatus('missing-id', { status: BookingStatus.CONFIRMED }),
			).rejects.toBeInstanceOf(NotFoundException)
		})

		it('lists by date with the customer attached, and deletes', async () => {
			const b = await bookings.create(owner.sub, { ...base, time: '12:00' })
			const list = await admin.list({ date: TEST_DATE })
			const found = list.find((x) => x.id === b.id)
			expect(found?.user?.name).toBe('Owner Spec')
			expect(found?.user?.phone).toBe('(11) 91234-5678')

			await admin.remove(b.id)
			await expect(admin.remove(b.id)).rejects.toBeInstanceOf(NotFoundException)
		})
	})
})
