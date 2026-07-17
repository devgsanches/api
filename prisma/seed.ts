import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import {
	BookingStatus,
	PrismaClient,
	Role,
} from '../src/generated/prisma/client'
import { dateStringToUtcDate, todayInSaoPaulo } from '../src/domain/timezone'

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL as string,
})
const prisma = new PrismaClient({ adapter })

const SALT_ROUNDS = 10
const DEMO_PASSWORD = 'cliente123'

function addDays(dateStr: string, days: number): string {
	const d = dateStringToUtcDate(dateStr)
	d.setUTCDate(d.getUTCDate() + days)
	return d.toISOString().slice(0, 10)
}

function nextOpenDays(count: number): string[] {
	const days: string[] = []
	let cursor = todayInSaoPaulo()
	while (days.length < count) {
		cursor = addDays(cursor, 1)
		if (dateStringToUtcDate(cursor).getUTCDay() !== 0) days.push(cursor)
	}
	return days
}

async function main() {
	const [d1, d2] = nextOpenDays(2)

	await prisma.booking.deleteMany()
	await prisma.user.deleteMany()

	const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@devclub.com'
	const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123'

	await prisma.user.create({
		data: {
			name: 'Administrador',
			email: adminEmail,
			phone: '(11) 90000-0000',
			passwordHash: await hash(adminPassword, SALT_ROUNDS),
			role: Role.ADMIN,
		},
	})

	const demoHash = await hash(DEMO_PASSWORD, SALT_ROUNDS)

	const ana = await prisma.user.create({
		data: {
			name: 'Ana Souza',
			email: 'ana@example.com',
			phone: '(11) 91234-5678',
			passwordHash: demoHash,
		},
	})
	const bruno = await prisma.user.create({
		data: {
			name: 'Bruno Lima',
			email: 'bruno@example.com',
			phone: '(21) 99876-5432',
			passwordHash: demoHash,
		},
	})
	const carla = await prisma.user.create({
		data: {
			name: 'Carla Dias',
			email: 'carla@example.com',
			phone: '(31) 98765-4321',
			passwordHash: demoHash,
		},
	})

	await prisma.booking.createMany({
		data: [
			{
				userId: ana.id,
				service: 'consulta-inicial',
				date: dateStringToUtcDate(d1),
				time: '09:00',
				status: BookingStatus.CONFIRMED,
			},
			{
				userId: bruno.id,
				service: 'avaliacao',
				date: dateStringToUtcDate(d1),
				time: '11:00',
				status: BookingStatus.SCHEDULED,
			},
			{
				userId: carla.id,
				service: 'retorno',
				date: dateStringToUtcDate(d2),
				time: '14:00',
				status: BookingStatus.SCHEDULED,
			},
			{
				userId: ana.id,
				service: 'sessao',
				date: dateStringToUtcDate(d2),
				time: '16:00',
				status: BookingStatus.CANCELLED,
			},
		],
	})

	const [users, bookings] = await Promise.all([
		prisma.user.count(),
		prisma.booking.count(),
	])
	console.log(
		`Seed complete: ${users} users (admin: ${adminEmail}) and ${bookings} bookings across ${d1} and ${d2}.`,
	)
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
