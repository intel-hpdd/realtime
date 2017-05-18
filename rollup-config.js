import fable from 'rollup-plugin-fable';
import bundleSize from 'rollup-plugin-bundle-size';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const { FABLE_SERVER_PORT: port = 61225 } = process.env;

export default {
  entry: './Realtime.fsproj',
  dest: './dist/bundle.js',
  external: ['socket.io'],
  plugins: [
    resolve({
      jsnext: true,
      main: true
    }),
    commonjs(),
    fable({
      babel: {
        presets: [['env', { targets: { node: 'current' }, modules: false }]],
        plugins: [],
        babelrc: false
      },
      port
    }),
    bundleSize()
  ],
  format: 'cjs'
};
