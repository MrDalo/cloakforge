import { createClient } from 'contentful'
import { Document } from '@contentful/rich-text-types'
import { getLogger } from '@/lib/logger/logger'
import 'server-only'

// Contentful client configuration
const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
})

// ✅ Module-level loggers for better performance and organization
const blogLogger = getLogger({ context: 'contentful', function: 'blog' })
const toolConfigLogger = getLogger({ context: 'contentful', function: 'toolConfig' })
const bannerLogger = getLogger({ context: 'contentful', function: 'banner' })

// Type definitions for Contentful entries
export interface BlogPost {
  title: string
  slug: string
  content: Document // Rich text content properly typed
  excerpt: string
  author: string
  publishedAt: string
  tags: string[]
  coverImage?: {
    fields: {
      file: {
        url: string
        details: {
          image: {
            width: number
            height: number
          }
        }
      }
    }
  }
}

export interface ToolConfiguration {
  toolId: string
  isEnabled: boolean
  disabledMessage?: string
  baseFee: number
  networkFee: number
  priorityFee?: number
}

export interface SiteBanner {
  isActive: boolean
  type: 'warning' | 'info' | 'maintenance'
  title: string
  message: string
  showOnPages: string[]
}

// Blog functions
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const entries = await client.getEntries({
      content_type: 'blogPost',
      order: ['-sys.createdAt'],
      limit: 20,
    })

    return entries.items.map((item) => ({
      title: String(item.fields.title || ''),
      slug: String(item.fields.slug || ''),
      content: item.fields.content as Document,
      excerpt: String(item.fields.excerpt || ''),
      author: String(item.fields.author || ''),
      publishedAt: String(item.fields.publishedAt || ''),
      tags: Array.isArray(item.fields.tags) ? item.fields.tags.map(String) : [],
      coverImage: item.fields.coverImage as BlogPost['coverImage'],
    }))
  } catch (error) {
    blogLogger.error('Error fetching blog posts:', error)
    return []
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const entries = await client.getEntries({
      content_type: 'blogPost',
      'fields.slug': slug,
      limit: 1,
    })

    if (entries.items.length === 0) {
      return null
    }

    const item = entries.items[0]
    return {
      title: String(item.fields.title || ''),
      slug: String(item.fields.slug || ''),
      content: item.fields.content as Document,
      excerpt: String(item.fields.excerpt || ''),
      author: String(item.fields.author || ''),
      publishedAt: String(item.fields.publishedAt || ''),
      tags: Array.isArray(item.fields.tags) ? item.fields.tags.map(String) : [],
      coverImage: item.fields.coverImage as BlogPost['coverImage'],
    }
  } catch (error) {
    blogLogger.error('Error fetching blog post:', error)
    return null
  }
}

// Tool configuration functions
export async function getToolConfiguration(toolId: string): Promise<ToolConfiguration | null> {
  try {
    const entries = await client.getEntries({
      content_type: 'toolConfiguration',
      'fields.toolId': toolId,
      limit: 1,
    })

    if (entries.items.length === 0) {
      return null
    }

    const item = entries.items[0]
    return {
      toolId: String(item.fields.toolId || ''),
      isEnabled: Boolean(item.fields.isEnabled),
      disabledMessage: item.fields.disabledMessage ? String(item.fields.disabledMessage) : undefined,
      baseFee: Number(item.fields.baseFee || 0.1),
      networkFee: Number(item.fields.networkFee || 0.01),
      priorityFee: item.fields.priorityFee ? Number(item.fields.priorityFee) : undefined,
    }
  } catch (error) {
    toolConfigLogger.error('Error fetching tool configuration:', error)
    return null
  }
}

export async function getAllToolConfigurations(): Promise<ToolConfiguration[]> {
  try {
    const entries = await client.getEntries({
      content_type: 'toolConfiguration',
    })

    return entries.items.map((item) => ({
      toolId: String(item.fields.toolId || ''),
      isEnabled: Boolean(item.fields.isEnabled),
      disabledMessage: item.fields.disabledMessage ? String(item.fields.disabledMessage) : undefined,
      baseFee: Number(item.fields.baseFee || 0.1),
      networkFee: Number(item.fields.networkFee || 0.01),
      priorityFee: item.fields.priorityFee ? Number(item.fields.priorityFee) : undefined,
    }))
  } catch (error) {
    toolConfigLogger.error('Error fetching tool configurations:', error)
    return []
  }
}

// Site banner functions
export async function getSiteBanner(): Promise<SiteBanner | null> {
  try {
    const entries = await client.getEntries({
      content_type: 'siteBanner',
      'fields.isActive': true,
      limit: 1,
      order: ['-sys.createdAt'],
    })

    if (entries.items.length === 0) {
      return null
    }

    const item = entries.items[0]
    return {
      isActive: Boolean(item.fields.isActive),
      type: String(item.fields.type) as SiteBanner['type'],
      title: String(item.fields.title || ''),
      message: String(item.fields.message || ''),
      showOnPages: Array.isArray(item.fields.showOnPages) ? item.fields.showOnPages.map(String) : ['all'],
    }
  } catch (error) {
    bannerLogger.error('Error fetching site banner:', error)
    return null
  }
}

// Export the client for direct usage if needed
export { client }
