import {execSync} from 'child_process';
import {outputJson, remove} from 'fs-extra';

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
    const {inputPath, iifePath, tsconfigPath} = this.optionService.getOptions();
    // compile
    await this.compileCode(tsconfigPath);
    // bundle
    await this.rollupService.bundleCode(inputPath, iifePath);
    // done
    return this.messageService.logOk(
      'Build addon completed, you may now push to the server.'
    );
  }

  private async compileCode(tsconfigPath: string) {
    // save temp tsconfig
    await outputJson(tsconfigPath, {
      extends: './node_modules/gts/tsconfig-google.json',
      compilerOptions: {
        moduleResolution: 'Node',
        module: 'ESNext',
        rootDir: '.',
        skipLibCheck: true,
      },
      include: ['src/**/*.ts'],
    });
    // compile
    execSync('npx tsc -p ' + tsconfigPath, {stdio: 'ignore'});
    // remove temp tsconfig
    await remove(tsconfigPath);
  }
}
