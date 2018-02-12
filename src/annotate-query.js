// @flow

import R from 'ramda'
import {
  TypeInfo,
  visitWithTypeInfo,
  typeFromAST,
  parse,
  buildASTSchema,
  visit,
} from 'graphql'

export const version = 2
const header = `
# This file was automatically generated and should not be edited.
# I couldn't get a custom directive to work, so LockedQuery uses comments
#
# LockedQuery v${version}
`
const footer = `# Type Info (generated automatically):`
const lockedRegex = /\s*#.*@LockedQuery\(type:"(.*)"\)/
export const versionRegex = /LockedQuery v(\d+)\n/

function cleanAnnotatedQuery (query: string) {
  // Strip comment annotations that were used in v1
  query = query.replace(
    new RegExp(lockedRegex, 'g'),
    ''
  )
  // Only keep the part of the query after our version marker ...
  query = query.split(versionRegex).pop().trim()

  // ... and before our type info footer.
  const typeIndex = query.lastIndexOf(footer)
  if (typeIndex > 0) {
    query = query.substring(0, typeIndex).trim()
  }

  return query
}

// This will walk through a GraphQL AST and a typeTree object to a specific path
// creating any intermediate nodes.
const makePath = ([typeNode, graphqlNode], pathPart) => {
  const nextNode = graphqlNode[pathPart]
  if (nextNode == null) throw new Error(`Invalid path: ${JSON.stringify(pathPart)}`)

  // $FlowFixMe - I have no idea how to make Flow understand what I'm doing here.
  if (typeNode[pathPart] == null) {
    // $FlowFixMe
    typeNode[pathPart] = Array.isArray(nextNode)
      ? []
      : {}
  }

  return [
    // $FlowFixMe
    typeNode[pathPart],
    nextNode,
  ]
}

type InputType = string | Object

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function validateInputTypeCompatibility (lockedInput: InputType, currentInput: InputType, path: Array<string>) {
  if (same(lockedInput, currentInput)) {
    return true
  }
  if (typeof currentInput === 'string' || typeof lockedInput === 'string') {
    const current = JSON.stringify(currentInput)
    const locked = JSON.stringify(lockedInput)
    throw new TypeError(`Type mismatch at ${path.join('.')}.\n  Current: ${current}\n  Locked: ${locked}`)
  }

  const keys = Array.from(new Set(
    Object.keys(lockedInput).concat(
      Object.keys(currentInput)
    )
  ))

  keys.forEach((key) => {
    // $FlowFixMe - Flow thinks lockedInput is a number
    const locked = lockedInput[key]
    // $FlowFixMe - Flow thinks currentInput is a number
    const current = currentInput[key]

    if (same(locked, current)) {
      return
    }

    if (locked == null) {
      // `current` is either a string or an object. If it's a string we can
      // check nullability by looking for a '!', but if it's an object
      // the nullability was lost in `expandType`
      if (typeof current === 'string' && current.substr(-1) !== '!') {
        // A new optional field was added, this does not break compatibility
        return
      }
    }

    const address = [...path, key]
    if (typeof current === 'object' && typeof locked === 'object') {
      return validateInputTypeCompatibility(locked, current, address)
    }

    const c = JSON.stringify(current)
    const l = JSON.stringify(locked)
    throw new TypeError(`Type mismatch at ${address.join('.')}.\n  Current: ${c}\n  Locked: ${l}`)
  })
}

export function walkQuery (schemaText: string, query: string, typeTree, validating: boolean) {
  const setValue = (path: Array<mixed>, name, type) => {
    const [ node ] = path.reduce((a, b) => makePath(a, b), [typeTree, queryAst])
    node[name] = type
  }

  const schemaTmp = parse(schemaText)
  const schemaAst = buildASTSchema(
    schemaTmp
  )
  const queryAst = parse(query)
  const typeInfo = new TypeInfo(schemaAst)

  function expandType (type) {
    if (typeof type.getFields !== 'function') {
      return String(type)
    }

    const fields = type.getFields()

    return Object.keys(fields).reduce((memo, name) => {
      let value = fields[name].type
      const fieldType = schemaAst.getType(value)
      if (fieldType != null) {
        value = expandType(fieldType)
      }
      memo[name] = value
      return memo
    }, {})
  }

  visit(queryAst,
    visitWithTypeInfo(typeInfo, {
      NamedType (node, ignoredKey, parent, path) {
        if (parent.kind === 'FragmentDefinition') {
          // We don't need to validate fragment types
          return
        }

        const type = expandType(typeFromAST(schemaAst, node))
        const key = String(typeInfo.getInputType())

        if (validating) {
          const typeNode = R.path(path, typeTree)
          validateInputTypeCompatibility(typeNode[key], type, [key])
        } else {
          setValue(path, key, type)
        }
      },
      Field (node, ignoredKey, ignoredParent, path) {
        const def = typeInfo.getFieldDef()
        const name = node.name.value
        if (def == null) {
          const parent = typeInfo.getParentType()
          throw new Error(`Unable to find type for ${parent}.${name}`)
        }

        if (validating) {
          const typeNode = R.path(path, typeTree)

          if (typeNode[name] !== String(def.type)) {
            throw new Error(`Type mismatch. Actual: ${def.type} Expected: ${typeNode[name]}`)
          }
        } else {
          setValue(path, name, def.type)
        }
      },
    })
  )
}

export function annotateQuery (schemaText: string, query: string): string {
  query = cleanAnnotatedQuery(query)

  const typeTree = {}
  walkQuery(schemaText, query, typeTree, false)

  const typeData = JSON.stringify(typeTree, null, 2)
    .split('\n')
    // NOTE: extractTypeTree will look for `#{` to find the start of this data
    .map((l) => `#${l}`)
    .join('\n')

  return `${header.trimLeft()}${query}\n${footer}\n${typeData}`
}
