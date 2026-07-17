import { type INestApplication, VersioningType } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Role } from '../../generated/prisma/client'
import { PrismaModule } from '../../prisma.module'
import { PrismaService } from '../../prisma.service'
import { AuthModule } from './auth.module'
import type { JwtPayload } from './jwt-payload'

const EMAIL = 'e2e-auth@example.com'

describe('auth over HTTP (real Postgres)', () => {
	let app: INestApplication
	let prisma: PrismaService
	let jwt: JwtService
	let token: string

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({ isGlobal: true }),
				PrismaModule,
				AuthModule,
			],
		}).compile()

		app = moduleRef.createNestApplication()
		app.enableVersioning({ type: VersioningType.URI })
		await app.init()

		prisma = moduleRef.get(PrismaService)
		jwt = moduleRef.get(JwtService)

		await prisma.user.deleteMany({ where: { email: EMAIL } })
		const user = await prisma.user.create({
			data: {
				name: 'E2E Auth',
				email: EMAIL,
				phone: '(11) 91234-5678',
				passwordHash: 'unused',
				role: Role.USER,
			},
		})
		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		}
		token = jwt.sign(payload)
	})

	afterAll(async () => {
		await prisma.user.deleteMany({ where: { email: EMAIL } })
		await app.close()
	})

	it('accepts a valid bearer token', async () => {
		const res = await request(app.getHttpServer())
			.get('/v1/auth/me')
			.set('Authorization', `Bearer ${token}`)
			.expect(200)

		expect(res.body.email).toBe(EMAIL)
		expect(res.body.role).toBe(Role.USER)
		expect(res.body).not.toHaveProperty('passwordHash')
	})

	it('rejects a missing token', async () => {
		await request(app.getHttpServer()).get('/v1/auth/me').expect(401)
	})

	it('rejects a malformed token', async () => {
		await request(app.getHttpServer())
			.get('/v1/auth/me')
			.set('Authorization', 'Bearer garbage')
			.expect(401)
	})

	it('rejects a token sent without the Bearer prefix', async () => {
		await request(app.getHttpServer())
			.get('/v1/auth/me')
			.set('Authorization', token)
			.expect(401)
	})

	it('rejects a token signed with another secret', async () => {
		const foreign = new JwtService({ secret: 'other-secret' }).sign({
			sub: 'user-1',
			email: 'a@b.com',
			role: Role.ADMIN,
		})
		await request(app.getHttpServer())
			.get('/v1/auth/me')
			.set('Authorization', `Bearer ${foreign}`)
			.expect(401)
	})

	it('rejects an expired token', async () => {
		const expired = jwt.sign(
			{ sub: 'user-1', email: 'a@b.com' },
			{ expiresIn: '-1s' },
		)
		await request(app.getHttpServer())
			.get('/v1/auth/me')
			.set('Authorization', `Bearer ${expired}`)
			.expect(401)
	})
})
