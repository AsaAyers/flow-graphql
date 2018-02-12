// @flow

import test from 'ava'
import fs from 'fs'
import path from 'path'
import { annotateQuery } from './annotate-query'

const queries = path.join(__dirname, '../example/queries')

const schema = fs.readFileSync(path.join(queries, '../schema.graphql'), 'utf8')

function idempotent (t, filename) {
  const original = fs.readFileSync(path.join(queries, filename), 'utf8')
  const a = annotateQuery(schema, original)
  const b = annotateQuery(schema, a)

  t.is(a, b)
}
idempotent.title = (title, filename) => `${title} is idempotent. ${filename}`

function examplesAreAnnotated (t, filename) {
  const original = fs.readFileSync(path.join(queries, filename), 'utf8')
  const a = annotateQuery(schema, original)
  // Uncomment this to rewrite examples if the annotation format changes, or
  // another example is added.
  // fs.writeFileSync(path.join(queries, filename), a)
  t.is(original, a)
}

fs.readdirSync(queries).forEach((filename) => {
  test('annotateQuery', [idempotent, examplesAreAnnotated], filename)
})
