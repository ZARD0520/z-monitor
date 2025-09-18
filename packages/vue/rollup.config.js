import { defineConfig } from 'rollup';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default defineConfig([
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.min.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      babel({
        exclude: 'node_modules/**', // 排除 node_modules
        babelHelpers: 'bundled',
        presets: [
          ['@babel/preset-env', { targets: 'defaults' }]
        ],
      }),
      resolve(),
      commonjs(),
      terser({ 
        module: true,
        compress: { passes: 2 },
        mangle: true
      })
    ]
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.cjs.min.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      babel({
        exclude: 'node_modules/**', // 排除 node_modules
        babelHelpers: 'bundled'
      }),
      resolve(),
      commonjs(),
      terser({
        compress: { passes: 2 },
        mangle: true
      }),
    ]
  }
])
