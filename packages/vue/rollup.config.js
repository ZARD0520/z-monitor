import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.js',
  output: {
    name: 'vue',
    file: 'dist/index.js',
    format: 'esm',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 排除 node_modules
      babelHelpers: 'bundled'
    }),
    resolve(),
    commonjs(),
    terser(), // 代码混淆插件
  ]
}
