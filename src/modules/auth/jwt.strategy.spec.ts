import { ConfigService } from '@nestjs/config'
import { describe, expect, it } from 'vitest'
import { Role } from '../../generated/prisma/client'
import { JwtStrategy } from './jwt.strategy'

const strategy = new JwtStrategy(
	new ConfigService({ JWT_SECRET: 'test-secret' }),
)

describe('JwtStrategy', () => {
	it('maps a verified payload onto request.user', () => {
		expect(
			strategy.validate({
				sub: 'user-1',
				email: 'a@b.com',
				role: Role.USER,
			}),
		).toEqual({ sub: 'user-1', email: 'a@b.com', role: Role.USER })
	})

	it('keeps only the claims we trust, dropping anything extra', () => {
		const payload = {
			sub: 'user-1',
			email: 'a@b.com',
			role: Role.ADMIN,
			iat: 1,
			exp: 2,
			isAdmin: true,
		}
		expect(strategy.validate(payload)).toEqual({
			sub: 'user-1',
			email: 'a@b.com',
			role: Role.ADMIN,
		})
	})
})
