import fable from 'rollup-plugin-fable';
import bundleSize from 'rollup-plugin-bundle-size';

const { FABLE_SERVER_PORT: port = 61225 } = process.env;

export default {
  entry: './Realtime.fsproj',
  dest: './dist/bundle.js',
  external: ['socket.io'],
  plugins: [
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
