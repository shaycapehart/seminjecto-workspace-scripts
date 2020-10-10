import {execSync} from 'child_process';

import {OptionService} from '../../lib/services/option.service';
import {MessageService} from '../../lib/services/message.service';
import {RollupService} from '../../lib/services/rollup.service';

export class BuildCommand {
  constructor(
    private optionService: OptionService,
    private messageService: MessageService,
    private rollupService: RollupService
  ) {}

  async run() {
    const {inputPath, iifePath} = this.optionService.getOptions();
    // compile
    execSync('npx tsc', {stdio: 'ignore'});
    // bundle
    await this.rollupService.bundleCode(inputPath, iifePath);
    // done
    return this.messageService.logOk(
      'Build addon completed, you may now push to the server.'
    );
  }
}
