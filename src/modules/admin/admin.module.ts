import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AdminBookingsController } from './admin-bookings.controller'
import { AdminBookingsService } from './admin-bookings.service'

@Module({
	imports: [AuthModule],
	controllers: [AdminBookingsController],
	providers: [AdminBookingsService],
})
export class AdminModule {}
