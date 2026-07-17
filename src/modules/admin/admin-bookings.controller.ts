import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles/roles.guard'
import { Role } from '../../generated/prisma/client'
import type { BookingResponse } from '../bookings/booking.serializer'
import { BookingResponseDTO } from '../bookings/bookings.dto'
import { ListBookingsQueryDTO, UpdateStatusDTO } from './admin.dto'
import { AdminBookingsService } from './admin-bookings.service'

@ApiTags('admin')
@ApiBearerAuth('jwt')
@ApiForbiddenResponse({ description: 'Requires the ADMIN role' })
@Controller({ version: '1', path: 'admin/bookings' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminBookingsController {
	constructor(private readonly adminBookings: AdminBookingsService) {}

	@Get()
	@ApiOperation({ summary: 'List every booking, optionally filtered' })
	@ApiOkResponse({ type: [BookingResponseDTO] })
	list(@Query() query: ListBookingsQueryDTO): Promise<BookingResponse[]> {
		return this.adminBookings.list(query)
	}

	@Patch(':id/status')
	@ApiOperation({ summary: 'Move a booking to another status' })
	@ApiOkResponse({ type: BookingResponseDTO })
	@ApiNotFoundResponse({ description: 'Booking not found' })
	@ApiUnprocessableEntityResponse({ description: 'Transition not allowed' })
	updateStatus(
		@Param('id') id: string,
		@Body() dto: UpdateStatusDTO,
	): Promise<BookingResponse> {
		return this.adminBookings.updateStatus(id, dto)
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete a booking for good' })
	@ApiNoContentResponse({ description: 'Booking deleted' })
	@ApiNotFoundResponse({ description: 'Booking not found' })
	remove(@Param('id') id: string): Promise<void> {
		return this.adminBookings.remove(id)
	}
}
