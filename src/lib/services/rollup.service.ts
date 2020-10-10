import {rollup} from 'rollup';
import {format} from 'prettier';
import {outputFile} from 'fs-extra';

export class RollupService {
  constructor() {}

  async bundleCode(inputPath: string, outputPath: string) {
    const bundle = await rollup({input: inputPath});
    const {output} = await bundle.generate({format: 'iife', name: 'Addon'});
    const bundleContent = format(
      output[0].code
        .replace(/var Addon = [^\n]*/g, '') // var Addon = (function (exports) {
        .replace(/'use strict';/g, '') // 'use strict';
        .replace(/exports\.[^\n]*/g, '') // all lines: exports.
        .replace(/return exports;/g, '') // return exports;
        .replace(/\}\(\{\}\)\);/g, ''), // }({}));
      {
        parser: 'flow',
      }
    );
    return await outputFile(outputPath, bundleContent);
  }
}
