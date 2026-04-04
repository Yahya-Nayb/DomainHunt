export interface BrandingWord {
  word: string;
  essence: string;
}

export interface BrandingComponents {
  niche: string;
  seeds: BrandingWord[];
  prefixes: BrandingWord[];
  suffixes: BrandingWord[];
}

export interface DomainResult {
  name: string;
  extension: string;
  description?: string;
}

export interface GenerateDto {
  niche: string;
  apiKey: string;
}

export interface DomainInfo {
  name: string;
  description: string;
}

export interface HuntResponse {
  niche: string;
  components: BrandingComponents;
  domains: DomainInfo[];
}
