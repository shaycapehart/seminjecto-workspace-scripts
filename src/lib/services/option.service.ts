export class OptionService {
  private options = {
    deployDir: '.deploy',
    inputPath: '',
    iifePath: './src/workspace-addon.js',
  };

  constructor() {}

  getOptions() {
    return this.options;
  }
}
