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
'use strict';

const execSync = require('child_process').execSync;
const webpackMerge = require('webpack-merge'); // used to merge webpack configs
const HtmlWebpackPlugin = require('html-webpack-plugin');

const REPO_NAME_RE = /Push {2}URL: https:\/\/github\.com\/.*\/(.*)\.git/;

/**
* @param {object} options the object to base the require against
* @returns {object} the module.exports of webpack.dev.js or webpack.prod.js depending on whether githubDev or githubProd exist as properties of the passed options
* @throws will throw an error if neither githubDev nor githubProd exist as properties in the passed options
*/
function getWebpackConfigModule(options) {
    if (options.githubDev) {
        return require('../webpack.dev.js');
    } else if (options.githubProd) {
        return require('../webpack.prod.js');
    } else {
        throw new Error('Invalid compile option.');
    }
}

/**
 * @param  {string} [remoteName=origin] the name of the remote to get the repository name of
 * @return {string} returns the repository name for the given remote
 */
function getRepoName(remoteName) {
    remoteName = remoteName || 'origin';

    let stdout = execSync('git remote show ' + remoteName),
        match = REPO_NAME_RE.exec(stdout);

    if (!match) {
        throw new Error('Could not find a repository on remote ' + remoteName);
    } else {
        return match[1];
    }
}

/**
 * @param  {string} str  string to strip
 * @param  {char} char character to strip from start and end of string
 * @return {string} the original string with the first and last characters's removed if they match the passed char
 */
function stripTrailing(str, char) {

    if (str[0] === char) {
        str = str.substr(1);
    }

    if (str.substr(-1) === char) {
        str = str.substr(0, str.length - 1);
    }

    return str;
}

/**
 * Given a string remove trailing slashes and adds 1 slash at the end of the string.
 *
 * @example
 * // returns 'value/'
 * safeUrl('/value/')
 * @param {string} url the url to make safe
 * @returns {string} inputted url with trailing slashes removed and 1 slash at end
 */
function safeUrl(url) {
    const stripped = stripTrailing(url || '', '/');
    return stripped ? stripped + '/' : '';
}

/**
 * Remove the instance of HtmlWebpackPlugin that is passed in the plugins array and places in it a new instance with baseUrl changed in the metadata to be made up of the passed repository name and safeUrl formatted former baseUrl
 * @param  {array} plugins An array of plugins
 * @param  {string} ghRepoName Name of the github repository
 * @returns {void}
 */
function replaceHtmlWebpackPlugin(plugins, ghRepoName) {
    for (let i = 0; i < plugins.length; i++) {
        if (plugins[i] instanceof HtmlWebpackPlugin) {
            // remove the old instance of the html plugin
            const htmlPlug = plugins.splice(i, 1)[0];
            const METADATA = webpackMerge(htmlPlug.options.metadata, {
                /**
                 * Prefixing the REPO name to the baseUrl for router support.
                 * This also means all resource URIs (CSS/Images/JS) will have this prefix added by the browser
                 * unless they are absolute (start with '/'). We will handle it via `output.publicPath`
                 */
                baseUrl: '/' + ghRepoName + '/' + safeUrl(htmlPlug.options.metadata.baseUrl)
            });

            // add the new instance of the html plugin.
            plugins.splice(i, 0, new HtmlWebpackPlugin({
                template: htmlPlug.options.template,
                title: htmlPlug.options.title,
                chunksSortMode: htmlPlug.options.chunksSortMode,
                metadata: METADATA,
                inject: htmlPlug.options.inject
            }));
            return;
        }
    }
}
exports.getWebpackConfigModule = getWebpackConfigModule;
exports.getRepoName = getRepoName;
exports.safeUrl = safeUrl;
exports.replaceHtmlWebpackPlugin = replaceHtmlWebpackPlugin;
