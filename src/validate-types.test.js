// @flow

import test from 'ava'
import fs from 'fs'
import path from 'path'
import { validateTypes } from '.'

const queries = path.join(__dirname, '../example/queries')

const schema = fs.readFileSync(path.join(queries, '../schema.graphql'), 'utf8')

function examplesAreAnnotated (t, filename) {
  const example = fs.readFileSync(path.join(queries, filename), 'utf8')
  t.notThrows(() => {
    validateTypes(schema, example)
  })
}

fs.readdirSync(queries).forEach((filename) => {
  test('validateTypes', [examplesAreAnnotated], filename)
})
