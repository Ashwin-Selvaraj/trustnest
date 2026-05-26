import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './property.entity';
import { PropertyImage } from './property-image.entity';
import { PropertyInterest } from '../interests/property-interest.entity';
import { User } from '../users/user.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { PropertyStatus, InterestStatus } from '@trustnest/shared';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)     private readonly propertyRepo: Repository<Property>,
    @InjectRepository(PropertyImage) private readonly imageRepo: Repository<PropertyImage>,
    @InjectRepository(PropertyInterest) private readonly interestRepo: Repository<PropertyInterest>,
    @InjectRepository(User)         private readonly userRepo: Repository<User>,
  ) {}

  async create(ownerId: string, dto: CreatePropertyDto): Promise<Property> {
    const property = this.propertyRepo.create({
      ownerId,
      title:             dto.title,
      address:           dto.address,
      city:              dto.city,
      locality:          dto.locality,
      bhkType:           dto.bhkType,
      furnishingStatus:  dto.furnishingStatus,
      monthlyRentINR:    dto.monthlyRentINR.toString(),
      depositINR:        dto.depositINR.toString(),
      areaSqft:          dto.areaSqft ?? null,
      floorNumber:       dto.floorNumber ?? null,
      totalFloors:       dto.totalFloors ?? null,
      description:       dto.description ?? null,
      amenities:         dto.amenities,
      preferredTenants:  dto.preferredTenants,
      availableFrom:     dto.availableFrom,
      status:            PropertyStatus.DRAFT,
    });
    return this.propertyRepo.save(property);
  }

  async search(dto: SearchPropertiesDto): Promise<{
    data: unknown[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page  = dto.page  ?? 1;
    const limit = dto.limit ?? 20;

    const qb = this.propertyRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img')
      .leftJoin('p.owner', 'owner')
      .addSelect(['owner.id', 'owner.name'])
      .where('p.status = :status', { status: PropertyStatus.ACTIVE });

    if (dto.city)             qb.andWhere('LOWER(p.city)     LIKE :city',     { city:     `%${dto.city.toLowerCase()}%` });
    if (dto.locality)         qb.andWhere('LOWER(p.locality) LIKE :locality', { locality: `%${dto.locality.toLowerCase()}%` });
    if (dto.bhkType)          qb.andWhere('p.bhkType = :bhkType', { bhkType: dto.bhkType });
    if (dto.furnishingStatus) qb.andWhere('p.furnishingStatus = :fs',         { fs: dto.furnishingStatus });
    if (dto.minRent !== undefined) qb.andWhere('CAST(p.monthlyRentINR AS NUMERIC) >= :minRent', { minRent: dto.minRent });
    if (dto.maxRent !== undefined) qb.andWhere('CAST(p.monthlyRentINR AS NUMERIC) <= :maxRent', { maxRent: dto.maxRent });

    const [data, total] = await qb
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string, requestingUserId?: string): Promise<Property> {
    const property = await this.propertyRepo.findOne({
      where: { id },
      relations: ['images', 'owner'],
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== PropertyStatus.ACTIVE && requestingUserId !== property.ownerId) {
      throw new ForbiddenException('Property is not publicly available');
    }
    return property;
  }

  async update(id: string, ownerId: string, dto: UpdatePropertyDto): Promise<Property> {
    const property = await this.propertyRepo.findOne({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException('Not your property');
    if (property.status === PropertyStatus.RENTED) {
      throw new ConflictException('Cannot edit a rented property');
    }

    if (dto.title             !== undefined) property.title             = dto.title;
    if (dto.address           !== undefined) property.address           = dto.address;
    if (dto.city              !== undefined) property.city              = dto.city;
    if (dto.locality          !== undefined) property.locality          = dto.locality;
    if (dto.bhkType           !== undefined) property.bhkType           = dto.bhkType;
    if (dto.furnishingStatus  !== undefined) property.furnishingStatus  = dto.furnishingStatus;
    if (dto.monthlyRentINR    !== undefined) property.monthlyRentINR    = dto.monthlyRentINR.toString();
    if (dto.depositINR        !== undefined) property.depositINR        = dto.depositINR.toString();
    if (dto.areaSqft          !== undefined) property.areaSqft          = dto.areaSqft ?? null;
    if (dto.floorNumber       !== undefined) property.floorNumber       = dto.floorNumber ?? null;
    if (dto.totalFloors       !== undefined) property.totalFloors       = dto.totalFloors ?? null;
    if (dto.description       !== undefined) property.description       = dto.description ?? null;
    if (dto.amenities         !== undefined) property.amenities         = dto.amenities;
    if (dto.preferredTenants  !== undefined) property.preferredTenants  = dto.preferredTenants;
    if (dto.availableFrom     !== undefined) property.availableFrom     = dto.availableFrom;

    await this.propertyRepo.save(property);
    const updated = await this.propertyRepo.findOne({ where: { id }, relations: ['images'] });
    if (!updated) throw new NotFoundException('Property not found after update');
    return updated;
  }

  async updateStatus(id: string, ownerId: string, newStatus: PropertyStatus): Promise<Property> {
    const property = await this.propertyRepo.findOne({ where: { id }, relations: ['images'] });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException('Not your property');

    if (newStatus === PropertyStatus.ACTIVE) {
      const missing: string[] = [];
      if (!property.title)           missing.push('title');
      if (!property.address)         missing.push('address');
      if (!property.monthlyRentINR)  missing.push('monthlyRentINR');
      if (!property.depositINR)      missing.push('depositINR');
      if (!property.availableFrom)   missing.push('availableFrom');
      const images = await this.imageRepo.find({ where: { propertyId: id } });
      if (images.length === 0)       missing.push('at least one photo');

      if (missing.length > 0) {
        throw new UnprocessableEntityException({
          message: 'Property is missing required fields to go active',
          missingFields: missing,
        });
      }
    }

    await this.propertyRepo.update(id, { status: newStatus });
    const updated = await this.propertyRepo.findOne({ where: { id }, relations: ['images'] });
    if (!updated) throw new NotFoundException('Property not found after status update');
    return updated;
  }

  async softDelete(id: string, ownerId: string): Promise<{ ok: boolean }> {
    const property = await this.propertyRepo.findOne({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException('Not your property');

    const activeInterests = await this.interestRepo.count({
      where: [
        { propertyId: id, status: InterestStatus.PENDING },
        { propertyId: id, status: InterestStatus.ACCEPTED },
      ],
    });
    if (activeInterests > 0) {
      throw new ConflictException('Cannot delete a property with pending or accepted interests');
    }

    await this.propertyRepo.update(id, { status: PropertyStatus.DRAFT });
    return { ok: true };
  }

  async addPhoto(
    id: string,
    ownerId: string,
    url: string,
    s3Key: string,
  ): Promise<PropertyImage> {
    const property = await this.propertyRepo.findOne({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException('Not your property');

    const existingImages = await this.imageRepo.find({ where: { propertyId: id } });
    if (existingImages.length >= 10) {
      throw new BadRequestException('Maximum 10 photos allowed per property');
    }

    const isPrimary = existingImages.length === 0;
    const image = this.imageRepo.create({
      propertyId: id,
      url,
      s3Key,
      displayOrder: existingImages.length,
      isPrimary,
    });
    return this.imageRepo.save(image);
  }

  async setPrimaryPhoto(id: string, ownerId: string, photoId: string): Promise<{ ok: boolean }> {
    const property = await this.propertyRepo.findOne({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException('Not your property');

    const photo = await this.imageRepo.findOne({ where: { id: photoId, propertyId: id } });
    if (!photo) throw new NotFoundException('Photo not found');

    await this.imageRepo.update({ propertyId: id }, { isPrimary: false });
    await this.imageRepo.update(photoId, { isPrimary: true });
    return { ok: true };
  }

  async deletePhoto(id: string, ownerId: string, photoId: string): Promise<{ ok: boolean }> {
    const property = await this.propertyRepo.findOne({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException('Not your property');

    if (property.status === PropertyStatus.ACTIVE) {
      const count = await this.imageRepo.count({ where: { propertyId: id } });
      if (count <= 1) {
        throw new BadRequestException('Active listings must have at least one photo');
      }
    }

    await this.imageRepo.delete(photoId);
    return { ok: true };
  }
}
