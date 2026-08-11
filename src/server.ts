import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { checkSystemHealth } from './health/health-check';

async function bootstrap() {
  const PORT = process.env.PORT ?? 3000;

  // Run health checks for database dependencies
  await checkSystemHealth();

  // Initialize server
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);

  console.log(`🚀 Server running on port: ${PORT}`);
}

bootstrap().catch((error) => {
  console.error('❌ Server startup error:', error);
});
