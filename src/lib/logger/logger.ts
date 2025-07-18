/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import pino from 'pino'

let logger: pino.Logger | null = null

const getServerLogger = () => {
	if (!logger) {
		logger = pino({
			transport: {
				target: 'pino-pretty',
				options: {
					colorize: true,
					translateTime: 'SYS:standard',
					ignore: 'pid,hostname',
				},
			},
			formatters: {
				level: (label) => ({ level: label }),
			},
		})
	}
	return logger
}

export const logToServer = (level: string, ...args: any[]): void => {
	// You can POST to an API endpoint here if on the client
	fetch('/api/log', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ level, args }),
	})
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getLogger = (context: Record<string, any> = {}) => {
	if (typeof window === 'undefined') {
		// Server: use pino directly
		return getServerLogger().child(context)
	} else {
		// Client: send logs to server
		return {
			info: (...args: any[]) => logToServer('info', ...args, context),
			warn: (...args: any[]) => logToServer('warn', ...args, context),
			error: (...args: any[]) => logToServer('error', ...args, context),
			debug: (...args: any[]) => logToServer('debug', ...args, context),
		}
	}
}
