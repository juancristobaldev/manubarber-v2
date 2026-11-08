import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'node:path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ContentModule } from './content/content.module';
import { CatalogModule } from './catalog/catalog.module';
import { LeadsModule } from './leads/leads.module';
import { MediaModule } from './media/media.module';

const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, ContentModule, CatalogModule, LeadsModule, MediaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: isProd ? true : join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      introspection: true,
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
  ],
})
export class AppModule {}
