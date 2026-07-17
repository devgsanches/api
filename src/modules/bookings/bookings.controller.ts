import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common'
import {
	ApiBearerAuth,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger'
import { UserAuthenticated } from '../../common/decorators/user-authenticated.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard'
import type { JwtPayload } from '../auth/jwt-payload'
import type { BookingResponse } from './booking.serializer'
import { BookingResponseDTO, CreateBookingDTO } from './bookings.dto'
import { BookingsService } from './bookings.service'

@ApiTags('bookings')
@ApiBearerAuth('jwt')
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
export class BookingsController {
	constructor(private readonly bookings: BookingsService) {}

	@Post('bookings')
	@ApiOperation({ summary: 'Book a slot for the authenticated user' })
	@ApiCreatedResponse({ type: BookingResponseDTO })
	@ApiConflictResponse({ description: 'Slot has just been taken' })
	create(
		@UserAuthenticated() user: JwtPayload,
		@Body() dto: CreateBookingDTO,
	): Promise<BookingResponse> {
		return this.bookings.create(user.sub, dto)
	}

	@Get('me/bookings')
	@ApiOperation({ summary: 'List the bookings of the authenticated user' })
	@ApiOkResponse({ type: [BookingResponseDTO] })
	findMine(@UserAuthenticated() user: JwtPayload): Promise<BookingResponse[]> {
		return this.bookings.findMine(user.sub)
	}

	@Patch('me/bookings/:id/cancel')
	@ApiOperation({ summary: 'Cancel an own booking, freeing its slot' })
	@ApiOkResponse({ type: BookingResponseDTO })
	@ApiNotFoundResponse({ description: 'Booking not found' })
	cancelMine(
		@UserAuthenticated() user: JwtPayload,
		@Param('id') id: string,
	): Promise<BookingResponse> {
		return this.bookings.cancelMine(id, user.sub)
	}

	@Get('bookings/:id')
	@ApiOperation({ summary: 'Read a booking (owner or admin only)' })
	@ApiOkResponse({ type: BookingResponseDTO })
	@ApiNotFoundResponse({ description: 'Booking not found' })
	findById(
		@UserAuthenticated() user: JwtPayload,
		@Param('id') id: string,
	): Promise<BookingResponse> {
		return this.bookings.findById(id, user)
	}
}
