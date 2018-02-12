// @flow
import {
  graphql,
  parse,
  buildASTSchema,
  introspectionQuery,
} from 'graphql'

export { annotateQuery } from './annotate-query'
export { validateTypes } from './validate-types'
export { microClient } from './micro-client'

export async function introspect (schema: string) {
  const schemaAst = buildASTSchema(
    parse(schema)
  )
  return JSON.stringify(
    await graphql(schemaAst, introspectionQuery),
    null,
    2
  )
}
