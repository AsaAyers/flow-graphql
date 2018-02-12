// @flow
import transform from 'transform-graphql-type-annotations'
import { introspect } from '.'

export async function microClient (schema: string, query) {
  const schemaJson = await introspect(schema)

  try {
    // console.log(schemaJson)
    console.log('query', query)
    const flowtypes = transform(schemaJson, query, 'flow')
    return flowtypes
  } catch (e) {
    console.error(e)
  }
}
