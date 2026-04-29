import { Injectable, Logger } from '@nestjs/common';
import * as dnsPromises from 'dns/promises';

@Injectable()
export class ValidatorService {
  private readonly logger = new Logger(ValidatorService.name);

  async validateMany(domains: string[]): Promise<string[]> {
    const availableDomains: string[] = [];

    const checks = domains.map(async (domain) => {
      try {
        await dnsPromises.lookup(domain);
        this.logger.debug(`${domain} is taken`);
      } catch (error: any) {
        if (error.code === 'ENOTFOUND') {
          availableDomains.push(domain);
        } else {
          this.logger.warn(`DNS Error for ${domain}: ${error.code}`);
        }
      }
    });

    await Promise.all(checks);
    return availableDomains;
  }
}
