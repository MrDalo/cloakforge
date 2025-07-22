interface TermsListProps {
  items: string[]
  description?: string
}

export const TermsList = ({ items, description }: TermsListProps): React.ReactNode => (
  <>
    {description && <p className='text-muted-foreground mb-4 leading-relaxed'>{description}</p>}
    <ul className='text-muted-foreground ml-6 space-y-2'>
      {items.map((item, index) => (
        <li key={index}>• {item}</li>
      ))}
    </ul>
  </>
)
