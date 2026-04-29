export interface GenerateDto {
  niche: string;
  apiKey: string;
}

export interface HuntResponse {
  niche: string;
  strategy: string;
  domains: string[];
}
