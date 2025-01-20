export type ServerActionResponseBaseType<T> = {
  status_code: number
  status: ResponseStatus
  error_message: string
  data: T
}
