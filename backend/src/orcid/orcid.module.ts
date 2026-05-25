import { Module } from '@nestjs/common';
import { OrcidService } from './orcid.service';
import { OrcidController } from './orcid.controller';

@Module({
  providers: [OrcidService],
  controllers: [OrcidController],
  exports: [OrcidService],
})
export class OrcidModule {}
