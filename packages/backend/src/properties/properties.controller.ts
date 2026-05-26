import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { RequiresKycGuard } from '../common/guards/requires-kyc.guard';
import { RequiresOwnerRoleGuard } from '../common/guards/requires-owner-role.guard';
import { Public } from '../common/decorators/public.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PropertyStatus } from '@trustnest/shared';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @UseGuards(RequiresKycGuard, RequiresOwnerRoleGuard)
  @Post()
  create(@Req() req: Request, @Body() dto: CreatePropertyDto) {
    const user = req.user as JwtPayload;
    return this.propertiesService.create(user.sub, dto);
  }

  @Public()
  @Get()
  search(@Query() dto: SearchPropertiesDto) {
    return this.propertiesService.search(dto);
  }

  @Public()
  @Get(':id')
  findById(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload | undefined;
    return this.propertiesService.findById(id, user?.sub);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    const user = req.user as JwtPayload;
    return this.propertiesService.update(id, user.sub, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('status') status: PropertyStatus,
  ) {
    const user = req.user as JwtPayload;
    return this.propertiesService.updateStatus(id, user.sub, status);
  }

  @Delete(':id')
  softDelete(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    return this.propertiesService.softDelete(id, user.sub);
  }

  @Post(':id/photos')
  addPhoto(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('url') url: string,
    @Body('s3Key') s3Key: string,
  ) {
    const user = req.user as JwtPayload;
    return this.propertiesService.addPhoto(id, user.sub, url, s3Key);
  }

  @Patch(':id/photos/:photoId/primary')
  setPrimaryPhoto(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    const user = req.user as JwtPayload;
    return this.propertiesService.setPrimaryPhoto(id, user.sub, photoId);
  }

  @Delete(':id/photos/:photoId')
  deletePhoto(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    const user = req.user as JwtPayload;
    return this.propertiesService.deletePhoto(id, user.sub, photoId);
  }
}
