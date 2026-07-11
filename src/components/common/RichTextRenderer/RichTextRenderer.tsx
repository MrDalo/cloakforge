import { documentToReactComponents, type Options } from '@contentful/rich-text-react-renderer'
import { type Document, BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Code } from 'lucide-react'

interface RichTextRendererProps {
  content: Document
  className?: string
}

// Define render options outside component to avoid re-creation
const renderOptions: Options = {
  renderMark: {
    [MARKS.BOLD]: (text) => <strong className='font-semibold'>{text}</strong>,
    [MARKS.ITALIC]: (text) => <em className='italic'>{text}</em>,
    [MARKS.UNDERLINE]: (text) => <u className='underline'>{text}</u>,
    [MARKS.CODE]: (text) => <code className='bg-muted text-muted-foreground mx-1 rounded px-1.5 py-0.5 font-mono text-sm'>{text}</code>,
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node, children) => <p className='text-foreground mb-4 leading-7'>{children}</p>,
    [BLOCKS.HEADING_1]: (node, children) => <h1 className='mt-8 mb-6 text-3xl font-bold tracking-tight first:mt-0'>{children}</h1>,
    [BLOCKS.HEADING_2]: (node, children) => <h2 className='mt-8 mb-4 text-2xl font-semibold tracking-tight first:mt-0'>{children}</h2>,
    [BLOCKS.HEADING_3]: (node, children) => <h3 className='mt-6 mb-3 text-xl font-semibold tracking-tight first:mt-0'>{children}</h3>,
    [BLOCKS.UL_LIST]: (node, children) => <ul className='mb-4 ml-6 list-disc space-y-2'>{children}</ul>,
    [BLOCKS.OL_LIST]: (node, children) => <ol className='mb-4 ml-6 list-decimal space-y-2'>{children}</ol>,
    [BLOCKS.LIST_ITEM]: (node, children) => <li className='text-foreground leading-7'>{children}</li>,
    [BLOCKS.QUOTE]: (node, children) => (
      <blockquote className='border-primary bg-primary/5 mb-4 border-l-4 py-2 pl-4 italic'>{children}</blockquote>
    ),
    [BLOCKS.HR]: () => <hr className='border-border my-8 border-t' />,
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const { file, title, description } = node.data.target.fields
      const imageUrl = `https:${file.url}`

      return (
        <div className='my-6'>
          <Image
            alt={description || title || 'Blog image'}
            className='rounded-lg'
            height={file.details?.image?.height || 400}
            src={imageUrl}
            width={file.details?.image?.width || 800}
          />
          {(title || description) && <p className='text-muted-foreground mt-2 text-center text-sm italic'>{description || title}</p>}
        </div>
      )
    },
    [INLINES.HYPERLINK]: (node, children) => {
      const { uri } = node.data
      const isExternal = uri.startsWith('http')

      if (isExternal) {
        return (
          <a
            className='text-primary hover:text-primary/80 inline-flex items-center gap-1 underline transition-colors'
            href={uri}
            rel='noopener noreferrer'
            target='_blank'
          >
            {children}
            <ExternalLink className='h-3 w-3' />
          </a>
        )
      }

      return (
        <Link className='text-primary hover:text-primary/80 underline transition-colors' href={uri}>
          {children}
        </Link>
      )
    },
    [BLOCKS.EMBEDDED_ENTRY]: (node) => {
      if (node.data.target.sys.contentType?.sys.id === 'codeBlock') {
        const { language, code } = node.data.target.fields
        return (
          <div className='my-6'>
            <div className='bg-muted border-border overflow-hidden rounded-lg border'>
              <div className='bg-muted-foreground/10 flex items-center justify-between px-4 py-2'>
                <Badge variant='secondary'>
                  <Code className='mr-1 h-3 w-3' />
                  {language || 'code'}
                </Badge>
              </div>
              <pre className='overflow-x-auto p-4'>
                <code className='text-foreground font-mono text-sm'>{code}</code>
              </pre>
            </div>
          </div>
        )
      }

      return <div className='my-4 rounded-lg border p-4'>Embedded content</div>
    },
  },
}

export const RichTextRenderer = ({ content, className = '' }: RichTextRendererProps): React.ReactElement => (
  <div className={`rich-text-content ${className}`}>{documentToReactComponents(content, renderOptions)}</div>
)
