import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, Matches } from 'class-validator'
import { BookingStatus } from '../../domain/booking-status'

export class ListBookingsQueryDTO {
	@ApiPropertyOptional({ description: 'Filter by day', example: '2026-07-20' })
	@IsOptional()
	@Matches(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'date must be in YYYY-MM-DD format',
	})
	date?: string

	@ApiPropertyOptional({ enum: BookingStatus })
	@IsOptional()
	@IsIn(Object.values(BookingStatus))
	status?: BookingStatus
}

export class UpdateStatusDTO {
	@ApiProperty({ enum: BookingStatus })
	@IsIn(Object.values(BookingStatus), {
		message: 'status must be one of SCHEDULED, CONFIRMED, COMPLETED, CANCELLED',
	})
	status!: BookingStatus
}
