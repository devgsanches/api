import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Role } from '../../generated/prisma/client'
import { PrismaService } from '../../prisma.service'
import { AuthService } from './auth.service'
import type { JwtPayload } from './jwt-payload'

const SECRET = 'test-secret'
const jwt = new JwtService({ secret: SECRET, signOptions: { expiresIn: '1d' } })

const EMAIL = 'auth-spec@example.com'
const newUser = {
	name: 'Auth Spec',
	email: EMAIL,
	phone: '(11) 91234-5678',
	password: 'secret123',
}

describe('AuthService (real Postgres)', () => {
	const prisma = new PrismaService()
	const auth = new AuthService(prisma, jwt)

	const cleanup = () => prisma.user.deleteMany({ where: { email: EMAIL } })

	beforeAll(async () => {
		await prisma.onModuleInit()
	})
	beforeEach(cleanup)
	afterAll(async () => {
		await cleanup()
		await prisma.$disconnect()
	})

	it('registers a customer as USER and returns a usable token', async () => {
		const result = await auth.register({ ...newUser })

		expect(result.user.role).toBe(Role.USER)
		expect(result.user.email).toBe(EMAIL)
		const payload = jwt.verify<JwtPayload>(result.access_token)
		expect(payload.sub).toBe(result.user.id)
		expect(payload.role).toBe(Role.USER)
	})

	it('never exposes the password hash', async () => {
		const result = await auth.register({ ...newUser })
		expect(JSON.stringify(result)).not.toContain('passwordHash')
		expect(JSON.stringify(result)).not.toContain(newUser.password)
	})

	it('stores the password hashed, not in plain text', async () => {
		await auth.register({ ...newUser })
		const row = await prisma.user.findUnique({ where: { email: EMAIL } })
		expect(row?.passwordHash).toBeTruthy()
		expect(row?.passwordHash).not.toBe(newUser.password)
	})

	it('rejects a duplicate email with 409', async () => {
		await auth.register({ ...newUser })
		await expect(auth.register({ ...newUser })).rejects.toBeInstanceOf(
			ConflictException,
		)
	})

	it('logs in with the right password', async () => {
		await auth.register({ ...newUser })
		const result = await auth.login({ email: EMAIL, password: 'secret123' })
		expect(result.access_token).toBeTruthy()
		expect(result.user.email).toBe(EMAIL)
	})

	it('rejects a wrong password and an unknown email alike', async () => {
		await auth.register({ ...newUser })
		await expect(
			auth.login({ email: EMAIL, password: 'wrong' }),
		).rejects.toBeInstanceOf(UnauthorizedException)
		await expect(
			auth.login({ email: 'nobody@example.com', password: 'secret123' }),
		).rejects.toBeInstanceOf(UnauthorizedException)
	})

	it('finds the current user by id', async () => {
		const { user } = await auth.register({ ...newUser })
		const found = await auth.findById(user.id)
		expect(found.email).toBe(EMAIL)
		await expect(auth.findById('missing-id')).rejects.toBeInstanceOf(
			UnauthorizedException,
		)
	})
})
