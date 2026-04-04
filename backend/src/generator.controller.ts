import { Controller, Logger, Body, Post } from '@nestjs/common';
import { GeneratorService } from './generator.service';
import { GenerateDto } from './types';

@Controller('generator')
export class GeneratorController {
  private readonly logger = new Logger(GeneratorController.name);

  constructor(private readonly generatorService: GeneratorService) {}

  @Post('run')
  async runGenerator(
    @Body('niche') niche: string,
    @Body('userApiKey') userApiKey: string,
  ) {
    console.log('niche >> ', niche);
    try {
      this.logger.log(`Starting domain hunt for niche: ${niche}...`);

      if (!niche || !userApiKey) {
        throw new Error('Niche and API Key are required');
      }

      const dto: GenerateDto = {
        niche,
        apiKey: userApiKey,
      };

      const result = await this.generatorService.huntDomains(dto);

      return {
        message: 'Hunt Complete',
        ...result,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Hunt Failed: ' + errMsg);
      return {
        message: 'Hunt Failed',
        error: errMsg,
      };
    }
  }
}
