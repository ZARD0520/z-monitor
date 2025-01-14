import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

export default [{
  input: 'src/index.js',
  output: {
    name: 'vue',
    file: 'dist/index.js',
    format: 'esm',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 排除 node_modules
      babelHelpers: 'bundled',
    }),
    terser(), // 代码混淆插件
  ],
},{
  input: 'src/index.js',
  output: {
    file: 'dist/index.d.ts',
    format: 'esm',
  },
  plugins: [dts()]
}];