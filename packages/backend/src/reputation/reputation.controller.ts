import { Controller, Get, Param } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Get(':userId')
  getReputation(@Param('userId') userId: string) {
    return this.reputationService.getReputation(userId);
  }
}
