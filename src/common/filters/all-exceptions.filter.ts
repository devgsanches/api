import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'

interface ErrorBody {
	statusCode: number
	error: string
	message: string | string[]
	path: string
	timestamp: string
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name)

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()
		const request = ctx.getRequest<Request>()

		let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
		let error = 'Internal Server Error'
		let message: string | string[] = 'Internal server error'

		if (exception instanceof HttpException) {
			statusCode = exception.getStatus()
			const res = exception.getResponse()
			if (typeof res === 'string') {
				message = res
				error = exception.name
			} else {
				const body = res as Record<string, unknown>
				message = (body.message as string | string[]) ?? exception.message
				error = (body.error as string) ?? exception.name
			}
		} else {
			this.logger.error(exception)
		}

		const body: ErrorBody = {
			statusCode,
			error,
			message,
			path: request.url,
			timestamp: new Date().toISOString(),
		}
		response.status(statusCode).json(body)
	}
}
