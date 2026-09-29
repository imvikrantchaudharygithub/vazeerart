// studio/scripts/seed.ts
// Run: cd studio && npm run seed   (requires `npx sanity login` first)
import {createReadStream, readFileSync} from 'node:fs'
import {basename, resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'
import {buildDocuments, IMAGE_KEYS} from './lib/buildDocuments'

type Manifest = {key: string; file: string; credit: string; handle: string}[]

const client = getCliClient({apiVersion: '2026-09-29'})
const imagesDir = resolve(process.cwd(), '../design-reference/images')
const manifest = JSON.parse(readFileSync(resolve(imagesDir, 'images.json'), 'utf8')) as Manifest

async function uploadPlaceholders(): Promise<Record<string, string>> {
  const existing = await client.fetch<{_id: string; originalFilename: string}[]>(
    `*[_type == "sanity.imageAsset" && originalFilename in $names]{_id, originalFilename}`,
    {names: manifest.map((m) => m.file)},
  )
  const byFilename = new Map(existing.map((a) => [a.originalFilename, a._id]))
  const ids: Record<string, string> = {}

  for (const entry of manifest) {
    if (!IMAGE_KEYS.includes(entry.key as (typeof IMAGE_KEYS)[number])) continue
    const found = byFilename.get(entry.file)
    if (found) {
      ids[entry.key] = found
      console.log(`↺ reuse ${entry.file}`)
      continue
    }
    const asset = await client.assets.upload('image', createReadStream(resolve(imagesDir, entry.file)), {
      filename: basename(entry.file),
      source: {name: 'unsplash', id: entry.file, url: `https://unsplash.com/@${entry.handle}`},
      creditLine: entry.credit,
    })
    ids[entry.key] = asset._id
    console.log(`↑ uploaded ${entry.file} → ${asset._id}`)
  }
  return ids
}

async function main() {
  console.log(`Seeding ${client.config().projectId}/${client.config().dataset}`)
  const assetIds = await uploadPlaceholders()
  const docs = buildDocuments(assetIds)
  const tx = client.transaction()
  for (const doc of docs) tx.createOrReplace(doc)
  const result = await tx.commit()
  console.log(`✓ wrote ${result.results.length} documents`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
