import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [SearchModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
