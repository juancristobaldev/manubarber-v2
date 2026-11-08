import { readFileSync } from 'node:fs';
import { buildSchema, validate } from 'graphql';
import * as operations from '../../web/lib/operations';

const schemaContent = readFileSync('schema.gql', 'utf8');
const schema = buildSchema(schemaContent);

const { ADMIN_OPERATIONS, ...docs } = operations;
const allDocs: Record<string, any> = { ...docs, ...ADMIN_OPERATIONS };

let errorCount = 0;
for (const [name, doc] of Object.entries(allDocs)) {
  if (!doc || !doc.kind) {
    console.warn('Skipping non-document export:', name);
    continue;
  }
  const errors = validate(schema, doc);
  if (errors.length > 0) {
    console.error(`\n❌ ERROR in "${name}":`);
    for (const err of errors) {
      console.error('   -', err.message);
    }
    errorCount += errors.length;
  } else {
    console.log(`✓ ${name}`);
  }
}

if (errorCount === 0) {
  console.log('\n🎉 ALL web GraphQL operations match server/schema.gql perfectly!');
  process.exit(0);
} else {
  console.error(`\n💥 Total contract errors: ${errorCount}`);
  process.exit(1);
}
