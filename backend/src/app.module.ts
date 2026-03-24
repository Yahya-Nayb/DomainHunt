import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AIService } from './ai.service';
import { GeneratorService } from './generator.service';
import { GeneratorController } from './generator.controller';
import { ValidatorService } from './validator.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, GeneratorController],
  providers: [AppService, AIService, GeneratorService, ValidatorService],
})
export class AppModule {}
