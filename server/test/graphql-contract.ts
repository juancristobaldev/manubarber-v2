// CONTRACT: validate the web's actual booking documents against a running Nest GraphQL schema.
import 'reflect-metadata';
import { buildClientSchema, getIntrospectionQuery, validate } from 'graphql';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module';
import * as operations from '../../web/lib/operations';

async function main() {
  let app: any;
  let endpoint = process.env.TEST_GRAPHQL_URL;

  if (!endpoint) {
    app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0);
    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? address : address.port;
    endpoint = `http://127.0.0.1:${port}/graphql`;
  }

  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: getIntrospectionQuery() }) });
    const result = await response.json() as { data: Parameters<typeof buildClientSchema>[0]; errors?: unknown };
    if (!response.ok || result.errors) throw new Error('Schema introspection failed');
    const schema = buildClientSchema(result.data);
    const { ADMIN_OPERATIONS, ...documents } = operations;
    for (const [name, document] of Object.entries({ ...documents, ...ADMIN_OPERATIONS })) {
      const errors = validate(schema, document);
      if (errors.length) throw new Error(`${name}: ${errors.map(error => error.message).join(', ')}`);
    }
    console.log('PASS: web GraphQL documents match the running API schema');
  } finally {
    if (app) await app.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
