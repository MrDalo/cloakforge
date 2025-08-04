import { TokenCreatorFormData } from '@/components/pages/TokenCreatorPage/TokenCreationForm/tokenCreatorFormSchema'

/**
 * Validates token creation form data before submitting to blockchain
 * This function performs client-side validation to catch errors early
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export const validateTokenData = (tokenData: TokenCreatorFormData): ValidationResult => {
  const errors: string[] = []

  // Name validation
  if (!tokenData.name?.trim()) {
    errors.push('Token name is required')
  } else if (tokenData.name.trim().length > 32) {
    errors.push('Token name must be 32 characters or less')
  }

  // Symbol validation
  if (!tokenData.symbol?.trim()) {
    errors.push('Token symbol is required')
  } else if (tokenData.symbol.trim().length > 10) {
    errors.push('Token symbol must be 10 characters or less')
  }

  // Description validation
  if (tokenData.description && tokenData.description.length > 500) {
    errors.push('Token description must be 500 characters or less')
  }

  // Total supply validation
  if (!tokenData.totalSupply || Number(tokenData.totalSupply) <= 0) {
    errors.push('Valid total supply is required')
  } else if (Number(tokenData.totalSupply) > Number.MAX_SAFE_INTEGER) {
    errors.push('Total supply is too large')
  }

  // Decimals validation
  const decimals = Number(tokenData.decimals)
  if (decimals < 0 || decimals > 9) {
    errors.push('Decimals must be between 0 and 9')
  }

  // URL validations
  if (tokenData.website && tokenData.website.length > 200) {
    errors.push('Website URL must be 200 characters or less')
  }

  if (tokenData.twitter && tokenData.twitter.length > 200) {
    errors.push('Twitter URL must be 200 characters or less')
  }

  if (tokenData.telegram && tokenData.telegram.length > 200) {
    errors.push('Telegram URL must be 200 characters or less')
  }

  if (tokenData.discord && tokenData.discord.length > 200) {
    errors.push('Discord URL must be 200 characters or less')
  }

  // URL format validation (basic)
  const urlPattern = /^https?:\/\/.+/
  if (tokenData.website && !urlPattern.test(tokenData.website)) {
    errors.push('Website must be a valid HTTP(S) URL')
  }

  if (tokenData.twitter && !urlPattern.test(tokenData.twitter)) {
    errors.push('Twitter must be a valid HTTP(S) URL')
  }

  if (tokenData.telegram && !urlPattern.test(tokenData.telegram)) {
    errors.push('Telegram must be a valid HTTP(S) URL')
  }

  if (tokenData.discord && !urlPattern.test(tokenData.discord)) {
    errors.push('Discord must be a valid HTTP(S) URL')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export default validateTokenData
