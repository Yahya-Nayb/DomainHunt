import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export interface BrandingComponents {
  niche: string;
  seeds: string[];
  suffixes: string[];
  prefixes: string[];
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(private configService: ConfigService) {}

  private getClient(userApiKey?: string) {
    if (!userApiKey) {
      throw new UnauthorizedException('Gemini API Key is required to start hunting.');
    }
    return new GoogleGenerativeAI(userApiKey);
  }

  async generateBrandingComponents(niche: string, userApiKey?: string): Promise<BrandingComponents> {
    console.log("userApiKey >> ",userApiKey)
    const genAI = this.getClient(userApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            niche: { type: SchemaType.STRING },
            seeds: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            prefixes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            suffixes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          },
          required: ["niche", "seeds", "prefixes", "suffixes"],
        },
      },
    });

    const prompt = `
      You are a Semantic Branding Expert. Deconstruct the niche "${niche}" into high-value domain components.
      
      Component Guidelines:
      - seeds: 20 evocative words (3-6 letters) representing the essence.
      - prefixes: 10 dynamic starters implying leadership or innovation (e.g., 'neo', 'meta', 'hyper').
      - suffixes: 15 Contextual Branding Suffixes specific to the niche (e.g., for Fintech: 'pay', 'mint', 'vault'; for Eco: 'leaf', 'green', 'root').
      
      Ensure all words are in English and avoid generic terms like 'best' or 'top'.
    `;

    try {
      const result = await model.generateContent(prompt);
      const content = result.response.text();
      return JSON.parse(content) as BrandingComponents;
    } catch (error) {
      this.logger.error(`Failed to generate branding components: ${error.message}`);
      throw new Error('AI Generation failed');
    }
  }

  async rankDomains(domains: string[], niche: string, userApiKey?: string): Promise<string[]> {
    const genAI = this.getClient(userApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            shortlist: { 
              type: SchemaType.ARRAY, 
              items: { type: SchemaType.STRING } 
            }
          },
          required: ["shortlist"],
        },
      },
    });

    const prompt = `
      You are a Semantic Branding Expert and Startup Consultant. 
      Niche: ${niche}.
      
      From the provided list of available domains, select EXACTLY 30 names that are:
      - Highly brandable (unique, evocative)
      - Easy to spell and pronounce
      - Short (generally < 10 characters)
      - Sounds like a premium startup.

      Available Domains:
      ${domains.join(', ')}
    `;

    try {
      const result = await model.generateContent(prompt);
      const content = result.response.text();
      const parsed = JSON.parse(content);
      return parsed.shortlist || [];
    } catch (error) {
      this.logger.error(`Failed to rank domains: ${error.message}`);
      // Fallback to first 30 if AI fails
      return domains.slice(0, 30);
    }
  }
}
