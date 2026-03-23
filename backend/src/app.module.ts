import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './supabase.service';
import { AIService } from './ai.service';
import { GeneratorService } from './generator.service';
import { GeneratorController } from './generator.controller';
import { ValidatorService } from './validator.service';
import { ValidatorController } from './validator.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    AppController,
    GeneratorController,
    ValidatorController,
  ],
  providers: [
    AppService,
    SupabaseService,
    AIService,
    GeneratorService,
    ValidatorService,
  ],
})
export class AppModule {}
