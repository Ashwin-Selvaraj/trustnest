import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyInterest } from './property-interest.entity';
import { Property } from '../properties/property.entity';
import { PropertyImage } from '../properties/property-image.entity';
import { Agreement } from '../agreements/agreement.entity';
import { User } from '../users/user.entity';
import { CreateInterestDto } from './dto/create-interest.dto';
import { InterestStatus, AgreementStatus } from '@trustnest/shared';
import { agreementIdToBytes32 } from '@trustnest/sdk';

@Injectable()
export class InterestsService {
  constructor(
    @InjectRepository(PropertyInterest) private readonly interestRepo: Repository<PropertyInterest>,
    @InjectRepository(Property)         private readonly propertyRepo: Repository<Property>,
    @InjectRepository(PropertyImage)    private readonly imageRepo: Repository<PropertyImage>,
    @InjectRepository(Agreement)        private readonly agreementRepo: Repository<Agreement>,
    @InjectRepository(User)             private readonly userRepo: Repository<User>,
  ) {}

  async create(
    propertyId: string,
    tenantId: string,
    dto: CreateInterestDto,
  ): Promise<PropertyInterest> {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId === tenantId) {
      throw new BadRequestException('You cannot express interest in your own property');
    }

    const existing = await this.interestRepo.findOne({
      where: [
        { propertyId, tenantId, status: InterestStatus.PENDING },
        { propertyId, tenantId, status: InterestStatus.ACCEPTED },
      ],
    });
    if (existing) {
      throw new ConflictException('You already have an active interest in this property');
    }

    const interest = this.interestRepo.create({
      propertyId,
      tenantId,
      status: InterestStatus.PENDING,
      message: dto.message ?? null,
    });
    return this.interestRepo.save(interest);
  }

  async findByProperty(
    propertyId: string,
    requestingOwnerId: string,
  ): Promise<PropertyInterest[]> {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== requestingOwnerId) {
      throw new ForbiddenException('Only the property owner can view interests');
    }

    return this.interestRepo
      .createQueryBuilder('i')
      .leftJoin('i.tenant', 'tenant')
      .addSelect(['tenant.id', 'tenant.name', 'tenant.kycStatus'])
      .where('i.propertyId = :propertyId', { propertyId })
      .orderBy('i.createdAt', 'DESC')
      .getMany();
  }

  async accept(
    propertyId: string,
    interestId: string,
    ownerId: string,
  ): Promise<{ interestId: string; agreementId: string }> {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException('Not your property');

    const interest = await this.interestRepo.findOne({ where: { id: interestId, propertyId } });
    if (!interest) throw new NotFoundException('Interest not found');
    if (interest.status !== InterestStatus.PENDING) {
      throw new ConflictException('Interest is not in PENDING state');
    }

    // Decline all other PENDING interests on this property
    await this.interestRepo
      .createQueryBuilder()
      .update(PropertyInterest)
      .set({ status: InterestStatus.DECLINED })
      .where('propertyId = :propertyId AND status = :status AND id != :interestId', {
        propertyId,
        status: InterestStatus.PENDING,
        interestId,
      })
      .execute();

    // Accept this interest
    await this.interestRepo.update(interestId, { status: InterestStatus.ACCEPTED });

    // Calculate end date (1 year from availableFrom)
    const start = new Date(property.availableFrom);
    const end   = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    const startDate = start.toISOString().split('T')[0]!;
    const endDate   = end.toISOString().split('T')[0]!;

    // Auto-create Agreement
    const agreement = this.agreementRepo.create({
      tenantId:        interest.tenantId,
      ownerId,
      propertyAddress: property.address,
      monthlyRentINR:  property.monthlyRentINR,
      depositINR:      property.depositINR,
      startDate,
      endDate,
      status:          AgreementStatus.DRAFT,
      onChainAgreementId: agreementIdToBytes32(
        `${interest.tenantId}-${ownerId}-${startDate}`,
      ),
    });
    const savedAgreement = await this.agreementRepo.save(agreement);

    // Write agreementId back to interest
    await this.interestRepo.update(interestId, { agreementId: savedAgreement.id });

    return { interestId, agreementId: savedAgreement.id };
  }

  async decline(
    propertyId: string,
    interestId: string,
    ownerId: string,
  ): Promise<{ ok: boolean }> {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException('Not your property');

    const interest = await this.interestRepo.findOne({ where: { id: interestId, propertyId } });
    if (!interest) throw new NotFoundException('Interest not found');

    await this.interestRepo.update(interestId, { status: InterestStatus.DECLINED });
    return { ok: true };
  }

  async withdraw(
    propertyId: string,
    interestId: string,
    tenantId: string,
  ): Promise<{ ok: boolean }> {
    const interest = await this.interestRepo.findOne({ where: { id: interestId, propertyId } });
    if (!interest) throw new NotFoundException('Interest not found');
    if (interest.tenantId !== tenantId) throw new ForbiddenException('Not your interest');
    if (interest.status !== InterestStatus.PENDING) {
      throw new ConflictException('Only PENDING interests can be withdrawn');
    }

    await this.interestRepo.update(interestId, { status: InterestStatus.WITHDRAWN });
    return { ok: true };
  }

  async getMyInterests(tenantId: string): Promise<unknown[]> {
    const interests = await this.interestRepo
      .createQueryBuilder('i')
      .leftJoin('i.property', 'p')
      .addSelect([
        'p.id', 'p.title', 'p.city', 'p.locality',
        'p.monthlyRentINR', 'p.status',
      ])
      .where('i.tenantId = :tenantId', { tenantId })
      .orderBy('i.createdAt', 'DESC')
      .getMany();

    // Attach primary image url for each interest's property
    const result = await Promise.all(
      interests.map(async (interest) => {
        const prop = (interest as PropertyInterest & { property?: Property }).property;
        let primaryImageUrl: string | null = null;
        if (prop) {
          const img = await this.imageRepo.findOne({
            where: { propertyId: prop.id, isPrimary: true },
          });
          primaryImageUrl = img?.url ?? null;
        }
        return {
          id:          interest.id,
          propertyId:  interest.propertyId,
          tenantId:    interest.tenantId,
          status:      interest.status,
          message:     interest.message,
          agreementId: interest.agreementId,
          createdAt:   interest.createdAt,
          updatedAt:   interest.updatedAt,
          property:    prop
            ? {
                title:          prop.title,
                city:           prop.city,
                locality:       prop.locality,
                monthlyRentINR: prop.monthlyRentINR,
                status:         prop.status,
                primaryImageUrl,
              }
            : null,
        };
      }),
    );

    return result;
  }
}
