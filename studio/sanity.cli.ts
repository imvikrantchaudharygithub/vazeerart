import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'iq6do512',
    dataset: 'production',
  },
  studioHost: 'vazeerart',
  deployment: {
    autoUpdates: true,
  },
})
