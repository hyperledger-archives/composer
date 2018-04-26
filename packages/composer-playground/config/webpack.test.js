/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * @author: @AngularClass
 */

'use strict';

const webpack = require('webpack');
const helpers = require('./helpers');
/**
 * Webpack Plugins
 */
const DefinePlugin = require('webpack/lib/DefinePlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');

/**
 * Webpack Constants
 */
const ENV = process.env.ENV = process.env.NODE_ENV = 'test';
const DOCKER = !!process.env.DOCKER;
const DOCKER_COMPOSE = !!process.env.DOCKER_COMPOSE;
const PLAYGROUND_API = process.env.PLAYGROUND_API || 'playground-api';

/*
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
        devtool : 'inline-source-map',

        /**
         * Options affecting the resolving of modules.
         *
         * See: http://webpack.github.io/docs/configuration.html#resolve
         */
        resolve : {

            /**
             * An array of extensions that should be used to resolve modules.
             *
             * See: http://webpack.github.io/docs/configuration.html#resolve-extensions
             */
            extensions : ['.ts', '.js', '.json', '.html'],
            // An array of directory names to be resolved to the current directory
            modules : [helpers.root('src'), 'node_modules'],
            // Use our versions of Node modules.
            alias : {
                sinon : require.resolve('sinon/pkg/sinon')
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
        module : {

            noParse : [/sinon/],

            rules : [
                /*
                 * Typescript loader support for .ts and Angular 2 async routes via .async.ts
                 * Replace templateUrl and stylesUrl with require()
                 *
                 * See: https://github.com/s-panferov/awesome-typescript-loader
                 * See: https://github.com/TheLarkInn/angular2-template-loader
                 */
                {
                    test : /\.ts$/,
                    use : [
                        {
                            loader : 'awesome-typescript-loader',
                            query : {
                                // use inline sourcemaps for 'karma-remap-coverage' reporter
                                sourceMap : false,
                                inlineSourceMap : true,
                                compilerOptions : {
                                    // Remove TypeScript helpers to be injected
                                    // below by DefinePlugin
                                    removeComments : true
                                }
                            }
                        },
                        'angular2-template-loader']
                },
                /**
                 * Source map loader support for *.js files
                 * Extracts SourceMaps for source files that as added as sourceMappingURL comment.
                 *
                 * See: https://github.com/webpack/source-map-loader
                 */
                {
                    test : /\.js$/,
                    exclude : /(node_modules|bower_components)/,
                    loader : 'babel-loader',
                    query : {
                        presets : [require.resolve('babel-preset-latest')]
                    }
                },

                /**
                 * Json loader support for *.json files.
                 *
                 * See: https://github.com/webpack/json-loader
                 */
                {
                    test : /\.json$/,
                    loader : 'json-loader',
                    exclude : [helpers.root('src/index.html')]
                },
                /**
                 * Raw loader support for *.css files
                 * Returns file content as string
                 *
                 * See: https://github.com/webpack/raw-loader
                 */
                {
                    test : /\.css$/,
                    loader : ['to-string-loader', 'css-loader'],
                    exclude : [helpers.root('src/index.html')]
                },

                /**
                 * Raw loader support for *.scss files
                 *
                 * See: https://github.com/webpack/raw-loader
                 */
                {
                    test : /\.scss$/,
                    loader : ['raw-loader', 'sass-loader'],
                    exclude : [helpers.root('src/index.html')]
                },

                /**
                 * Raw loader support for *.html
                 * Returns file content as string
                 *
                 * See: https://github.com/webpack/raw-loader
                 */
                {
                    test : /\.html$/,
                    loader : 'raw-loader',
                    exclude : [helpers.root('src/index.html')]
                },

                {test : /sinon.*\.js$/, loader : 'imports-loader?define=>false,require=>false'},

                /**
                 * Instruments JS files with Istanbul for subsequent code coverage reporting.
                 * Instrument only testing sources.
                 *
                 * See: https://github.com/deepsweet/istanbul-instrumenter-loader
                 */
                {
                    enforce : 'post',
                    test : /\.(js|ts)$/,
                    loader : 'istanbul-instrumenter-loader',
                    include : helpers.root('src'),
                    exclude : [
                        /node_modules/,
                        /\.spec\.(js|ts)$/
                    ]
                },

                {
                    test : /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                    loader : 'url-loader?limit=10000&minetype=application/font-woff'
                },
                {
                    test : /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                    loader : 'url-loader?limit=10000&minetype=application/font-woff'
                },
                {
                    test : /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                    loader : 'url-loader?limit=10000&minetype=application/octet-stream'
                },
                {
                    test : /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                    loader : 'file-loader'
                },
                {
                    test : /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                    loader : 'url-loader?limit=10000&minetype=image/svg+xml'
                },
                {
                    test : /\.bna$/,
                    loader : 'buffer-loader'
                }
            ]
        },

        /**
         * Add additional plugins to the compiler.
         *
         * See: http://webpack.github.io/docs/configuration.html#plugins
         */
        plugins : [

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
                'ENV' : JSON.stringify(ENV),
                'HMR' : false,
                'DOCKER' : DOCKER,
                'DOCKER_COMPOSE' : DOCKER_COMPOSE,
                'PLAYGROUND_API' : JSON.stringify(PLAYGROUND_API),
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
                debug : true,
                options : {}
            }),

            new webpack.ProvidePlugin({
                jQuery : 'jquery',
                $ : 'jquery',
                jquery : 'jquery'
            }),
        ],

        node: {
            fs: 'empty',
            net: 'empty',
            tls: 'empty'
        }
    };
};
