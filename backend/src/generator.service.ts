import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { AIService } from './ai.service';
import { ValidatorService } from './validator.service';
import { from, mergeMap, toArray, lastValueFrom } from 'rxjs';
import {
  BrandingComponents,
  DomainResult,
  GenerateDto,
  HuntResponse,
} from './types';

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
    this.logger.log(
      `[Phase 1] Requesting AI Branding Components for niche: ${dto.niche}...`,
    );

    // Phase 1: AI Component Generation
    const components = await this.aiService.generateBrandingComponents(
      dto.niche,
      dto.apiKey,
    );

    if (!components || !components.seeds || components.seeds.length === 0) {
      throw new InternalServerErrorException(
        'AI returned empty results for this niche.',
      );
    }

    // Phase 2: Domain Combination Generation
    const allGenerated = this.buildDomainCombinations(components);
    this.logger.log(
      `[Phase 2] Total Unique Names Generated: ${allGenerated.length}`,
    );

    if (allGenerated.length === 0) {
      return { niche: dto.niche, components, domains: [] };
    }

    // Phase 3: Domain Validation
    const availableDomains: DomainResult[] = [];

    for (let i = 0; i < allGenerated.length; i += this.BATCH_SIZE) {
      const batch = allGenerated.slice(i, i + this.BATCH_SIZE);
      const results = await lastValueFrom(
        from(batch).pipe(
          mergeMap(async (domain): Promise<DomainResult | null> => {
            const status = await this.validatorService.checkAvailability(
              domain.name,
              domain.extension,
            );
            return status === 'available' ? domain : null;
          }, this.CONCURRENCY_LIMIT),
          toArray(),
        ),
      );
      availableDomains.push(
        ...results.filter((r): r is DomainResult => r !== null),
      );
    }

    this.logger.log(
      `[Phase 3] Total Available Domains found: ${availableDomains.length}`,
    );

    if (availableDomains.length === 0) {
      return { niche: dto.niche, components, domains: [] };
    }

    const availableStringList = availableDomains.map(
      (d) => `${d.name}.${d.extension}`,
    );

    return {
      niche: dto.niche,
      components: components,
      domains: availableStringList,
    };
  }

  private buildDomainCombinations(
    components: BrandingComponents,
  ): DomainResult[] {
    const { seeds, suffixes, prefixes, niche } = components;
    const nicheToken = niche.toLowerCase().trim().replace(/\s+/g, '');

    const uniqueDomainsMap = new Map<string, DomainResult>();

    const addUnique = (name: string, extension: string) => {
      const normalizedName = name.toLowerCase().trim();
      const normalizedExt = extension.toLowerCase().trim();
      if (normalizedName.length >= 4 && normalizedName.length <= 15) {
        const key = `${normalizedName}:${normalizedExt}`;
        if (!uniqueDomainsMap.has(key)) {
          uniqueDomainsMap.set(key, {
            name: normalizedName,
            extension: normalizedExt,
          });
        }
      }
    };

    const safePrefixes = prefixes ?? [];
    const safeSuffixes = suffixes ?? [];
    const safeSeeds = seeds ?? [];

    // Two-word names: prefix + niche, niche + suffix, prefix + seed, seed + suffix
    if (nicheToken.length > 0) {
      for (const pre of safePrefixes) {
        for (const tld of this.TLDS) {
          addUnique(`${pre}${nicheToken}`, tld);
        }
      }
      for (const suff of safeSuffixes) {
        for (const tld of this.TLDS) {
          addUnique(`${nicheToken}${suff}`, tld);
        }
      }
    }

    for (const pre of safePrefixes) {
      for (const seed of safeSeeds) {
        for (const tld of this.TLDS) {
          addUnique(`${pre}${seed}`, tld);
        }
      }
    }

    for (const seed of safeSeeds) {
      for (const suff of safeSuffixes) {
        for (const tld of this.TLDS) {
          addUnique(`${seed}${suff}`, tld);
        }
      }
    }

    return Array.from(uniqueDomainsMap.values());
  }
}
