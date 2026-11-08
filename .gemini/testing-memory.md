# Testing Memory - ManuBarber

## Architecture & Layout
- **Monorepo Layout**: `server/` (NestJS API + GraphQL + Prisma) and `web/` (Next.js App Router + Apollo Client).
- **Backend Port**: 4000 (`http://localhost:4000/graphql`).
- **Frontend Port**: 3000 (`http://localhost:3000`).

## GraphQL Contract
- **Backend Schema Source**: NestJS Code-First in `server/src/**/*.resolver.ts`.
- **Generated Schema File**: `server/schema.gql` (automatically generated on NestJS startup via `autoSchemaFile`).
- **Frontend Operations**: Centralized in `web/lib/operations.ts` (61 queries and mutations covering public site, bookings, and admin panel).
- **Contract Gate**: `npm run test:contract` (runs `server/test/validate-contract.ts` using `graphql-js` validate against `server/schema.gql`).

## Quality Gates
- `npm run test:contract`: Validates that all GraphQL operations in `web/lib/operations.ts` conform statically to `server/schema.gql`.
- `npm run build`: Compiles both `server` (NestJS) and `web` (Next.js).
- `TEST_DATABASE_URL=... npm run test:booking` (in `server`): Integration tests for bookings using real PostgreSQL and Flow fake.
- `TEST_DATABASE_URL=... TEST_GRAPHQL_URL=... npm run test:admin` (in `server`): Integration tests for admin mutations and queries against running API.
