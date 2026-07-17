import {
	createParamDecorator,
	type ExecutionContext,
	UnauthorizedException,
} from '@nestjs/common'
import type { AuthedRequest, JwtPayload } from '../../modules/auth/jwt-payload'

export const UserAuthenticated = createParamDecorator(
	(_data: unknown, context: ExecutionContext): JwtPayload => {
		const { user } = context.switchToHttp().getRequest<AuthedRequest>()

		if (!user) {
			throw new UnauthorizedException()
		}

		return user
	},
)
