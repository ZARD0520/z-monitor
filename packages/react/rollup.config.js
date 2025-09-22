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
    },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react'],
        plugins: [
          '@babel/plugin-proposal-nullish-coalescing-operator',
          '@babel/plugin-proposal-optional-chaining'
        ]
      }),
      resolve(),
      commonjs(),
      terser({ 
        module: true,
        compress: { passes: 2 },
        mangle: true
      })
    ],
  },
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.cjs.min.js',
      format: 'cjs',
    },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react'],
        plugins: [
          '@babel/plugin-proposal-nullish-coalescing-operator',
          '@babel/plugin-proposal-optional-chaining'
        ]
      }),
      resolve(),
      commonjs(),
      terser({
        compress: { passes: 2 },
        mangle: true
      })
    ],
  }
])