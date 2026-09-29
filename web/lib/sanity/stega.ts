import type {FilterDefault} from '@sanity/client'

/** Enum-like string fields the mappers compare by value; never stega-encode them. */
export const STEGA_EXCLUDED_KEYS: ReadonlySet<string> = new Set(['category', 'ratio', 'kind', 'target'])

export const stegaFilter: FilterDefault = (props) => {
  const end = props.sourcePath.at(-1)
  if (typeof end === 'string' && STEGA_EXCLUDED_KEYS.has(end)) return false
  return props.filterDefault(props)
}
