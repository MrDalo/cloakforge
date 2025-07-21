export type ResponseStatus = 'success' | 'error'

export type ApiResponseBase<T> = {
  status_code: number
  status: ResponseStatus
  error_message: string
  error_code?: string // For programmatic error handling
  data: T
}

export class HTTPError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HTTPError'
    this.status = status
  }
}
