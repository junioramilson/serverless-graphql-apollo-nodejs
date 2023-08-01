import type { AWS } from '@serverless/typescript'

const serverlessConfig: AWS = {
  service: 'sls-apollo-graphql',
  plugins: ['serverless-esbuild', 'serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    region: 'us-east-1',
    stage: '${opt:stage, "dev"}',
    environment: {
      ENV: '${self:provider.stage}',
    },
    httpApi: {
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: ['POST', 'GET', 'OPTIONS'],
        maxAge: 6000,
      },
    },
    timeout: 30,
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          's3:*',
          'ses:*',
          'sts:*',
          'lambda:*',
          'iam:CreateRole',
          'iam:PassRole',
          'dynamodb:Scan',
          'events:PutEvents',
        ],
        Resource: '*',
      },
    ],
    tracing: {
      lambda: true,
    },
  },
  functions: {
    'apollo-server-entry-point': {
      handler: 'src/handlers/entry-point.handler',
      events: [
        {
          httpApi: {
            path: '/graphql',
            method: 'POST',
          },
        },
        {
          httpApi: {
            path: '/graphql',
            method: 'GET',
          },
        },
      ],
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      watch: {
        pattern: ['./**/*.(js|ts|ejs)'],
      },
    },
  },
}

module.exports = serverlessConfig
