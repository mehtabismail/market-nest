import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import { AssistantService } from './assistant.service';
import { AssistantChatDto } from './dto/chat.dto';

@ApiTags('assistant')
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Public()
  @RateLimit('assistant')
  @Post('chat')
  chat(@Body() dto: AssistantChatDto) {
    return this.assistant.chat(dto);
  }
}
