import { IsString } from 'class-validator';

export class RazorpayWebhookDto {
  @IsString()
  event!: string;

  payload!: Record<string, unknown>;
}
