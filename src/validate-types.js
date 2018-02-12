// @flow

import { walkQuery, versionRegex, version } from './annotate-query'

function extractTypeTree (query: string) {
  const idx = query.lastIndexOf('#{')
  if (idx === -1) {
    throw new Error(`Unable to find Type Tree`)
  }

  const text = query.substring(idx)
    .split('\n')
    // Remove the leading #
    .map((l) => l.substring(1))
    .join('\n')

  return JSON.parse(text)
}

export function validateTypes (schemaText: string, query: string) {
  const versionMatch = query.match(versionRegex)

  // ignore files without a version
  if (versionMatch == null) { return }
  // Version 2 dropped support for Version 1 annotations.
  if (Number(versionMatch[1]) === 1) { return }

  if (Number(versionMatch[1]) > version) {
    // eslint-disable-next-line no-console
    console.warn(`Tried to validate a locked query built with v${versionMatch[1]}`)
    return
  }

  const typeTree = extractTypeTree(query)
  walkQuery(schemaText, query, typeTree, true)
}
