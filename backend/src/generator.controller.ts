import { Controller, Get, Param, Logger, Headers } from '@nestjs/common';
import { GeneratorService } from './generator.service';

@Controller('generator')
export class GeneratorController {
  private readonly logger = new Logger(GeneratorController.name);

  constructor(private readonly generatorService: GeneratorService) {}

  @Get('run/:niche')
  async runGenerator(
    @Param('niche') niche: string,
    @Headers('x-gemini-key') apiKey?: string,
  ) {
    try {
      this.logger.log(`Starting domain generation for niche: ${niche}...`);
      const result = await this.generatorService.generateAndSave(niche, apiKey);
      
      return {
        niche,
        ...result,
        message: 'Generation Complete',
      };
    } catch (error) {
      this.logger.error('Generation Failed: ' + error.message);
      return {
        message: 'Generation Failed',
        error: error.message,
      };
    }
  }
}
