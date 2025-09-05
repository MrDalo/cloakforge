import { isAxiosError } from 'axios'
import { HTTPError, SolanaError, AppError } from '@/types/error'

const getStatusCodeFromError = (error: unknown): number => {
  if (isAxiosError(error)) {
    return error?.response?.status || 500
  } else if (error instanceof HTTPError || error instanceof SolanaError || error instanceof AppError) {
    return error.status
  } else if (error instanceof Error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (error as any)?.status || 500
  } else {
    return 500
  }
}

export default getStatusCodeFromError
