export interface BrandingComponents {
  niche: string;
  seeds: string[];
  prefixes: string[];
  suffixes: string[];
}

export interface DomainResult {
  name: string;
  extension: string;
}

export interface GenerateDto {
  niche: string;
  apiKey: string;
}

export interface HuntResponse {
  niche: string;
  components: BrandingComponents;
  domains: string[];
}
