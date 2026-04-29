import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { AiService } from './ai.service';
import { ValidatorService } from './validator.service';
import { GenerateDto, HuntResponse } from './types';

@Injectable()
export class GeneratorService {
  private readonly logger = new Logger(GeneratorService.name);

  constructor(
    private aiService: AiService,
    private validatorService: ValidatorService,
  ) {}

  async huntDomains(dto: GenerateDto): Promise<HuntResponse> {
    this.logger.log(`[Phase 1] Requesting DSPy Agent for niche: ${dto.niche}...`);

    const result = await this.aiService.fetchEliteNames(dto.niche, dto.apiKey);

    if (!result.success || !result.data) {
      throw new InternalServerErrorException(result.error || 'AI returned empty DNA.');
    }

    this.logger.log(`[Phase 2] Agent Strategy: ${result.strategy}`);
    this.logger.log(`[Phase 2] Domains to validate: ${result.data.length}`);

    const normalizedDomains = result.data.map((d: string) => d.toLowerCase().trim());

    const available = await this.validatorService.validateMany(normalizedDomains);

    this.logger.log(`[Phase 3] Total Available: ${available.length}`);

    return {
      niche: dto.niche,
      strategy: result.strategy,
      domains: available,
    };
  }
}
