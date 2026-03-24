import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface BrandingComponents {
  niche: string;
  seeds: string[];
  suffixes: string[];
  prefixes: string[];
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly GITHUB_ENDPOINT = 'https://models.inference.ai.azure.com';
  private readonly MODEL_NAME = 'Llama-3.3-70B-Instruct';

  constructor(private configService: ConfigService) {}

  private getClient(userApiKey?: string): OpenAI {
    if (!userApiKey) {
      throw new UnauthorizedException(
        'GitHub Token is required to start hunting.',
      );
    }
    return new OpenAI({
      apiKey: userApiKey.trim(),
      baseURL: this.GITHUB_ENDPOINT,
    });
  }

  async generateBrandingComponents(
    niche: string,
    userApiKey?: string,
  ): Promise<BrandingComponents> {
    const client = this.getClient(userApiKey);

    const escapedNiche = niche.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const prompt = `Task: Generate high-end, two-word English branding components for the Niche: "${escapedNiche}".

Core Rules:
- Strict Two-Word Rule: Every resulting domain name must be exactly TWO real English dictionary words concatenated (no space). One word MUST be the niche/industry itself OR a direct synonym from your seeds list.
- NO Affixes: Do not use prefixes like "pre-", "anti-" or suffixes like "-ify", "-ly", "-ize". Only whole, standalone dictionary words.
- Radio-Call Integrity: Every word must be trivial to spell correctly after hearing it once.
- BANNED in any word: silent letters (e.g. debt, light), ambiguous phonetics (e.g. ph, ch pronounced as k, c as s), and double letters that change or obscure sound.
- REQUIRED: Hard, clear consonants and simple vowels (e.g. Snap, Go, Base, Hub, Sky). Prefer short, common spellings.
-If the niche is multiple words (e.g., 'Pro Gear'), treat the primary keyword (e.g., 'Gear') as the anchor and use the other words (e.g., 'Pro') to influence the style of seeds, but always output exactly TWO dictionary words in total
Output Structure (JSON only, no markdown or prose):
{
  "niche": "${escapedNiche}",
  "seeds": [5 clear synonymous English words for the niche—each a single standalone word, same constraints as above],
  "prefixes": [5 punchy English nouns/verbs to place BEFORE the niche or a seed (e.g. Open, Smart, Blue)—single words only],
  "suffixes": [5 solid English nouns/verbs to place AFTER the niche or a seed (e.g. Path, Grid, Box)—single words only]
}

Final combinations must read as Prefix+Niche, Niche+Suffix, Prefix+Seed, or Seed+Suffix (concatenated, lowercase when used as domains). Output ONLY the JSON object.`;

    try {
      this.logger.log(`Requesting ${this.MODEL_NAME} for niche: ${niche}`);

      const response = await client.chat.completions.create({
        model: this.MODEL_NAME,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || '{}';
      return JSON.parse(content) as BrandingComponents;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`GitHub AI (Llama 3.3) Error: ${message}`);
      throw new InternalServerErrorException(`AI Engine failed: ${message}`);
    }
  }
}
