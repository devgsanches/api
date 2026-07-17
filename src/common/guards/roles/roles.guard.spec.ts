import type { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { describe, expect, it } from 'vitest'
import { Role } from '../../../generated/prisma/client'
import type { JwtPayload } from '../../../modules/auth/jwt-payload'
import { ROLES_KEY } from '../../decorators/roles.decorator'
import { RolesGuard } from './roles.guard'

function contextForUser(user?: JwtPayload): ExecutionContext {
	return {
		switchToHttp: () => ({ getRequest: () => ({ user }) }),
		getHandler: () => () => undefined,
		getClass: () => class {},
	} as unknown as ExecutionContext
}

function reflectorRequiring(roles?: Role[]): Reflector {
	const reflector = new Reflector()
	reflector.getAllAndOverride = ((key: string) =>
		key === ROLES_KEY ? roles : undefined) as Reflector['getAllAndOverride']
	return reflector
}

describe('RolesGuard', () => {
	const admin: JwtPayload = {
		sub: 'u1',
		email: 'admin@x.com',
		role: Role.ADMIN,
	}
	const customer: JwtPayload = { sub: 'u2', email: 'c@x.com', role: Role.USER }

	it('allows any user when the route declares no roles', () => {
		const guard = new RolesGuard(reflectorRequiring(undefined))
		expect(guard.canActivate(contextForUser(customer))).toBe(true)
	})

	it('allows a user whose role is required', () => {
		const guard = new RolesGuard(reflectorRequiring([Role.ADMIN]))
		expect(guard.canActivate(contextForUser(admin))).toBe(true)
	})

	it('rejects a user without the required role', () => {
		const guard = new RolesGuard(reflectorRequiring([Role.ADMIN]))
		expect(() => guard.canActivate(contextForUser(customer))).toThrow()
	})

	it('rejects when there is no authenticated user', () => {
		const guard = new RolesGuard(reflectorRequiring([Role.ADMIN]))
		expect(() => guard.canActivate(contextForUser(undefined))).toThrow()
	})
})
