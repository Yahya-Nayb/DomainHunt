import { Controller, Get, Param, Logger } from '@nestjs/common';
import { ValidatorService } from './validator.service';

@Controller('validator')
export class ValidatorController {
  private readonly logger = new Logger(ValidatorController.name);

  constructor(private readonly validatorService: ValidatorService) {}

  @Get('run/:niche')
  async runValidatorByNiche(@Param('niche') niche: string) {
    try {
      this.logger.log(`Starting bulk validation for niche: ${niche}...`);
      const results = await this.validatorService.validateAllPending(niche);
      
      return {
        niche,
        results,
        message: 'Validation Complete',
      };
    } catch (error) {
      this.logger.error('Validation Failed: ' + error.message);
      return {
        message: 'Validation Failed',
        error: error.message,
      };
    }
  }

  @Get('run')
  async runValidatorAll() {
    try {
      this.logger.log('Starting bulk validation for all pending domains...');
      const results = await this.validatorService.validateAllPending();
      
      return {
        results,
        message: 'Validation Complete',
      };
    } catch (error) {
      this.logger.error('Validation Failed: ' + error.message);
      return {
        message: 'Validation Failed',
        error: error.message,
      };
    }
  }
}
