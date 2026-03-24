import { Injectable, Logger } from '@nestjs/common';
import * as dnsPromises from 'dns/promises';
import * as dns from 'dns';

function dnsErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }
  const code = (error as { code: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

@Injectable()
export class ValidatorService {
  private readonly logger = new Logger(ValidatorService.name);

  constructor() {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  }

  async checkAvailability(
    name: string,
    extension: string,
    isRetry = false,
  ): Promise<string> {
    const domainName = `${name}.${extension}`;
    try {
      await dnsPromises.resolve(domainName);
      return 'taken';
    } catch (error: unknown) {
      const code = dnsErrorCode(error);
      if (code === 'ENOTFOUND') {
        return 'available';
      }

      // Retry logic for ESERVFAIL or ETIMEOUT
      if (!isRetry && (code === 'ESERVFAIL' || code === 'ETIMEOUT')) {
        this.logger.debug(`Retrying ${domainName} due to ${code}...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
        return this.checkAvailability(name, extension, true);
      }

      this.logger.warn(`DNS Error for ${domainName}: ${code ?? 'unknown'}`);
      return 'pending';
    }
  }
}
