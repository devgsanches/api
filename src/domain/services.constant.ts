export interface ServiceOption {
	id: string
	name: string
	durationMinutes: number
}

export const SERVICES: ServiceOption[] = [
	{ id: 'consulta-inicial', name: 'Consulta inicial', durationMinutes: 60 },
	{ id: 'retorno', name: 'Retorno', durationMinutes: 60 },
	{ id: 'avaliacao', name: 'Avaliação', durationMinutes: 60 },
	{ id: 'sessao', name: 'Sessão', durationMinutes: 60 },
]

export const SERVICE_IDS: string[] = SERVICES.map((s) => s.id)

export function isValidService(id: string): boolean {
	return SERVICE_IDS.includes(id)
}
