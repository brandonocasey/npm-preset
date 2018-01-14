import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import { minify } from 'uglify-es';

export default [
  {
    name: 'npmPreset',
    input: 'src/npmp.js',
    output: {file: 'dist/npmp.js', format: 'cjs'},
    banner: '#!/usr/bin/env node',
    plugins: [
      resolve({browser: false, main: true, jsnext: true}),
      json(),
      commonjs(),
      uglify({}, minify)
    ]
  },
  {
    name: 'npmPreset',
    input: 'src/npmp.js',
    output: {file: 'dist/npmp.dev.js', format: 'cjs'},
    banner: '#!/usr/bin/env node',
    plugins: [
      resolve({browser: false, main: true, jsnext: true}),
      json(),
      commonjs()
    ]
  }
];

