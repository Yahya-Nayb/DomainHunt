import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { ValidatorService } from './validator.service';
import { from, mergeMap, toArray, lastValueFrom } from 'rxjs';
import { GenerateDto, HuntResponse } from './types';

@Injectable()
export class GeneratorService {
  private readonly logger = new Logger(GeneratorService.name);
  private readonly TLDS = ['com'];
  private readonly BATCH_SIZE = 50;
  private readonly CONCURRENCY_LIMIT = 5;

  constructor(
    private aiService: AIService,
    private validatorService: ValidatorService,
  ) {}

  async huntDomains(dto: GenerateDto): Promise<HuntResponse> {
    this.logger.log(`[Phase 1] Requesting AI DNA for niche: ${dto.niche}...`);

    const components = await this.aiService.generateBrandingComponents(
      dto.niche,
      dto.apiKey,
    );

    if (!components || !components.seeds || components.seeds.length === 0) {
      throw new InternalServerErrorException('AI returned empty DNA.');
    }

    const allGenerated = this.buildDomainCombinations(components);
    this.logger.log(
      `[Phase 2] Total Unique Names with Meanings: ${allGenerated.length}`,
    );

    if (allGenerated.length === 0) {
      return { niche: dto.niche, components, domains: [] };
    }

    const validatedDomains: any[] = [];

    for (let i = 0; i < allGenerated.length; i += this.BATCH_SIZE) {
      const batch = allGenerated.slice(i, i + this.BATCH_SIZE);
      const results = await lastValueFrom(
        from(batch).pipe(
          mergeMap(async (item): Promise<any | null> => {
            const status = await this.validatorService.checkAvailability(
              item.name,
              item.extension,
            );
            return status === 'available' ? item : null;
          }, this.CONCURRENCY_LIMIT),
          toArray(),
        ),
      );
      validatedDomains.push(...results.filter((r) => r !== null));
    }

    this.logger.log(`[Phase 3] Total Available: ${validatedDomains.length}`);

    return {
      niche: dto.niche,
      components: components,
      domains: validatedDomains.map((d) => ({
        name: `${d.name}.${d.extension}`,
        description: d.description,
      })),
    };
  }

  private buildDomainCombinations(components: any): any[] {
    const { seeds = [], suffixes = [], prefixes = [], niche } = components;
    const nicheToken = niche.toLowerCase().trim().replace(/\s+/g, '');
    const uniqueDomainsMap = new Map<string, any>();
    const MAX_DOMAINS = 100;

    const prefixUsageCount = new Map<string, number>();
    const MAX_PER_PREFIX = 3;

    const addUnique = (
      name: string,
      extension: string,
      description: string,
      prefixKey?: string,
    ) => {
      if (uniqueDomainsMap.size >= MAX_DOMAINS) return;

      const normalizedName = name.toLowerCase().trim();
      const key = `${normalizedName}:${extension}`;

      if (prefixKey) {
        const count = prefixUsageCount.get(prefixKey) || 0;
        if (count >= MAX_PER_PREFIX) return;
        prefixUsageCount.set(prefixKey, count + 1);
      }

      if (normalizedName.length >= 4 && normalizedName.length <= 16) {
        if (!uniqueDomainsMap.has(key)) {
          uniqueDomainsMap.set(key, {
            name: normalizedName,
            extension,
            description,
          });
        }
      }
    };

    const tld = this.TLDS[0];

    for (const pre of prefixes) {
      for (const seed of seeds) {
        addUnique(
          `${pre.word}${seed.word}`,
          tld,
          `${pre.essence} meets ${seed.essence}`,
          pre.word,
        );
      }
    }

    for (const seed of seeds) {
      for (const suff of suffixes) {
        addUnique(
          `${seed.word}${suff.word}`,
          tld,
          `${seed.essence} focusing on ${suff.essence}`,
          seed.word,
        );
      }
    }

    // 3. Prefix + Niche
    for (const pre of prefixes) {
      addUnique(
        `${pre.word}${nicheToken}`,
        tld,
        `${pre.essence} for ${niche}`,
        pre.word,
      );
    }

    // 4. Niche + Suffix
    for (const suff of suffixes) {
      addUnique(
        `${nicheToken}${suff.word}`,
        tld,
        `${niche} driven by ${suff.essence}`,
      );
    }

    return Array.from(uniqueDomainsMap.values());
  }
}
