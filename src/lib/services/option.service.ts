export interface Options {
  deployDir: string;
  inputPath: string;
  iifePath: string;
  tsconfigPath: string;
}

export class OptionService {
  private options: Options = {
    deployDir: '.deploy',
    inputPath: './src/hook.js',
    iifePath: './.deploy/addon.js',
    tsconfigPath: './tsconfig-deploy.json',
  };

  constructor() {}

  getOptions() {
    return this.options;
  }
}
