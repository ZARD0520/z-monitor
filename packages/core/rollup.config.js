import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
/**
 *  @type { import ("rollup").RollupOptions }
 * */
export default {
  input: 'src/index.js',
  output: {
    name: 'core',
    dir: 'dist',
    format: 'esm',
    preserveModules: true,
    preserveModulesRoot: 'src'
  },
  plugins: [
    babel({
      exclude: 'node_modules/**', // 排除 node_modules
      babelHelpers: 'bundled',
    }),
    terser(), // 代码混淆插件
  ],
}