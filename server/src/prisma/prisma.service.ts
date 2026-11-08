import { Injectable } from '@nestjs/common';
import { JsonDatabaseService } from '../json-db/json-db.service';

/**
 * @deprecated Prisma has been deprecated and replaced by JsonDatabaseService.
 * PrismaService is retained as a compatibility layer/adapter extending JsonDatabaseService.
 */
@Injectable()
export class PrismaService extends JsonDatabaseService {
  constructor() {
    super();
  }
}
