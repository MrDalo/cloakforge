export interface ProhibitedJurisdictionsData {
  primary: string[]
  ofacSanctioned: string[]
  usStates: string[]
  cryptoProhibited: string[]
  lastUpdated: string
}

export const prohibitedJurisdictions: ProhibitedJurisdictionsData = {
  primary: [
    "China (People's Republic of China)",
    "North Korea (Democratic People's Republic of Korea)",
    'Iran (Islamic Republic of Iran)',
    'Syria (Syrian Arab Republic)',
    'Cuba (Republic of Cuba)',
    'Russia (Russian Federation)',
    'Belarus (Republic of Belarus)',
    'Myanmar (Burma)',
    'Venezuela (Bolivarian Republic of)',
    'Afghanistan (Islamic Emirate of)',
  ],
  ofacSanctioned: [
    'Crimea region of Ukraine',
    "Donetsk People's Republic (DNR)",
    "Luhansk People's Republic (LNR)",
    'Zaporizhzhia region of Ukraine (Russian-controlled areas)',
    'Kherson region of Ukraine (Russian-controlled areas)',
  ],
  usStates: [
    'New York (BitLicense requirements)',
    'Washington (money transmitter license requirements)',
    'Hawaii (regulatory uncertainty)',
  ],
  cryptoProhibited: [
    'Bangladesh',
    'Bolivia',
    'Ecuador',
    'Egypt (variable enforcement)',
    'Morocco',
    'Nepal',
    'Qatar',
    'Algeria',
    'Macedonia',
  ],
  lastUpdated: '2026-03-22',
}

export function isJurisdictionProhibited(jurisdiction: string): boolean {
  const allJurisdictions = [
    ...prohibitedJurisdictions.primary,
    ...prohibitedJurisdictions.ofacSanctioned,
    ...prohibitedJurisdictions.usStates,
    ...prohibitedJurisdictions.cryptoProhibited,
  ]

  const query = jurisdiction.toLowerCase()

  return allJurisdictions.some((item) => item.toLowerCase().includes(query) || query.includes(item.toLowerCase()))
}

export function getJurisdictionsByCategory(category: keyof Omit<ProhibitedJurisdictionsData, 'lastUpdated'>): string[] {
  return prohibitedJurisdictions[category]
}

export function getAllProhibitedJurisdictions(): string[] {
  return [
    ...prohibitedJurisdictions.primary,
    ...prohibitedJurisdictions.ofacSanctioned,
    ...prohibitedJurisdictions.usStates,
    ...prohibitedJurisdictions.cryptoProhibited,
  ]
}
