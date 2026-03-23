import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import * as dnsPromises from 'dns/promises';
import * as dns from 'dns';
import { from, mergeMap, toArray, lastValueFrom } from 'rxjs';

@Injectable()
export class ValidatorService {
  private readonly logger = new Logger(ValidatorService.name);
  private readonly batchSize = 50;
  private readonly delayBetweenBatches = 100;
  private readonly concurrencyLimit = 20;

  constructor(private supabaseService: SupabaseService) {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  }

  async checkAvailability(name: string, extension: string, isRetry = false): Promise<string> {
    const domainName = `${name}.${extension}`;
    try {
      await dnsPromises.resolve(domainName);
      return 'taken';
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        return 'available';
      }

      // Retry logic for ESERVFAIL or ETIMEOUT
      if (!isRetry && (error.code === 'ESERVFAIL' || error.code === 'ETIMEOUT')) {
        this.logger.debug(`Retrying ${domainName} due to ${error.code}...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        return this.checkAvailability(name, extension, true);
      }

      this.logger.warn(`DNS Error for ${domainName}: ${error.code}`);
      return 'pending';
    }
  }

  async validateAllPending(niche?: string) {
    const client = this.supabaseService.getClient();
    const summary = { available: 0, taken: 0, error: 0, total: 0 };
    let hasMore = true;

    this.logger.log(`Starting bulk validation for ${niche || 'all'} niches...`);

    while (hasMore) {
      let query = client
        .from('generated_domains')
        .select('*')
        .eq('status', 'pending')
        .limit(this.batchSize);

      if (niche) {
        query = query.eq('niche', niche.toLowerCase());
      }

      const { data: domains, error: fetchError } = await query;

      if (fetchError) {
        this.logger.error(`Failed to fetch pending domains: ${fetchError.message}`);
        throw new Error(`Failed to fetch pending domains: ${fetchError.message}`);
      }

      if (!domains || domains.length === 0) {
        hasMore = false;
        break;
      }

      this.logger.log(`Processing batch of ${domains.length} domains (Concurrency: ${this.concurrencyLimit})...`);

      // Use RxJS to handle concurrency limit
      const updatedDomains = await lastValueFrom(
        from(domains).pipe(
          mergeMap(async (domain) => {
            const status = await this.checkAvailability(domain.name, domain.extension);
            return { ...domain, status };
          }, this.concurrencyLimit),
          toArray()
        )
      );

      const { error: upsertError } = await client
        .from('generated_domains')
        .upsert(updatedDomains);

      if (upsertError) {
        this.logger.error(`Failed to update domain statuses: ${upsertError.message}`);
        throw new Error(`Failed to update domain statuses: ${upsertError.message}`);
      }

      updatedDomains.forEach((d) => {
        summary[d.status]++;
        summary.total++;
      });

      await new Promise((resolve) => setTimeout(resolve, this.delayBetweenBatches));
    }

    this.logger.log(`Validation Complete: ${JSON.stringify(summary)}`);
    return summary;
  }
}
