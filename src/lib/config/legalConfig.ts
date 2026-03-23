export interface LegalEntityInfo {
  name: string
  address: string
  ico: string
  email: string
}

export function getLegalEntityInfo(): LegalEntityInfo {
  const isProduction = process.env.NODE_ENV === 'production'

  const name = process.env.LEGAL_ENTITY_NAME
  const address = process.env.LEGAL_ENTITY_ADDRESS
  const ico = process.env.LEGAL_ENTITY_ICO
  const email = process.env.LEGAL_CONTACT_EMAIL

  // Validate all required fields are present
  const missingFields = []
  if (!name) missingFields.push('LEGAL_ENTITY_NAME')
  if (!address) missingFields.push('LEGAL_ENTITY_ADDRESS')
  if (!ico) missingFields.push('LEGAL_ENTITY_ICO')
  if (!email) missingFields.push('LEGAL_CONTACT_EMAIL')

  if (missingFields.length > 0) {
    if (isProduction) {
      throw new Error(`Missing required legal entity information: ${missingFields.join(', ')}`)
    }

    // Return placeholder values in development
    return {
      name: name || '[LEGAL_ENTITY_NAME required]',
      address: address || '[LEGAL_ENTITY_ADDRESS required]',
      ico: ico || '[LEGAL_ENTITY_ICO required]',
      email: email || '[LEGAL_CONTACT_EMAIL required]',
    }
  }

  return {
    name: name!,
    address: address!,
    ico: ico!,
    email: email!,
  }
}
