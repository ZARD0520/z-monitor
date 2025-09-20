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
        exclude: 'node_modules/**', // 排除 node_modules
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react']
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
        exclude: 'node_modules/**', // 排除 node_modules
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react']
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