import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AvailabilityQueryDTO, DayAvailabilityDTO } from './availability.dto'
import {
	AvailabilityService,
	type DayAvailability,
} from './availability.service'

@ApiTags('availability')
@Controller({ version: '1', path: 'availability' })
export class AvailabilityController {
	constructor(private readonly availability: AvailabilityService) {}

	@Get()
	@ApiOperation({
		summary: 'Slot grid for a day, with each slot taken or free',
	})
	@ApiOkResponse({ type: DayAvailabilityDTO })
	getForDate(@Query() query: AvailabilityQueryDTO): Promise<DayAvailability> {
		return this.availability.getForDate(query.date)
	}
}
