// @flow

import test from 'ava'
import { validateTypes } from '.'
import { scanExamples, schema } from './_helpers'

function examplesAreAnnotated (t, example) {
  t.notThrows(() => {
    validateTypes(schema, example)
  })
}

scanExamples((query) => {
  test('validateTypes', [examplesAreAnnotated], query)
})
