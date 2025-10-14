/**
 * Simplified Error Handling System
 *
 * Export all error handling utilities from one place
 */

export { AppError, ERROR_MESSAGES, type ErrorCode } from './AppError'
export { handleError, isErrorCode, getErrorCode } from './errorHandler'
