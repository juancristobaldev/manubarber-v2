import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogResolver, CourseFieldsResolver, GalleryFieldsResolver, ProductFieldsResolver } from './catalog.resolver';
@Module({ imports: [AuthModule], providers: [CatalogResolver, ProductFieldsResolver, CourseFieldsResolver, GalleryFieldsResolver] }) export class CatalogModule {}
