import 'reflect-metadata'
import { ApolloServer } from '@apollo/server'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda'
import { schema } from '~schemas'
import { resolvers } from '~resolvers'
import { authDirectiveTransformer } from '~directives/auth'

let executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
})

executableSchema = authDirectiveTransformer(executableSchema, 'auth')

const server = new ApolloServer({
  schema: executableSchema,
  plugins: [
    {
      serverWillStart: async () => {
        // This is called in every Lambda cold start
        // Can be used to Start a DB connection
        // Start an external service
        // Load configuration
        // Etc
        console.log('Server starting...')
        return {
          async drainServer() {
            console.log('Draining server...')
          },
        }
      },
    },
  ],
})

export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    context: async ({ event, context }) => {
      context.callbackWaitsForEmptyEventLoop = false

      return {
        event,
        context,
      }
    },
  },
)
