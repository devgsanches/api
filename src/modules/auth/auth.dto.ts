import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	Matches,
	MaxLength,
	MinLength,
} from 'class-validator'
import { Role } from '../../generated/prisma/client'

export class RegisterDTO {
	@ApiProperty({ description: 'Full name', example: 'Maria Silva' })
	@IsString()
	@IsNotEmpty()
	@MinLength(2)
	@MaxLength(120)
	@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
	name!: string

	@ApiProperty({ example: 'maria@example.com' })
	@IsEmail({}, { message: 'email must be a valid email address' })
	@Transform(({ value }) =>
		typeof value === 'string' ? value.trim().toLowerCase() : value,
	)
	email!: string

	@ApiProperty({
		description: 'Brazilian phone number',
		example: '(11) 98765-4321',
	})
	@IsString()
	@Matches(/^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/, {
		message: 'phone must be a valid Brazilian phone number',
	})
	phone!: string

	@ApiProperty({ minLength: 6, maxLength: 72, example: 'secret123' })
	@IsString()
	@MinLength(6, { message: 'password must be at least 6 characters long' })
	@MaxLength(72, { message: 'password must be at most 72 characters long' })
	password!: string
}

export class LoginDTO {
	@ApiProperty({ example: 'maria@example.com' })
	@IsEmail({}, { message: 'email must be a valid email address' })
	@Transform(({ value }) =>
		typeof value === 'string' ? value.trim().toLowerCase() : value,
	)
	email!: string

	@ApiProperty({ example: 'secret123' })
	@IsString()
	@IsNotEmpty()
	password!: string
}

export class PublicUserDTO {
	@ApiProperty()
	id!: string

	@ApiProperty()
	name!: string

	@ApiProperty()
	email!: string

	@ApiProperty()
	phone!: string

	@ApiProperty({ enum: Role })
	role!: Role
}

export class AuthResultDTO {
	@ApiProperty({ description: 'Signed JWT, valid for 1 day' })
	access_token!: string

	@ApiProperty({ type: PublicUserDTO })
	user!: PublicUserDTO
}
