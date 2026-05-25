import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  POLYGON_RPC_URL: Joi.string().required(),
  OPERATOR_KEY_ENCRYPTED: Joi.string().required(),
  OPERATOR_KEY_IV: Joi.string().required(),
  NETWORK: Joi.string().valid('amoy', 'mainnet').default('amoy'),
  USDC_ADDRESS: Joi.string().optional(),
  FOREX_RATE_INR_PER_USDC: Joi.number().positive().default(83.5),
  RAZORPAY_KEY_ID: Joi.string().optional(),
  RAZORPAY_KEY_SECRET: Joi.string().optional(),
  ADMIN_ALLOWED_IPS: Joi.string().default('127.0.0.1,::1,::ffff:127.0.0.1'),
  MASTER_ENCRYPTION_KEY: Joi.string().min(64).required(),
});
