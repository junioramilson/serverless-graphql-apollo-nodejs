import gql from 'graphql-tag'
import { DateTypeDefinition, JSONObjectDefinition } from 'graphql-scalars'
import { authDirectiveSchema } from '~directives/auth'

const rootSchema = gql`
  type Query
  type Mutation
`

export const schema = [
  DateTypeDefinition,
  JSONObjectDefinition,
  authDirectiveSchema,
  rootSchema,
]
