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

/*
 * Webpack Plugins
 */
// problem with copy-webpack-plugin
const AssetsPlugin = require('assets-webpack-plugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlElementsPlugin = require('./html-elements-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

/*
 * Webpack Constants
 */
const METADATA = {
    baseUrl : '/',
    isDevServer : helpers.isWebpackDevServer(),
    title : process.env.COMPOSER_TITLE ? process.env.COMPOSER_TITLE : 'Hyperledger Composer',
    message : process.env.COMPOSER_MESSAGE ? process.env.COMPOSER_MESSAGE : 'Prepare to Blockchain'
};

/*
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
module.exports = function(options) {
    let isProd = options.env === 'production';
    return {

        /*
         * Cache generated modules and chunks to improve performance for multiple incremental builds.
         * This is enabled by default in watch mode.
         * You can pass false to disable it.
         *
         * See: http://webpack.github.io/docs/configuration.html#cache
         */
        //cache: false,

        /*
         * The entry point for the bundle
         * Our Angular.js app
         *
         * See: http://webpack.github.io/docs/configuration.html#entry
         */
        entry: {

            'polyfills': './src/polyfills.browser.ts',
            'vendor': './src/vendor.browser.ts',
            'main': './src/main.browser.ts'

        },

        /*
         * Options affecting the resolving of modules.
         *
         * See: http://webpack.github.io/docs/configuration.html#resolve
         */
        resolve: {

            /*
             * An array of extensions that should be used to resolve modules.
             *
             * See: http://webpack.github.io/docs/configuration.html#resolve-extensions
             */
            extensions: ['.ts', '.js', '.json'],

            // An array of directory names to be resolved to the current directory
            modules: [helpers.root('src'), 'node_modules']

        },

        /*
         * Options affecting the normal modules.
         *
         * See: http://webpack.github.io/docs/configuration.html#module
         */
        module: {

            rules: [

                /*
                 * Typescript loader support for .ts and Angular 2 async routes via .async.ts
                 * Replace templateUrl and stylesUrl with require()
                 *
                 * See: https://github.com/s-panferov/awesome-typescript-loader
                 * See: https://github.com/TheLarkInn/angular2-template-loader
                 */
                {
                    test: /\.ts$/,
                    use: [
                        '@angularclass/hmr-loader?pretty=' + !isProd + '&prod=' + isProd,
                        'awesome-typescript-loader',
                        'angular2-template-loader',
                        'angular-router-loader'
                    ],
                    exclude: [/\.(spec|e2e)\.ts$/]
                },

                /*
                 * Json loader support for *.json files.
                 *
                 * See: https://github.com/webpack/json-loader
                 */
                {
                    test: /\.json$/,
                    use: 'json-loader'
                },

                /*
                 * to string and css loader support for *.css files
                 * Returns file content as string
                 *
                 */
                {
                    test: /\.css$/,
                    use: ['to-string-loader', 'css-loader']
                },

                /* Raw loader support for *.html
                 * Returns file content as string
                 *
                 * See: https://github.com/webpack/raw-loader
                 */
                {
                    test: /\.html$/,
                    use: 'raw-loader',
                    exclude: [helpers.root('src/index.html')]
                },

                /* File loader for supporting images, for example, in CSS files.
                 */
                {
                    test: /\.(jpg|png|gif)$/,
                    use: 'file-loader'
                },

                {
                    test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'url-loader?limit=10000&minetype=application/font-woff'
                },
                {
                    test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'url-loader?limit=10000&minetype=application/font-woff'
                },
                {
                    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'url-loader?limit=10000&minetype=application/octet-stream'
                },
                {
                    test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'file-loader'
                },
                {
                    test: /\.svg$/,
                    loader: 'svg-sprite-loader?' + JSON.stringify({
                        name: 'icon-[1]',
                        prefixize: true,
                        regExp: './assets/svg/.*/(.*)\\.svg'
                    })
                },
                {
                    test: /\.js$/,
                    exclude: /(node_modules(?!\/(composer|yallist|jsonata|uri-js))|bower_components)/,
                    loader: 'babel-loader',
                    query: {
                        presets: [require.resolve('babel-preset-latest')]
                    }
                },
                {
                    test: /\.scss$/,
                    use: [{
                        loader: 'style-loader'
                    }, {
                        loader: 'css-loader',
                        options: {
                            //   sourceMap: true
                        }
                    }, {
                        loader: 'sass-loader',
                        options: {
                            //   sourceMap: true
                        }
                    }]
                },

                {
                    test: /\.bna$/,
                    loader: 'buffer-loader'
                }

            ],

        },

        /*
         * Add additional plugins to the compiler.
         *
         * See: http://webpack.github.io/docs/configuration.html#plugins
         */
        plugins: [
            new AssetsPlugin({
                path: helpers.root('dist'),
                filename: 'webpack-assets.json',
                prettyPrint: true
            }),

            /*
             * Plugin: CommonsChunkPlugin
             * Description: Shares common code between the pages.
             * It identifies common modules and put them into a commons chunk.
             *
             * See: https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin
             * See: https://github.com/webpack/docs/wiki/optimization#multi-page-app
             */
            new CommonsChunkPlugin({
                name: ['polyfills', 'vendor'].reverse()
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
                /angular(\\|\/)core(\\|\/)src(\\|\/)linker/,
                helpers.root('src'), // location of your src
                {
                    // your Angular Async Route paths relative to this root directory
                }
            ),

            /*
             * Plugin: CopyWebpackPlugin
             * Description: Copy files and directories in webpack.
             *
             * Copies project static assets.
             *
             * See: https://www.npmjs.com/package/copy-webpack-plugin
             */
            new CopyWebpackPlugin([{
                from: 'src/assets',
                to: 'assets'
            },
            {
                from: 'src/meta'
            },
            {
                from: 'src/config'
            }
            ]),


            /*
             * Plugin: HtmlWebpackPlugin
             * Description: Simplifies creation of HTML files to serve your webpack bundles.
             * This is especially useful for webpack bundles that include a hash in the filename
             * which changes every compilation.
             *
             * See: https://github.com/ampedandwired/html-webpack-plugin
             */
            new HtmlWebpackPlugin({
                template: 'src/index.html',
                title: METADATA.title,
                chunksSortMode: 'dependency',
                metadata: METADATA,
                inject: 'head'
            }),

            /*
             * Plugin: ScriptExtHtmlWebpackPlugin
             * Description: Enhances html-webpack-plugin functionality
             * with different deployment options for your scripts including:
             *
             * See: https://github.com/numical/script-ext-html-webpack-plugin
             */
            new ScriptExtHtmlWebpackPlugin({
                defaultAttribute: 'defer'
            }),

            /*
             * Plugin: HtmlElementsPlugin
             * Description: Generate html tags based on javascript maps.
             *
             * If a publicPath is set in the webpack output configuration, it will be automatically added to
             * href attributes, you can disable that by adding a '=href': false property.
             * You can also enable it to other attribute by settings '=attName': true.
             *
             * The configuration supplied is map between a location (key) and an element definition object (value)
             * The location (key) is then exported to the template under then htmlElements property in webpack configuration.
             *
             * Example:
             *  Adding this plugin configuration
             *  new HtmlElementsPlugin({
             *    headTags: { ... }
             *  })
             *
             *  Means we can use it in the template like this:
             *  <%= webpackConfig.htmlElements.headTags %>
             *
             * Dependencies: HtmlWebpackPlugin
             */
            new HtmlElementsPlugin({
                headTags: require('./head-config.common')
            }),

            /**
             * Plugin LoaderOptionsPlugin (experimental)
             *
             * See: https://gist.github.com/sokra/27b24881210b56bbaff7
             */
            new LoaderOptionsPlugin({}),

            new webpack.ProvidePlugin({
                jQuery: 'jquery',
                $: 'jquery',
                jquery: 'jquery'
            }),
        ],

        node: {
            fs: 'empty',
            net: 'empty',
            tls: 'empty'
        }
    };
};
