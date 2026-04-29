import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execPromise = promisify(exec);

@Injectable()
export class AiService {
  async fetchEliteNames(niche: string, userApiKey: string) {
    try {
      const pythonPath = path.resolve(
        process.cwd(),
        '../dspy-ai/venv/bin/python3',
      );
      const scriptPath = path.resolve(process.cwd(), '../dspy-ai/app.py');

      const command = `"${pythonPath}" "${scriptPath}" "${niche}" "${userApiKey}"`;

      const { stdout } = await execPromise(command);

      const result = JSON.parse(stdout);

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        success: true,
        data: result.domains,
        strategy: result.strategy,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
