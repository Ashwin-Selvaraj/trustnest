import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agreement } from '../agreements/agreement.entity';
import { BlockchainJob } from '../blockchain/blockchain-job.entity';
import { BlockchainService } from '../blockchain/blockchain.service';
import { AgreementStatus, JobStatus, JobType } from '@trustnest/shared';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Agreement) private readonly agreementRepo: Repository<Agreement>,
    private readonly blockchainService: BlockchainService,
  ) {}

  async listJobs(): Promise<BlockchainJob[]> {
    return this.blockchainService.listJobs([JobStatus.PENDING, JobStatus.FAILED]);
  }

  async retryJob(jobId: string): Promise<BlockchainJob> {
    return this.blockchainService.retryJob(jobId);
  }

  async resolveDispute(
    agreementId: string,
    tenantShareINR: number,
    ownerShareINR: number,
  ): Promise<{ status: AgreementStatus }> {
    const agreement = await this.agreementRepo.findOne({ where: { id: agreementId } });
    if (!agreement) throw new NotFoundException('Agreement not found');
    if (agreement.status !== AgreementStatus.DISPUTED) {
      throw new BadRequestException('Agreement is not in DISPUTED state');
    }

    const depositINR = parseFloat(agreement.depositINR);
    if (tenantShareINR + ownerShareINR !== depositINR) {
      throw new BadRequestException(
        `Shares must sum to deposit amount (${depositINR} INR)`,
      );
    }

    const tenantShareWei = this.blockchainService.inrToUsdcWei(tenantShareINR);
    const ownerShareWei = this.blockchainService.inrToUsdcWei(ownerShareINR);

    await this.blockchainService.enqueueJob(
      JobType.RESOLVE_DISPUTE,
      {
        agreementId,
        tenantShareWei: tenantShareWei.toString(),
        ownerShareWei: ownerShareWei.toString(),
      },
      agreementId,
    );

    return { status: AgreementStatus.CLOSED };
  }
}
