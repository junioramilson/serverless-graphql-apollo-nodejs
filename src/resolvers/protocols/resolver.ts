export abstract class Resolver<Output = any> {
  abstract execute(source: any, args: any, context: any): Promise<Output>
}

export interface Context {
  event?: AWSLambda.APIGatewayProxyEventV2
  user?: {
    id: string
  }
}
