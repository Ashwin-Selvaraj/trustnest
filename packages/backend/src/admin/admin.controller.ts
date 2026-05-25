import {
  Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { AdminIpGuard } from '../common/guards/admin-ip.guard';

@UseGuards(AdminIpGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('jobs')
  listJobs() {
    return this.adminService.listJobs();
  }

  @Post('jobs/:id/retry')
  @HttpCode(HttpStatus.OK)
  retryJob(@Param('id') id: string) {
    return this.adminService.retryJob(id);
  }

  @Post('disputes/:agreementId/resolve')
  @HttpCode(HttpStatus.OK)
  resolveDispute(
    @Param('agreementId') agreementId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.adminService.resolveDispute(agreementId, dto.tenantShareINR, dto.ownerShareINR);
  }
}
