import { APP_ERROR_CODES, type AppErrorCode } from './appErrorCodes'

/**
 * Get user-friendly error messages for generic application errors
 */
const getAppErrorMessage = (errorCode: AppErrorCode): string => {
	const appMessages: Record<AppErrorCode, string> = {
		// Authentication & Authorization
		[APP_ERROR_CODES.UNAUTHORIZED]: 'You need to be logged in to access this resource.',
		[APP_ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action.',
		[APP_ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
		[APP_ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
		[APP_ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',

		// Validation Errors
		[APP_ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
		[APP_ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
		[APP_ERROR_CODES.INVALID_FORMAT]: 'Please check the format of your input.',
		[APP_ERROR_CODES.INVALID_INPUT]: 'Invalid input. Please check your data and try again.',
		[APP_ERROR_CODES.FIELD_TOO_LONG]: 'This field is too long. Please shorten it.',
		[APP_ERROR_CODES.FIELD_TOO_SHORT]: 'This field is too short. Please provide more information.',
		[APP_ERROR_CODES.INVALID_EMAIL]: 'Please enter a valid email address.',
		[APP_ERROR_CODES.INVALID_URL]: 'Please enter a valid URL.',
		[APP_ERROR_CODES.INVALID_DATE]: 'Please enter a valid date.',

		// Resource Errors
		[APP_ERROR_CODES.RESOURCE_NOT_FOUND]: 'The requested resource could not be found.',
		[APP_ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 'This resource already exists.',
		[APP_ERROR_CODES.RESOURCE_CONFLICT]: 'There was a conflict with your request. Please try again.',
		[APP_ERROR_CODES.RESOURCE_LOCKED]: 'This resource is currently locked. Please try again later.',
		[APP_ERROR_CODES.RESOURCE_EXPIRED]: 'This resource has expired.',

		// Network & Server Errors
		[APP_ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
		[APP_ERROR_CODES.CONNECTION_TIMEOUT]: 'Connection timed out. Please try again.',
		[APP_ERROR_CODES.SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
		[APP_ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
		[APP_ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please slow down and try again later.',
		[APP_ERROR_CODES.REQUEST_TIMEOUT]: 'Request timed out. Please try again.',

		// File & Upload Errors
		[APP_ERROR_CODES.FILE_TOO_LARGE]: 'File is too large. Please choose a smaller file.',
		[APP_ERROR_CODES.FILE_TYPE_NOT_SUPPORTED]: 'File type not supported. Please choose a different file.',
		[APP_ERROR_CODES.UPLOAD_FAILED]: 'Upload failed. Please try again.',
		[APP_ERROR_CODES.FILE_NOT_FOUND]: 'File not found.',
		[APP_ERROR_CODES.FILE_CORRUPTED]: 'File is corrupted. Please try uploading again.',

		// Database Errors
		[APP_ERROR_CODES.DATABASE_ERROR]: 'Database error. Please try again later.',
		[APP_ERROR_CODES.DUPLICATE_ENTRY]: 'This entry already exists.',
		[APP_ERROR_CODES.FOREIGN_KEY_CONSTRAINT]: 'Cannot complete operation due to related data.',
		[APP_ERROR_CODES.DATABASE_CONNECTION_FAILED]: 'Database connection failed. Please try again later.',

		// Business Logic Errors
		[APP_ERROR_CODES.OPERATION_NOT_ALLOWED]: 'This operation is not allowed.',
		[APP_ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'You do not have sufficient permissions.',
		[APP_ERROR_CODES.QUOTA_EXCEEDED]: 'You have exceeded your quota limit.',
		[APP_ERROR_CODES.FEATURE_DISABLED]: 'This feature is currently disabled.',
		[APP_ERROR_CODES.MAINTENANCE_MODE]: 'System is under maintenance. Please try again later.',

		// Payment & Billing Errors
		[APP_ERROR_CODES.PAYMENT_FAILED]: 'Payment failed. Please try again.',
		[APP_ERROR_CODES.PAYMENT_DECLINED]: 'Payment was declined. Please check your payment method.',
		[APP_ERROR_CODES.INSUFFICIENT_BALANCE]: 'Insufficient balance. Please add funds.',
		[APP_ERROR_CODES.BILLING_ERROR]: 'Billing error. Please contact support.',
		[APP_ERROR_CODES.SUBSCRIPTION_EXPIRED]: 'Your subscription has expired. Please renew.',

		// API Errors
		[APP_ERROR_CODES.INVALID_API_KEY]: 'Invalid API key.',
		[APP_ERROR_CODES.API_LIMIT_EXCEEDED]: 'API limit exceeded. Please try again later.',
		[APP_ERROR_CODES.UNSUPPORTED_VERSION]: 'API version not supported.',
		[APP_ERROR_CODES.METHOD_NOT_ALLOWED]: 'Method not allowed.',

		// External Service Errors
		[APP_ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error. Please try again later.',
		[APP_ERROR_CODES.THIRD_PARTY_API_ERROR]: 'Third-party service error. Please try again later.',
		[APP_ERROR_CODES.WEBHOOK_FAILED]: 'Webhook delivery failed.',

		// Unknown/Fallback
		[APP_ERROR_CODES.UNKNOWN_ERROR]: 'An unknown error occurred. Please try again.',
		[APP_ERROR_CODES.INTERNAL_ERROR]: 'Internal error. Please contact support if this persists.',
	}

	return appMessages[errorCode]
}

export default getAppErrorMessage
