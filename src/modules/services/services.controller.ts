import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SERVICES, type ServiceOption } from '../../domain/services.constant'
import { ServiceOptionDTO } from './services.dto'

@ApiTags('services')
@Controller({ version: '1', path: 'services' })
export class ServicesController {
	@Get()
	@ApiOperation({ summary: 'Catalog of bookable services' })
	@ApiOkResponse({ type: [ServiceOptionDTO] })
	list(): ServiceOption[] {
		return SERVICES
	}
}
