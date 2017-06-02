import fable from 'rollup-plugin-fable';
import bundleSize from 'rollup-plugin-bundle-size';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-re';

const { FABLE_SERVER_PORT: port = 61225 } = process.env;

export default {
  entry: './Base.fsproj',
  dest: './dist/bundle.js',
  external: [
    'socket.io',
    'pg-native',
    'url',
    'tls',
    'dns',
    'events',
    'util',
    'crypto',
    'net',
    'assert',
    'path',
    'fs',
    'stream',
    'https',
    'string_decoder',
    'querystring'
  ],
  format: 'cjs',
  plugins: [
    replace({
      include: 'node_modules/pg/lib/index.js',
      patterns: [
        {
          test: "require('./native')",
          replace: '{}'
        }
      ]
    }),
    babel({
      include: 'node_modules/@mfl/**/*',
      plugins: ['transform-object-rest-spread'],
      babelrc: false
    }),
    resolve({
      jsnext: true,
      main: true,
      browser: false
    }),
    commonjs({
      namedExports: {
        'node_modules/pg/lib/index.js': ['Pool', 'Client']
      }
    }),
    fable({
      babel: {
        presets: [['env', { targets: { node: 'current' }, modules: false }]],
        plugins: ['transform-object-rest-spread'],
        babelrc: false
      },
      port
    }),
    bundleSize()
  ]
};
