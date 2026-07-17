import {
	type CanActivate,
	type ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Role } from '../../../generated/prisma/client'
import type { AuthedRequest } from '../../../modules/auth/jwt-payload'
import { ROLES_KEY } from '../../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const required = this.reflector.getAllAndOverride<Role[] | undefined>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		)
		if (!required?.length) return true

		const { user } = context.switchToHttp().getRequest<AuthedRequest>()
		if (!user || !required.includes(user.role)) {
			throw new ForbiddenException('Insufficient permissions')
		}
		return true
	}
}
