import {resolve} from 'path';
import {execSync} from 'child_process';
import {pathExists, outputFileSync, readdirSync, readFileSync} from 'fs-extra';
import * as ts from 'typescript';
import * as sass from 'node-sass';
import {pascalCase} from 'change-case';
import {format} from 'prettier';

import {OptionService, Options} from '../../lib/services/option.service';
import {MessageService} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {RollupService} from '../../lib/services/rollup.service';

export interface DeployOptions {
  dryRun?: boolean;
  copy?: string;
  vendor?: string;
}

export class DeployCommand {
  constructor(
    private optionService: OptionService,
    private messageService: MessageService,
    private fileService: FileService,
    private rollupService: RollupService
  ) {}

  async run(cmdOpts: DeployOptions) {
    const options = this.optionService.getOptions();
    // staging
    await this.staging(options, cmdOpts);
    // deploy
    if (!cmdOpts.dryRun) {
      this.push();
      await this.cleanup(options.deployDir);
    } else {
      return this.messageService.logOk('Deploy content saved.');
    }
  }

  private async staging(options: Options, cmdOpts: DeployOptions) {
    const {deployDir} = options;
    const {copy = '', vendor = ''} = cmdOpts;
    // bundle
    await this.bundleCode(options);
    // sidebars & modals
    await this.saveComponents(deployDir, 'sidebar');
    await this.saveComponents(deployDir, 'modal');
    // copy
    await this.copyResources(deployDir, copy);
    // vendor
    await this.saveVendor(deployDir, vendor);
  }

  private push() {
    return execSync('clasp push', {stdio: 'inherit'});
  }

  private cleanup(deployDir: string) {
    return this.fileService.remove(deployDir);
  }

  private async bundleCode(options: Options) {
    const {inputPath, iifePath} = options;
    return this.rollupService.bundleCode(inputPath, iifePath);
  }

  private async saveComponents(deployDir: string, type: string) {
    const componentsPath = `./src/addon/${type}s`;
    if (await pathExists(componentsPath)) {
      const components = readdirSync(componentsPath, {withFileTypes: true})
        .filter(item => item.isDirectory())
        .map(item => item.name);
      components.forEach(name => {
        // read html
        const html = readFileSync(
          resolve(componentsPath, name, name + `.${type}.html`)
        ).toString();
        // render sass
        const {css: cssResult} = sass.renderSync({
          file: resolve(componentsPath, name, name + `.${type}.scss`),
        });
        const css = cssResult.toString();
        // transpile ts
        const tsContent = readFileSync(
          resolve(componentsPath, name, name + `.${type}.ts`)
        )
          .toString()
          // remove all "import ..."
          .replace(/import [^;]*/g, '// import ...')
          .replace(/(\/\/ import ...;)/g, '');
        const {outputText: js} = ts.transpileModule(tsContent, {
          compilerOptions: {
            experimentalDecorators: true,
            skipLibCheck: true,
            module: ts.ModuleKind.None,
            target: ts.ScriptTarget.ESNext,
            lib: ['esnext'],
          },
        });
        // build output
        const output = html
          .replace(
            '</head>',
            !css
              ? '</head>'
              : `<style>
              ${css}
            </style>
            </head>`
          )
          .replace(
            '</body>',
            !js
              ? '</body>'
              : `<script>
              ${js}
            </script>
            </body>`
          );
        // save file
        outputFileSync(
          resolve(deployDir, pascalCase(name + '-' + type) + '.html'),
          format(output, {
            parser: 'html',
          })
        );
      });
    }
  }

  private async copyResources(deployDir: string, input: string) {
    const copies = ['appsscript.json'];
    // extract copied path
    (input || '')
      .split(',')
      .forEach(item => !!item.trim() && copies.push(item.trim()));
    // save file
    return this.fileService.copy(copies, deployDir);
  }

  private async saveVendor(deployDir: string, input: string) {
    // extract vendor paths
    const vendors: string[] = [];
    (input || '')
      .split(',')
      .forEach(item => !!item.trim() && vendors.push(item.trim()));
    if (vendors.length) {
      // merge vendor code
      const contentArr: string[] = [];
      for (const vendor of vendors) {
        const path = vendor
          .replace('~', 'node_modules/')
          .replace('@', 'src/')
          .replace('//', '/');
        const content = await this.fileService.readFile(path);
        contentArr.push([`// ${path}`, content].join('\n'));
      }
      // save file
      return this.fileService.outputFile(
        resolve(deployDir, '@vendor.js'),
        contentArr.join('\n\n')
      );
    }
  }
}
