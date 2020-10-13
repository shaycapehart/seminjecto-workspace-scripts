export class OptionService {
  private options = {
    deployDir: '.deploy',
    inputPath: './src/hook.js',
    iifePath: './src/addon.js',
    tsconfigPath: './tsconfig-addon.json',
  };

  constructor() {}

  getOptions() {
    return this.options;
  }
}
