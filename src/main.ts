import 'dotenv/config'

import { ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.enableVersioning({ type: VersioningType.URI })

	const corsOrigin = process.env.CORS_ORIGIN ?? '*'
	const origins = corsOrigin.split(',').map((o) => o.trim())
	app.enableCors({
		origin: origins.includes('*') ? true : origins,
		credentials: true,
	})

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	)
	app.useGlobalFilters(new AllExceptionsFilter())

	const config = new DocumentBuilder()
		.setTitle('Booking API')
		.setDescription(
			'Service scheduling: authentication, slot availability, customer bookings and admin management.',
		)
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				name: 'Authorization',
				in: 'header',
			},
			'jwt',
		)
		.build()
	SwaggerModule.setup('docs', app, () =>
		SwaggerModule.createDocument(app, config),
	)

	await app.listen(process.env.PORT ?? 3333)
}
bootstrap()
