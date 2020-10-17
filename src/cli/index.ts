import {red} from 'chalk';
import {Command} from 'commander';
import {Lib as WorkspaceaddonscriptsModule} from '../lib/index';
import {BuildCommand} from './commands/build.command';
import {DeployCommand} from './commands/deploy.command';

export class Cli {
  private workspaceaddonscriptsModule: WorkspaceaddonscriptsModule;
  buildCommand: BuildCommand;
  deployCommand: DeployCommand;

  commander = [
    'seminjecto-workspace-scripts',
    'Scripts for Google Workspace addons.',
  ];

  buildCommandDef: CommandDef = ['build', 'Build distribution package.'];

  deployCommandDef: CommandDef = [
    'deploy',
    'Push to the Apps Script server.',
    ['-d, --dry-run', 'Staging only.'],
    ['--copy [value]', 'Copied resources, comma-seperated.'],
    ['--vendor [value]', 'Files for @vendor.js, comma-seperated.'],
  ];

  constructor() {
    this.workspaceaddonscriptsModule = new WorkspaceaddonscriptsModule();
    this.buildCommand = new BuildCommand(
      this.workspaceaddonscriptsModule.optionService,
      this.workspaceaddonscriptsModule.messageService
    );
    this.deployCommand = new DeployCommand(
      this.workspaceaddonscriptsModule.optionService,
      this.workspaceaddonscriptsModule.messageService,
      this.workspaceaddonscriptsModule.fileService,
      this.workspaceaddonscriptsModule.rollupService
    );
  }

  getApp() {
    const commander = new Command();

    // general
    const [command, description] = this.commander;
    commander
      .version(require('../../package.json').version, '-v, --version')
      .name(`${command}`)
      .usage('[options] [command]')
      .description(description);

    // build
    (() => {
      const [command, description] = this.buildCommandDef;
      commander
        .command(command)
        .description(description)
        .action(() => this.buildCommand.run());
    })();

    // deploy
    (() => {
      const [
        command,
        description,
        dryRunOpt,
        copyOpt,
        vendorOpt,
      ] = this.deployCommandDef;
      commander
        .command(command)
        .description(description)
        .option(...dryRunOpt) // -d, --dry-run
        .option(...copyOpt) // --copy
        .option(...vendorOpt) // --vendor
        .action(options => this.deployCommand.run(options));
    })();

    // help
    commander
      .command('help')
      .description('Display help.')
      .action(() => commander.outputHelp());

    // *
    commander
      .command('*')
      .description('Any other command is not supported.')
      .action(cmd => console.error(red(`Unknown command '${cmd.args[0]}'`)));

    return commander;
  }
}

type CommandDef = [string, string, ...Array<[string, string]>];
