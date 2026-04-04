import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { BrandingComponents } from './types';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  private readonly GROQ_ENDPOINT = 'https://api.groq.com/openai/v1';
  private readonly MODEL_NAME = 'llama-3.1-8b-instant';

  constructor(private configService: ConfigService) {}

  private getClient(userApiKey?: string): OpenAI {
    console.log('userApiKey >> ', userApiKey);
    if (!userApiKey) {
      throw new UnauthorizedException(
        'Groq API Key is required to start hunting.',
      );
    }
    return new OpenAI({
      apiKey: userApiKey.trim(),
      baseURL: this.GROQ_ENDPOINT,
    });
  }

  async generateBrandingComponents(
    niche: string,
    userApiKey?: string,
  ): Promise<BrandingComponents> {
    const client = this.getClient(userApiKey);

    const escapedNiche = niche.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const prompt = `Role: World-Class Brand Strategist & Lexicographer.
Task: Generate elite, two-word English branding components for the Niche: "${escapedNiche}".

--- THE 4 COMMANDMENTS OF ELITE BRANDING ---

1. DICTIONARY PURITY & PHONETICS: Use ONLY complete, high-value English words found in a standard dictionary. 
   - STRICT BAN: No fragments (Cereb), No abbreviations (Sync/Tech), No "Baby-talk" endings (Linky, Nodey, Bytez, Fluxx).
   - PHONETICS: Prioritize Hard Plosives (K, T, P, B, G, D). Every word must pass the "Radio Test" (easy to spell over phone).

2. METAPHORIC ARCHITECTURE: Focus on "Agentic" metaphors symbolizing intelligence, direction, and strength.
   - PREFERRED LEXICON: [Nexus, Vector, Forge, Grid, Logic, Axis, Byte, Flux, Pilot, Sentry, Oracle, Signal, Core, Node, Base, Volt, Glyph, Path, Cipher, Catalyst].

3. SEMANTIC EXCLUSION: Strictly FORBIDDEN to use the niche name "${escapedNiche}", "AI", "Agent", or functional suffixes like "-er", "-or", "-ator". 

4. POSITIVE POWER: All words must evoke growth, precision, or resilience. Strictly FORBIDDEN: [Void, Null, Static, Psycho, Dead, Pulse, Stop].

--- OUTPUT LOGIC ---
- Each word must be 3-7 characters long to ensure the combined domain stays under 14 chars.
- ESSENCE RULE: Provide a powerful brand statement. It MUST explicitly mention the word.
  - Example: For "Cipher", essence is "The Cipher of encrypted intelligence".

--- THE DICTIONARY ENFORCEMENT (STRICT UPDATE) ---
1. ABSOLUTELY NO SUFFIXES AS WORDS: Strictly FORBIDDEN to use 'ics', 'al', 'ian', 'nexa', 'rize', 'bytez', 'nodey'. These are TRASH and will break the system.
2. NO PSEUDO-LATIN: Do not add 'a' or 'o' to words (e.g., No 'Nexav', No 'Vectoro').
3. COMPACT ELITE LIST: If you run out of ideas for 15 items, use these elite roots: 
   [Vault, Bolt, Shield, Iron, Lock, Guard, Fort, Grid, Node, Flux, Axis, Core, Base, Zinc, Steel, Glyph, Cipher, Catalyst, Pilot, Sentry].

REQUIRED STRUCTURE (Strict RAW JSON):
{
  "niche": "${escapedNiche}",
  "formula": "Prefix.essence + Seed.essence",
  "seeds": [ { "word": "Word", "essence": "Brand statement with Word" } ],
  "prefixes": [ { "word": "Word", "essence": "Brand statement with Word" } ],
  "suffixes": [ { "word": "Word", "essence": "Brand statement with Word" } ]
}

*Note: Populate each array with exactly 15 unique, high-entropy items. Output ONLY raw JSON.*`;
    try {
      this.logger.log(
        `Requesting Groq (${this.MODEL_NAME}) for niche: ${niche}`,
      );

      const response = await client.chat.completions.create({
        model: this.MODEL_NAME,
        messages: [
          {
            role: 'system',
            content:
              'You are a professional domain branding engine. Output ONLY raw JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '{}';

      const cleanJson = content.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson) as BrandingComponents;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Groq Engine Error: ${message}`);

      if (message.includes('429')) {
        throw new InternalServerErrorException(
          'Rate limit exceeded. Please wait a moment before the next hunt.',
        );
      }

      throw new InternalServerErrorException(`AI Engine failed: ${message}`);
    }
  }
}
