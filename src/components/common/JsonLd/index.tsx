/** A single JSON-LD (schema.org) object to render as a `<script type="application/ld+json">` tag. */
type JsonLdData = Record<string, unknown>

interface JsonLdProps {
  data: JsonLdData
}

/**
 * Renders a schema.org JSON-LD `<script>` tag for structured data (Organization,
 * WebSite, FAQPage, etc). Escapes `<` so a string value can never prematurely
 * close the script tag.
 *
 * @param data - The JSON-LD object (must include `@context` and `@type`).
 * @returns A script tag containing the serialized structured data.
 */
export const JsonLd = ({ data }: JsonLdProps): React.ReactNode => (
  <script dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} type='application/ld+json' />
)

export default JsonLd
