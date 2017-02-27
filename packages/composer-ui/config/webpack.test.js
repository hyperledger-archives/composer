/**
 * @author: @AngularClass
 */

const webpack = require('webpack');
const helpers = require('./helpers');
const path = require('path');

/**
 * Webpack Plugins
 */
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');

/**
 * Webpack Constants
 */
const ENV = process.env.ENV = process.env.NODE_ENV = 'test';
const DOCKER = !!process.env.DOCKER;
const DOCKER_COMPOSE = !!process.env.DOCKER_COMPOSE;
const PLAYGROUND_API = process.env.PLAYGROUND_API;

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
module.exports = function (options) {
  return {

    /**
     * Source map for Karma from the help of karma-sourcemap-loader &  karma-webpack
     *
     * Do not change, leave as is or it wont work.
     * See: https://github.com/webpack/karma-webpack#source-maps
     */
    devtool: 'inline-source-map',

    /**
     * Options affecting the resolving of modules.
     *
     * See: http://webpack.github.io/docs/configuration.html#resolve
     */
    resolve: {

      /**
       * An array of extensions that should be used to resolve modules.
       *
       * See: http://webpack.github.io/docs/configuration.html#resolve-extensions
       */
      extensions: ['.ts', '.js', '.json'],

      /**
       * Make sure root is src
       */
      modules: [ path.resolve(__dirname, 'src'), 'node_modules' ],

      // Use our versions of Node modules.
      alias: {
        'fs': 'browserfs/dist/shims/fs.js',
        'buffer': 'browserfs/dist/shims/buffer.js',
        'path': 'browserfs/dist/shims/path.js',
        'processGlobal': 'browserfs/dist/shims/process.js',
        'bufferGlobal': 'browserfs/dist/shims/bufferGlobal.js',
        'bfsGlobal': require.resolve('browserfs')
      }

    },

    /**
     * Options affecting the normal modules.
     *
     * See: http://webpack.github.io/docs/configuration.html#module
     *
     * 'use:' revered back to 'loader:' as a temp. workaround for #1188
     * See: https://github.com/AngularClass/angular2-webpack-starter/issues/1188#issuecomment-262872034
     */
    module: {

      rules: [

        /**
         * Source map loader support for *.js files
         * Extracts SourceMaps for source files that as added as sourceMappingURL comment.
         *
         * See: https://github.com/webpack/source-map-loader
         */
        {
          enforce: 'pre',
          test: /\.js$/,
          loader: 'source-map-loader',
          exclude: [
            // these packages have problems with their sourcemaps
            helpers.root('node_modules/rxjs'),
            helpers.root('node_modules/@angular')
          ]
        },

        /**
         * Typescript loader support for .ts and Angular 2 async routes via .async.ts
         *
         * See: https://github.com/s-panferov/awesome-typescript-loader
         */
        {
          test: /\.ts$/,
          loader: 'awesome-typescript-loader',
          query: {
            // use inline sourcemaps for "karma-remap-coverage" reporter
            sourceMap: false,
            inlineSourceMap: true,
            compilerOptions: {

              // Remove TypeScript helpers to be injected
              // below by DefinePlugin
              removeComments: true

            }
          },
          exclude: [/\.e2e\.ts$/]
        },

        /**
         * Json loader support for *.json files.
         *
         * See: https://github.com/webpack/json-loader
         */
        {
          test: /\.json$/,
          loader: 'json-loader',
          exclude: [helpers.root('src/index.html')]
        },

        /**
         * Raw loader support for *.css files
         * Returns file content as string
         *
         * See: https://github.com/webpack/raw-loader
         */
        {
          test: /\.css$/,
          loader: ['to-string-loader', 'css-loader'],
          exclude: [helpers.root('src/index.html')]
        },

        /**
         * Raw loader support for *.html
         * Returns file content as string
         *
         * See: https://github.com/webpack/raw-loader
         */
        {
          test: /\.html$/,
          loader: 'raw-loader',
          exclude: [helpers.root('src/index.html')]
        },

        /**
         * Instruments JS files with Istanbul for subsequent code coverage reporting.
         * Instrument only testing sources.
         *
         * See: https://github.com/deepsweet/istanbul-instrumenter-loader
         */
        {
          enforce: 'post',
          test: /\.(js|ts)$/,
          loader: 'istanbul-instrumenter-loader',
          include: helpers.root('src'),
          exclude: [
            /\.(e2e|spec)\.ts$/,
            /node_modules/
          ]
        },

        {
          test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
          loader: "url-loader?limit=10000&minetype=application/font-woff"
        },
        {
          test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
          loader: "url-loader?limit=10000&minetype=application/font-woff"
        },
        {
          test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
          loader: "url-loader?limit=10000&minetype=application/octet-stream"
        },
        {
          test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
          loader: "file-loader"
        },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          loader: "url-loader?limit=10000&minetype=image/svg+xml"
        },

        /**
         * BrowserFS has a crap implementation of setImmediate:
         *   https://github.com/jvilk/BrowserFS/issues/169
         * Because we use its implementation of vital modules such
         * as 'process', we must use this hack to force a require
         * of setimmediate before anything else.
         */
        {
          test: /browserfs.*\.js$/,
          loader: 'imports-loader?importedSetImmediate=setimmediate'
        },

        {
          test: /\.js$/,
          exclude: /(node_modules(?!\composer)|bower_components)/,
          loader: 'babel-loader',
          query: {
            presets: ['es2015']
          }
        }

      ]
    },

    /**
     * Add additional plugins to the compiler.
     *
     * See: http://webpack.github.io/docs/configuration.html#plugins
     */
    plugins: [

      /**
       * Plugin: DefinePlugin
       * Description: Define free variables.
       * Useful for having development builds with debug logging or adding global constants.
       *
       * Environment helpers
       *
       * See: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
       */
      // NOTE: when adding more properties make sure you include them in custom-typings.d.ts
      new DefinePlugin({
        'ENV': JSON.stringify(ENV),
        'HMR': false,
        'DOCKER': DOCKER,
        'DOCKER_COMPOSE': DOCKER_COMPOSE
        /* 'process.env': {
          'ENV': JSON.stringify(ENV),
          'NODE_ENV': JSON.stringify(ENV),
          'HMR': false,
        } */
      }),

      /**
       * Plugin: ContextReplacementPlugin
       * Description: Provides context to Angular's use of System.import
       *
       * See: https://webpack.github.io/docs/list-of-plugins.html#contextreplacementplugin
       * See: https://github.com/angular/angular/issues/11580
       */
      new ContextReplacementPlugin(
        // The (\\|\/) piece accounts for path separators in *nix and Windows
        /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
        helpers.root('src'), // location of your src
        {
          // your Angular Async Route paths relative to this root directory
        }
      ),

       /**
       * Plugin LoaderOptionsPlugin (experimental)
       *
       * See: https://gist.github.com/sokra/27b24881210b56bbaff7
       */
      new LoaderOptionsPlugin({
        debug: true,
        options: {

        }
      }),

      new webpack.ProvidePlugin({
        jQuery: 'jquery',
        $: 'jquery',
        jquery: 'jquery'
      }),

      new webpack.ProvidePlugin({ BrowserFS: 'bfsGlobal', process: 'processGlobal', Buffer: 'bufferGlobal' })

    ],

    /**
     * Include polyfills or mocks for various node stuff
     * Description: Node configuration
     *
     * See: https://webpack.github.io/docs/configuration.html#node
     */
    node: {
      global: true,
      process: false,
      crypto: 'empty',
      module: false,
      clearImmediate: false,
      setImmediate: false
    }

  };
}
