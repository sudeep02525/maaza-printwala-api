import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/maaza_printwala',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_key_change_in_prod',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_key_change_in_prod',
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  CLIENT_URL_WEB: process.env.CLIENT_URL_WEB || 'http://localhost:3000',
  CLIENT_URL_ADMIN: process.env.CLIENT_URL_ADMIN || 'http://localhost:3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
