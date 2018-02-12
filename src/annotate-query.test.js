// @flow

import test from 'ava'
import { annotateQuery } from '.'
import { scanExamples, schema } from './_helpers'

function idempotent (t, query) {
  const a = annotateQuery(schema, query)
  const b = annotateQuery(schema, a)

  t.is(a, b)
}
idempotent.title = (ignoredTitle, ignoredQuery, filename) => `idempotent: ${filename}`

function examplesAreAnnotated (t, query) {
  const a = annotateQuery(schema, query)
  // Uncomment this to rewrite examples if the annotation format changes, or
  // another example is added.
  // fs.writeFileSync(path.join(queries, filename), a)
  t.is(query, a)
}
idempotent.title = (ignoredTitle, ignoredQuery, filename) => `examplesAreAnnotated: ${filename}`

scanExamples((query, filename) => {
  test('annotateQuery', [idempotent, examplesAreAnnotated], query, filename)
})

test('throws on an invalid field', (t) => {
  const query = `
  query HeroNameQuery {
    hero {
      name
      # Invalid field
      midichlorianCount
    }
  }
  `

  t.throws(() => {
    annotateQuery(schema, query)
  }, /Character\.midichlorianCount/)
})

test('throws on an invalid query', (t) => {
  const query = `
  query HeroNameQuery {
    heroo {
      name
    }
  }
  `

  t.throws(() => {
    annotateQuery(schema, query)
  }, /Query\.heroo/)
})
