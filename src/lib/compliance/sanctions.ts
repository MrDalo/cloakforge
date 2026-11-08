/**
 * Sanctions controls: embargoed jurisdictions (IP geo-block) and sanctioned wallet addresses.
 *
 * Legal basis: Council Regulation (EU) 833/2014 Art. 5b(2), 269/2014, 765/2006 and 2022/263 (occupied
 * Ukrainian areas), and US OFAC programs (the US nexus comes through the US providers Vercel and Alchemy).
 * Syria is intentionally absent: OFAC terminated the Syria program on 1 Jul 2025.
 *
 * Pure and client-safe (no secrets, no I/O) so the proxy and server routes share one source of truth.
 * The bundled address list is refreshed with `npm run sanctions:update`.
 */
import ofacList from './data/ofac-sol-addresses.json'

/** ISO 3166-1 alpha-2 countries blocked in full: Cuba, Iran, North Korea, Russia, Belarus. */
export const SANCTIONED_COUNTRIES: ReadonlySet<string> = new Set(['CU', 'IR', 'KP', 'RU', 'BY'])

/**
 * Ukrainian regions blocked (ISO 3166-2:UA subdivision codes, as sent in `x-vercel-ip-country-region`):
 * 43 Crimea, 40 Sevastopol, 14 Donetsk, 09 Luhansk, plus 23 Zaporizhzhia and 65 Kherson (EU occupied-areas
 * regime, blocked conservatively).
 */
export const SANCTIONED_UKRAINE_REGIONS: ReadonlySet<string> = new Set(['43', '40', '14', '09', '23', '65'])

/** Generic message for every sanctions refusal; never reveals which control or list matched. */
export const SANCTIONED_ADDRESS_MESSAGE = 'This address cannot be served.'

/** Vercel edge headers carrying the visitor's geolocation (set by the platform, absent in local dev). */
export const GEO_COUNTRY_HEADER = 'x-vercel-ip-country'
export const GEO_REGION_HEADER = 'x-vercel-ip-country-region'

/**
 * Whether a visitor location is in an embargoed jurisdiction.
 *
 * @param country - Value of `x-vercel-ip-country` (null/empty when unknown, e.g. local dev: allowed).
 * @param region - Value of `x-vercel-ip-country-region` (ISO 3166-2 subdivision, with or without `UA-` prefix).
 * @returns True when access must be refused.
 */
export function isBlockedLocation(country: string | null | undefined, region: string | null | undefined): boolean {
  const countryCode = country?.trim().toUpperCase()
  if (!countryCode) return false
  if (SANCTIONED_COUNTRIES.has(countryCode)) return true
  if (countryCode !== 'UA') return false

  const regionCode = region?.trim().toUpperCase().replace(/^UA-/, '')
  return !!regionCode && SANCTIONED_UKRAINE_REGIONS.has(regionCode)
}

const SANCTIONED_ADDRESSES: ReadonlySet<string> = new Set(ofacList.addresses)

/**
 * Whether a Solana address is on the bundled OFAC SDN digital-currency address list.
 * Exact (case-sensitive base58) match.
 *
 * @param address - Base58 Solana address.
 * @returns True when the address is sanctioned.
 */
export function isSanctionedAddress(address: string): boolean {
  return SANCTIONED_ADDRESSES.has(address)
}
