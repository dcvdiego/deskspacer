import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const cache = new InMemoryCache();
const link = createHttpLink({
  uri: `${import.meta.env.VITE_BACKEND_URL}/graphql`,
});
const client = new ApolloClient({
  link,
  cache,
});

export default client;
