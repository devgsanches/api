import { ApiProperty } from '@nestjs/swagger'
import { IsIn, Matches } from 'class-validator'
import { BookingStatus } from '../../domain/booking-status'
import { SERVICE_IDS } from '../../domain/services.constant'
import { SLOT_TIMES } from '../../domain/slots'

export class CreateBookingDTO {
	@ApiProperty({ enum: SERVICE_IDS, description: 'Id of a catalog service' })
	@IsIn(SERVICE_IDS, {
		message: 'service must be one of the available services',
	})
	service!: string

	@ApiProperty({ example: '2026-07-20' })
	@Matches(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'date must be in YYYY-MM-DD format',
	})
	date!: string

	@ApiProperty({ enum: SLOT_TIMES, example: '09:00' })
	@IsIn(SLOT_TIMES, { message: 'time must be a valid slot' })
	time!: string
}

export class BookingUserDTO {
	@ApiProperty()
	id!: string

	@ApiProperty()
	name!: string

	@ApiProperty()
	email!: string

	@ApiProperty()
	phone!: string
}

export class BookingResponseDTO {
	@ApiProperty()
	id!: string

	@ApiProperty()
	userId!: string

	@ApiProperty()
	service!: string

	@ApiProperty({ example: '2026-07-20' })
	date!: string

	@ApiProperty({ example: '09:00' })
	time!: string

	@ApiProperty({ enum: BookingStatus })
	status!: BookingStatus

	@ApiProperty()
	createdAt!: Date

	@ApiProperty()
	updatedAt!: Date

	@ApiProperty({ type: BookingUserDTO, required: false })
	user?: BookingUserDTO
}
