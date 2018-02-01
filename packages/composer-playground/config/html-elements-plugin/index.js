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

/**
 * sets the locations value for use in module to that passed in constructor
 * @param {object} locations locations for use in the module
 * @constructor
 */
function HtmlElementsPlugin(locations) {
    this.locations = locations;
}

const RE_ENDS_WITH_BS = /\/$/;

/**
 * Create an HTML tag with attributes from a map.
 * @example
 * Example:
 * createTag('link', { rel: "manifest", href: "/assets/manifest.json" })
 * // <link rel="manifest" href="/assets/manifest.json">
 * @param {string} tagName The name of the tag
 * @param {map} attrMap A Map of attribute names (keys) and their values.
 * @param {string} publicPath a path to add to the start of static asset url
 * @returns {string} tag made of the data passed
 */
function createTag(tagName, attrMap, publicPath) {
    publicPath = publicPath || '';

    // add trailing slash if we have a publicPath and it doesn't have one.
    if (publicPath && !RE_ENDS_WITH_BS.test(publicPath)) {
        publicPath += '/';
    }

    const attributes = Object.getOwnPropertyNames(attrMap)
        .filter(function(name) {
            return name[0] !== '=';
        })
        .map(function(name) {
            let value = attrMap[name];

            if (publicPath) {
                // check if we have explicit instruction, use it if so (e.g: =herf: false)
                // if no instruction, use public path if it's href attribute.
                const usePublicPath = attrMap.hasOwnProperty('=' + name) ? !!attrMap['=' + name] : name === 'href';

                if (usePublicPath) {
                    // remove a starting trailing slash if the value has one so we wont have //
                    value = publicPath + (value[0] === '/' ? value.substr(1) : value);
                }
            }

            return `${name}="${value}"`;
        });

    const closingTag = tagName === 'script' ? '</script>' : '';

    return `<${tagName} ${attributes.join(' ')}>${closingTag}`;
}

/**
 * Returns a string representing all html elements defined in a data source.
 * @example
 * Example:
 *
 *    const ds = {
 *      link: [
 *        { rel: "apple-touch-icon", sizes: "57x57", href: "/assets/icon/apple-icon-57x57.png" }
 *      ],
 *      meta: [
 *        { name: "msapplication-TileColor", content: "#00bcd4" }
 *      ]
 *    }
 *
 * getHeadTags(ds);
 * // "<link rel="apple-touch-icon" sizes="57x57" href="/assets/icon/apple-icon-57x57.png">"
 *    "<meta name="msapplication-TileColor" content="#00bcd4">"
 * @param {object} dataSource object of tag names and their arrays of Maps of attribute names (keys) and their values.
 * @param {string} publicPath a path to add to the start of static asset url
 * @returns {string} a string of tags seperated by new line and tab characters
 */
function getHtmlElementString(dataSource, publicPath) {
    return Object.getOwnPropertyNames(dataSource)
        .map(function(name) {
            if (Array.isArray(dataSource[name])) {
                return dataSource[name].map(function(attrs) {
                    return createTag(name, attrs, publicPath);
                });
            } else {
                return [createTag(name, dataSource[name], publicPath)];
            }
        })
        .reduce(function(arr, curr) {
            return arr.concat(curr);
        }, [])
        .join('\n\t');
}

HtmlElementsPlugin.prototype.apply = function(compiler) {
    let self = this;
    compiler.plugin('compilation', function(compilation) {
        compilation.options.htmlElements = compilation.options.htmlElements || {};

        compilation.plugin('html-webpack-plugin-before-html-generation', function(htmlPluginData, callback) {
            const locations = self.locations;

            if (locations) {
                const publicPath = htmlPluginData.assets.publicPath;

                Object.getOwnPropertyNames(locations).forEach(function(loc) {
                    compilation.options.htmlElements[loc] = getHtmlElementString(locations[loc], publicPath);
                });
            }


            callback(null, htmlPluginData);
        });
    });

};

module.exports = HtmlElementsPlugin;
