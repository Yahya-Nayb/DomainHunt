import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { AIService } from './ai.service';
import { ValidatorService } from './validator.service';
import { from, mergeMap, toArray, lastValueFrom } from 'rxjs';

@Injectable()
export class GeneratorService {
  private readonly logger = new Logger(GeneratorService.name);
  private readonly TLDS = ['com'];
  private readonly BATCH_SIZE = 50;
  private readonly CONCURRENCY_LIMIT = 20;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
    private aiService: AIService,
    private validatorService: ValidatorService,
  ) {}

  async generateAndSave(niche: string, userApiKey?: string) {
    // 1. Check the Env before starting
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_KEY');
    if (!url || !key) {
      this.logger.error('CRITICAL: SUPABASE_URL or SUPABASE_KEY is missing from environment.');
      throw new InternalServerErrorException('Database configuration missing.');
    }

    let components;
    try {
      this.logger.log(`[Phase 1] Requesting AI Branding Components for niche: ${niche}...`);
      components = await this.aiService.generateBrandingComponents(niche, userApiKey);
    } catch (error) {
      this.logger.error(`[AI_SERVICE_FAILURE] Error calling AI Service.`);
      throw new InternalServerErrorException(`AI Generation failed: ${error.message}`);
    }

    const { seeds, suffixes: brandingSuffixes, prefixes: powerPrefixes } = components;
    const uniqueDomainsMap = new Map<string, { name: string; extension: string }>();

    const addUnique = (name: string, extension: string) => {
      const normalizedName = name.toLowerCase().trim();
      const normalizedExt = extension.toLowerCase().trim();
      if (normalizedName.length >= 4 && normalizedName.length <= 15) {
        const key = `${normalizedName}:${normalizedExt}`;
        if (!uniqueDomainsMap.has(key)) {
          uniqueDomainsMap.set(key, { name: normalizedName, extension: normalizedExt });
        }
      }
    };

    for (const pre of powerPrefixes) {
      for (const seed of seeds) {
        for (const tld of this.TLDS) { addUnique(`${pre}${seed}`, tld); }
      }
    }
    for (const seed of seeds) {
      for (const suff of brandingSuffixes) {
        for (const tld of this.TLDS) { addUnique(`${seed}${suff}`, tld); }
      }
    }
    for (const seed of seeds) {
      for (const tld of this.TLDS) { addUnique(seed, tld); }
    }

    const allGenerated = Array.from(uniqueDomainsMap.values());
    this.logger.log(`[Phase 2] Total Unique Names Generated: ${allGenerated.length}`);

    const availableDomains: any[] = [];
    for (let i = 0; i < allGenerated.length; i += this.BATCH_SIZE) {
      const batch = allGenerated.slice(i, i + this.BATCH_SIZE);
      const results = await lastValueFrom(
        from(batch).pipe(
          mergeMap(async (domain) => {
            const status = await this.validatorService.checkAvailability(domain.name, domain.extension);
            if (status === 'available') {
              return {
                ...domain,
                source_logic: 'ai_dynamic_branding_v1',
                niche: niche.toLowerCase(),
                status: 'available',
              };
            }
            return null;
          }, this.CONCURRENCY_LIMIT),
          toArray()
        )
      );
      availableDomains.push(...results.filter(r => r !== null));
    }

    this.logger.log(`[Phase 3] Total Available Domains found: ${availableDomains.length}`);

    if (availableDomains.length === 0) {
      return { totalAvailable: 0, shortlist: [] };
    }

    const fullNames = availableDomains.map(d => `${d.name}.${d.extension}`);
    let premiumShortlistNames: string[] = [];
    try {
      this.logger.log(`Ranking available domains to find Top 30 Premium names...`);
      premiumShortlistNames = await this.aiService.rankDomains(fullNames, niche, userApiKey);
    } catch (error) {
      this.logger.error(`Failed to rank domains: ${error.message}`);
      premiumShortlistNames = fullNames.slice(0, 30);
    }

    const premiumDomainsToSave = availableDomains.filter(domain => {
      const fullName = `${domain.name}.${domain.extension}`;
      return premiumShortlistNames.includes(fullName);
    });

    this.logger.log(`[Phase 4] Saving ${premiumDomainsToSave.length} Premium domains to database...`);

    // 2. Log the URL before the fetch
    console.log('Final Supabase URL Check:', url);

    try {
      await this.saveToStaging(premiumDomainsToSave);
      return {
        totalAvailable: availableDomains.length,
        shortlist: premiumShortlistNames
      };
    } catch (error) {
      throw error;
    }
  }

  async saveToStaging(domains: any[]) {
    const client = this.supabaseService.getClient();
    let totalSaved = 0;

    // Refactor: Save one by one with retry logic for the 30 domains
    for (const domain of domains) {
      let retries = 3;
      let success = false;

      while (retries > 0 && !success) {
        try {
          const { error } = await client
            .from('generated_domains')
            .upsert(domain, { onConflict: 'name,extension' });

          if (error) throw error;
          
          success = true;
          totalSaved++;
          this.logger.log(`[Saved] ${domain.name}.${domain.extension} (${totalSaved}/${domains.length})`);
        } catch (error) {
          retries--;
          this.logger.warn(`Failed to save ${domain.name}. Retries left: ${retries}. Error: ${error.message}`);
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            this.logger.error(`CRITICAL: Permanent failure saving ${domain.name} to database.`);
            // We don't throw here to allow other domains in the 30 to attempt saving
          }
        }
      }
    }

    if (totalSaved === 0 && domains.length > 0) {
      throw new InternalServerErrorException('Failed to save any domains to the database.');
    }
  }
}
