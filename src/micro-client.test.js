// @flow

import test from 'ava'
import { microClient } from '.'
import { schema, readQuery } from './_helpers'

test('query with parameters', async (t) => {
  // const name = 'FetchSomeIDQuery.dev'
  const name = 'HeroNameQuery.dev'
  const query = readQuery(`${name}.graphql`)
  const client = await microClient(schema, query)

  t.is(client, readQuery(`${name}.js`))
})
