import { ApiProperty } from '@nestjs/swagger'
import { Matches } from 'class-validator'

export class AvailabilityQueryDTO {
	@ApiProperty({ description: 'Day to inspect', example: '2026-07-20' })
	@Matches(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'date must be in YYYY-MM-DD format',
	})
	date!: string
}

export class SlotAvailabilityDTO {
	@ApiProperty({ example: '09:00' })
	time!: string

	@ApiProperty()
	available!: boolean
}

export class DayAvailabilityDTO {
	@ApiProperty({ example: '2026-07-20' })
	date!: string

	@ApiProperty({ description: 'False on Sundays and past days' })
	open!: boolean

	@ApiProperty({ type: [SlotAvailabilityDTO] })
	slots!: SlotAvailabilityDTO[]
}
