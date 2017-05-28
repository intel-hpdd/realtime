import fable from 'rollup-plugin-fable';
import bundleSize from 'rollup-plugin-bundle-size';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

const { FABLE_SERVER_PORT: port = 61225 } = process.env;

export default {
  entry: './Base.fsproj',
  dest: './dist/bundle.js',
  external: ['socket.io'],
  plugins: [
    babel({
      include: 'node_modules/@mfl/**/*',
      plugins: ['transform-object-rest-spread'],
      babelrc: false
    }),
    resolve({
      jsnext: true,
      main: true
    }),
    commonjs(),
    fable({
      babel: {
        presets: [['env', { targets: { node: 'current' }, modules: false }]],
        plugins: ['transform-object-rest-spread'],
        babelrc: false
      },
      port
    }),
    bundleSize()
  ],
  format: 'cjs'
};
