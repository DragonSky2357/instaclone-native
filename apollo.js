import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  makeVar,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const httpLinkAndroid = createHttpLink({
  uri: "http://10.0.2.2:4000/graphql",
});

const httpLinkWeb = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      token: tokenVar(),
    },
  };
});

export const clientAndroid = new ApolloClient({
  link: authLink.concat(httpLinkAndroid),
  cache: new InMemoryCache(),
});

export const clientWeb = new ApolloClient({
  link: authLink.concat(httpLinkWeb),
  cache: new InMemoryCache(),
});
