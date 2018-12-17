import 'babel-polyfill';
import { graphqlLambda, graphiqlLambda } from 'apollo-server-lambda';
import lambdaPlayground from 'graphql-playground-middleware-lambda';
import { makeExecutableSchema } from 'graphql-tools';
import { schema } from './schema';
import { resolvers } from './resolvers';

const myGraphQLSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  logger: console,
});

exports.graphqlHandler = function graphqlHandler(event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;

  function callbackFilter(error, output) {
    if (!output.headers) {
      output.headers = {};
    }
    // eslint-disable-next-line no-param-reassign
    output.headers['Access-Control-Allow-Origin'] = '*';
    callback(error, output);
  }

  const handler = graphqlLambda({ schema: myGraphQLSchema, tracing: true });
  return handler(event, context, callbackFilter);
};

// for local endpointURL is /graphql and for prod it is /stage/graphql
exports.playgroundHandler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return lambdaPlayground({
    endpoint: process.env.REACT_APP_GRAPHQL_ENDPOINT
      ? process.env.REACT_APP_GRAPHQL_ENDPOINT
      : '/production/graphql',
  })(event, context, callback);
};

exports.graphiqlHandler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return graphiqlLambda({
    endpointURL: process.env.REACT_APP_GRAPHQL_ENDPOINT
      ? process.env.REACT_APP_GRAPHQL_ENDPOINT
      : '/production/graphql',
  })(event, context, callback);
};
