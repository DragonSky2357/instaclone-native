import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  makeVar,
  split,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import {
  getMainDefinition,
  offsetLimitPagination,
} from "@apollo/client/utilities";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createUploadLink } from "apollo-upload-client";
import { WebSocketLink } from "@apollo/client/link/ws";

export const isLoggedInVar = makeVar();
export const tokenVar = makeVar("");

const TOKEN = "token";

export const logUserIn = async (token) => {
  await AsyncStorage.setItem(TOKEN, token);
  isLoggedInVar(true);
  tokenVar(token);
};

export const logUserOut = async () => {
  await AsyncStorage.removeItem(TOKEN);
  isLoggedInVar(false);
  tokenVar(null);
};

const uploadHttpLinkAndroid = createUploadLink({
  uri: "http://10.0.2.2:4000/graphql",
});

const uploadHttpLinkWeb = createUploadLink({
  uri: "http://localhost:4000/graphql",
});

const wsLinkWeb = new WebSocketLink({
  uri: "http://localhost:4000/graphql",
  options: {
    connectionParams: () => ({
      token: tokenVar(),
    }),
  },
});

const wsLinkAndroid = new WebSocketLink({
  uri: "http://10.0.2.2:4000/graphql",
  options: {
    connectionParams: () => ({
      token: tokenVar(),
    }),
  },
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      token: tokenVar(),
    },
  };
});

const onErrorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    console.log(`GraphQL Error`, graphQLErrors);
  }
  if (networkError) {
    console.log("Network Error", networkError);
  }
});
export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        seeFeed: offsetLimitPagination(),
      },
    },
  },
});

const httpLinksWeb = authLink.concat(onErrorLink).concat(uploadHttpLinkWeb);
const httpLinksAndroid = authLink
  .concat(onErrorLink)
  .concat(uploadHttpLinkAndroid);

const splitLinkWeb = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLinkWeb,
  httpLinksWeb
);

const splitLinkAndroid = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLinkAndroid,
  httpLinksAndroid
);

export const clientAndroid = new ApolloClient({
  link: splitLinkAndroid,
  cache: cache,
});

export const clientWeb = new ApolloClient({
  link: splitLinkWeb,
  cache: cache,
});
