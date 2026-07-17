import { ApiProperty } from '@nestjs/swagger'

export class ServiceOptionDTO {
	@ApiProperty({ example: 'consulta-inicial' })
	id!: string

	@ApiProperty({ example: 'Consulta inicial' })
	name!: string

	@ApiProperty({ example: 60 })
	durationMinutes!: number
}
