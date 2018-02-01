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

/* eslint-disable no-console*/

'use strict';

const fs = require('fs');
const path = require('path');
const ghDeploy = require('./github-deploy');
const webpackMerge = require('webpack-merge'); // used to merge webpack configs
const ghpages = require('gh-pages');


/**
 * Webpack Constants
 */
const GIT_REMOTE_NAME = 'origin';
const COMMIT_MESSAGE = 'Updates';
const GH_REPO_NAME = ghDeploy.getRepoName(GIT_REMOTE_NAME);

module.exports = function(options) {
    const webpackConfigFactory = ghDeploy.getWebpackConfigModule(options); // the settings that are common to prod and dev
    const webpackConfig = webpackConfigFactory(options);

    // replace the instance of HtmlWebpackPlugin with an updated one.
    ghDeploy.replaceHtmlWebpackPlugin(webpackConfig.plugins, GH_REPO_NAME);

    return webpackMerge(webpackConfig, {
        output: {
            /**
             * The public path is set to the REPO name.
             *
             * `HtmlElementsPlugin` will add it to all resources url's created by it.
             * `HtmlWebpackPlugin` will add it to all webpack bundels/chunks.
             *
             * In theory publicPath shouldn't be used since the browser should automatically prefix the
             * `baseUrl` into all URLs, however this is not the case when the URL is absolute (start with /)
             *
             * It's important to prefix & suffix the repo name with a slash (/).
             * Prefixing so every resource will be absolute (otherwise it will be url.com/repoName/repoName...
             * Suffixing since chunks will not do it automatically (testes against about page)
             */
            publicPath: '/' + GH_REPO_NAME + '/' + ghDeploy.safeUrl(webpackConfig.output.publicPath)
        },

        plugins: [
            function() {
                this.plugin('done', function(stats) {
                    console.log('Starting deployment to GitHub.');

                    const logger = function(msg) {
                        console.log(msg);
                    };

                    const options = {
                        logger: logger,
                        remote: GIT_REMOTE_NAME,
                        message: COMMIT_MESSAGE,
                        dotfiles: true // for .nojekyll
                    };

                    // Since GitHub moved to Jekyll 3.3, their server ignores the "node_modules" and "vendors" folder by default.
                    // but, as of now, it also ignores "vendors*" files.
                    // This means vendor.bundle.js or vendor.[chunk].bundle.js will return 404.
                    // this is the fix for now.
                    fs.writeFileSync(path.join(webpackConfig.output.path, '.nojekyll'), '');

                    ghpages.publish(webpackConfig.output.path, options, function(err) {
                        if (err) {
                            console.log('GitHub deployment done. STATUS: ERROR.');
                            throw err;
                        } else {
                            console.log('GitHub deployment done. STATUS: SUCCESS.');
                        }
                    });
                });
            }
        ]
    });
};
