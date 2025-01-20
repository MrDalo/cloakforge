import { ConfigType } from '../../types/config'

const getConfig = (): ConfigType => ({
  metadataTitle: process.env.METADATA_TITLE || 'Next.js template',
})

export default getConfig
