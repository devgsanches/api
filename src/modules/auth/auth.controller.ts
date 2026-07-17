import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { UserAuthenticated } from '../../common/decorators/user-authenticated.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard'
import { AuthResultDTO, LoginDTO, PublicUserDTO, RegisterDTO } from './auth.dto'
import { type AuthResult, AuthService, type PublicUser } from './auth.service'
import type { JwtPayload } from './jwt-payload'

@ApiTags('auth')
@Controller({ version: '1', path: 'auth' })
export class AuthController {
	constructor(private readonly auth: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Create an account and return a signed token' })
	@ApiCreatedResponse({ type: AuthResultDTO })
	@ApiConflictResponse({ description: 'Email already registered' })
	register(@Body() dto: RegisterDTO): Promise<AuthResult> {
		return this.auth.register(dto)
	}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Exchange credentials for a signed token' })
	@ApiOkResponse({ type: AuthResultDTO })
	@ApiUnauthorizedResponse({ description: 'Invalid credentials' })
	login(@Body() dto: LoginDTO): Promise<AuthResult> {
		return this.auth.login(dto)
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('jwt')
	@ApiOperation({ summary: 'Profile of the authenticated user' })
	@ApiOkResponse({ type: PublicUserDTO })
	me(@UserAuthenticated() user: JwtPayload): Promise<PublicUser> {
		return this.auth.findById(user.sub)
	}
}
