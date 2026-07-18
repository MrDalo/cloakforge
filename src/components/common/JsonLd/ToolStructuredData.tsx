import { FaqJsonLd, type FaqEntry } from './FaqJsonLd'
import { SoftwareApplicationJsonLd } from './SoftwareApplicationJsonLd'
import { BreadcrumbJsonLd } from './BreadcrumbJsonLd'
import { HowToJsonLd, type HowToStep } from './HowToJsonLd'

const BASE_URL = 'https://cloakforge.app'

interface ToolStructuredDataProps {
  name: string
  description: string
  path: string
  faqs: FaqEntry[]
  howToSteps: HowToStep[]
}

/**
 * Combines the SoftwareApplication, BreadcrumbList (Home > Tools > tool),
 * HowTo, and FAQPage JSON-LD that every tool page needs, so each tool's
 * layout.tsx only has to pass its own name/description/path/faqs/howToSteps once.
 *
 * @param name - Short tool name (e.g. "Token Creator").
 * @param description - One or two sentence description of what the tool does.
 * @param path - Tool route starting with a slash (e.g. "/tools/token-creator").
 * @param faqs - The tool's FAQ entries (question/answer pairs).
 * @param howToSteps - Ordered steps a user takes to complete the tool's task.
 * @returns The combined JSON-LD script tags for the tool page.
 */
export const ToolStructuredData = ({ name, description, path, faqs, howToSteps }: ToolStructuredDataProps): React.ReactNode => {
  const url = `${BASE_URL}${path}`

  return (
    <>
      <SoftwareApplicationJsonLd description={description} name={name} url={url} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: BASE_URL },
          { name: 'Tools', url: `${BASE_URL}/tools` },
          { name, url },
        ]}
      />
      <HowToJsonLd description={description} name={`How to Use ${name} - CloakForge`} steps={howToSteps} />
      <FaqJsonLd faqs={faqs} />
    </>
  )
}

export default ToolStructuredData
