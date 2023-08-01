import { mapSchema, MapperKind, getDirective } from '@graphql-tools/utils'
import { defaultFieldResolver, GraphQLError } from 'graphql'
import gql from 'graphql-tag'
import * as jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import util from 'util'

// Auth0 JWT verification/decoding
const processAuthorization = async (event: AWSLambda.APIGatewayProxyEventV2) => {
  const authorizationToken = event.headers.Authorization || event.headers.authorization
  const token = authorizationToken?.replace('Bearer ', '')

  const decoded = jwt.decode(token, { complete: true })

  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new GraphQLError('Unauthorized', {
      extensions: { code: 'UNAUTHORIZED' },
    })
  }

  const client = jwksClient({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    jwksUri: `${decoded.payload['iss']}.well-known/jwks.json`,
  })

  const getSigningKey = util.promisify(client.getSigningKey)
  return getSigningKey(decoded.header.kid)
    .then(key => {
      const signingKey = key.getPublicKey() || key['rsaPublicKey']
      return jwt.verify(token, signingKey, {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: decoded.payload['iss'],
      })
    })
    .then(decoded => {
      return {
        isAuthorized: true,
        user: {
          id: decoded['id'],
        },
      }
    })
}

export const authDirectiveSchema = gql`
  directive @auth on FIELD_DEFINITION
`

export const authDirectiveTransformer = (schema, directiveName) => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: fieldConfig => {
      const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0]

      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig

        fieldConfig.resolve = async function (source, args, context, info) {
          try {
            const { isAuthorized, user } = await processAuthorization(context.event)

            if (!isAuthorized) {
              throw new GraphQLError('Unauthorized', {
                extensions: { code: 'UNAUTHORIZED' },
              })
            }

            context.user = user

            return resolve(source, args, context, info)
          } catch (error) {
            console.error(error)
            throw new GraphQLError('Unauthorized', {
              extensions: { code: 'UNAUTHORIZED' },
            })
          }
        }
        return fieldConfig
      }
    },
  })
}
