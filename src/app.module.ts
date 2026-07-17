import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AdminModule } from './modules/admin/admin.module'
import { AuthModule } from './modules/auth/auth.module'
import { AvailabilityModule } from './modules/availability/availability.module'
import { BookingsModule } from './modules/bookings/bookings.module'
import { ServicesModule } from './modules/services/services.module'
import { PrismaModule } from './prisma.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		PrismaModule,
		ServicesModule,
		AvailabilityModule,
		BookingsModule,
		AuthModule,
		AdminModule,
	],
	controllers: [AppController],
})
export class AppModule {}
