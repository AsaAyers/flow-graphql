// @flow
import fs from 'fs'
import path from 'path'

const queryPath = path.join(__dirname, '../example/queries')

export const readQuery = (filename) =>
  fs.readFileSync(path.join(queryPath, filename), 'utf8')

export const schema = readQuery('../schema.graphql')

export const scanExamples = (fn) =>
  fs.readdirSync(queryPath).forEach((filename) => {
    const query = readQuery(filename)
    fn(query, filename)
  })
