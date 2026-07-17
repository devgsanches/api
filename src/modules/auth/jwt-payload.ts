import type { Request } from 'express'
import type { Role } from '../../generated/prisma/client'

export interface JwtPayload {
	sub: string
	email: string
	role: Role
}

export type AuthedRequest = Request & { user?: JwtPayload }
