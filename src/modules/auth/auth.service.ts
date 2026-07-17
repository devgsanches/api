import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare, hash } from 'bcryptjs'
import { Role } from '../../generated/prisma/client'
import { PrismaService } from '../../prisma.service'
import type { LoginDTO, RegisterDTO } from './auth.dto'
import type { JwtPayload } from './jwt-payload'

const SALT_ROUNDS = 10

export interface PublicUser {
	id: string
	name: string
	email: string
	phone: string
	role: Role
}

export interface AuthResult {
	access_token: string
	user: PublicUser
}

interface UserRow extends PublicUser {
	passwordHash: string
}

function isUniqueViolation(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		(error as { code: unknown }).code === 'P2002'
	)
}

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService,
	) {}

	async register(dto: RegisterDTO): Promise<AuthResult> {
		const passwordHash = await hash(dto.password, SALT_ROUNDS)

		try {
			const user = await this.prisma.user.create({
				data: {
					name: dto.name,
					email: dto.email,
					phone: dto.phone,
					passwordHash,
					role: Role.USER,
				},
			})
			return this.buildResult(user)
		} catch (error) {
			if (isUniqueViolation(error)) {
				throw new ConflictException('Email already registered')
			}
			throw error
		}
	}

	async login(dto: LoginDTO): Promise<AuthResult> {
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email },
		})
		if (!user || !(await compare(dto.password, user.passwordHash))) {
			throw new UnauthorizedException('Invalid credentials')
		}
		return this.buildResult(user)
	}

	async findById(id: string): Promise<PublicUser> {
		const user = await this.prisma.user.findUnique({
			where: { id },
			select: { id: true, name: true, email: true, phone: true, role: true },
		})
		if (!user) {
			throw new UnauthorizedException('User no longer exists')
		}
		return user
	}

	private buildResult(user: UserRow): AuthResult {
		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		}
		return {
			access_token: this.jwt.sign(payload),
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone,
				role: user.role,
			},
		}
	}
}
