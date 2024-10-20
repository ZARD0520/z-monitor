import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'umd',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 排除 node_modules
      babelHelpers: 'bundled',
    }),
    terser(), // 代码混淆插件
  ],
};