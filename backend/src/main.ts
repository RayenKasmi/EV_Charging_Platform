import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    disableErrorMessages: false,
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS for development - allows Angular frontend, Flutter Web, and Flutter Mobile
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost and 10.0.2.2 (Android emulator) on any port for development
      if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?$/)) {
        return callback(null, true);
      }
      
      // Reject other origins
      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Charging Station API')
    .setDescription('API documentation for EV charging station management')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('stations', 'Charging stations')
    .addTag('bookings', 'Booking management')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
