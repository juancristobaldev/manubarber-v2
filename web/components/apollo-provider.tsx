'use client';
import { ApolloClient, ApolloProvider as Provider, HttpLink, InMemoryCache } from '@apollo/client';
import { useMemo } from 'react';
export function ApolloProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => new ApolloClient({ link: new HttpLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql' }), cache: new InMemoryCache() }), []);
  return <Provider client={client}>{children}</Provider>;
}
