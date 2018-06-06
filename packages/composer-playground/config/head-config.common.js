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
 * Configuration for head elements added during the creation of index.html.
 *
 * All href attributes are added the publicPath (if exists) by default.
 * You can explicitly hint to prefix a publicPath by setting a boolean value to a key that has
 * the same name as the attribute you want to operate on, but prefix with =
 *
 * Example:
 * { name: 'msapplication-TileImage', content: '/assets/icon/ms-icon-144x144.png', '=content': true },
 * Will prefix the publicPath to content.
 *
 * { rel: 'apple-touch-icon', sizes: '57x57', href: '/assets/icon/apple-icon-57x57.png', '=href': false },
 * Will not prefix the publicPath on href (href attributes are added by default
 *
 */

'use strict';

module.exports = {
    link: [
        /** <link> tags for 'apple-touch-icon' (AKA Web Clips). **/
        {
            rel: 'apple-touch-icon',
            sizes: '57x57',
            href: '/assets/icon/apple-icon-57x57.png'
        },
        {
            rel: 'apple-touch-icon',
            sizes: '60x60',
            href: '/assets/icon/apple-icon-60x60.png'
        },
        {
            rel: 'apple-touch-icon',
            sizes: '72x72',
            href: '/assets/icon/apple-icon-72x72.png'
        },
        {
            rel: 'apple-touch-icon',
            sizes: '76x76',
            href: '/assets/icon/apple-icon-76x76.png'
        },
        {
            rel: 'apple-touch-icon',
            sizes: '114x114',
            href: '/assets/icon/apple-icon-114x114.png'
        },
        {
            rel: 'apple-touch-icon',
            sizes: '120x120',
            href: '/assets/icon/apple-icon-120x120.png'
        },
        {
            rel: 'apple-touch-icon',
            sizes: '144x144',
            href: '/assets/icon/apple-icon-144x144.png'
        },
        {
            rel: 'apple-touch-icon',
            sizes: '152x152',
            href: '/assets/icon/apple-icon-152x152.png'
        },
        {
            rel: 'apple-touch-icon',
            sizes: '180x180',
            href: '/assets/icon/apple-icon-180x180.png'
        },

        /** <link> tags for android web app icons **/
        {
            rel: 'icon',
            type: 'image/png',
            sizes: '192x192',
            href: '/assets/icon/android-icon-192x192.png'
        },

        /** <link> tags for favicons **/
        {
            rel: 'icon',
            type: 'image/png',
            sizes: '32x32',
            href: '/assets/icon/favicon.ico'
        },
        {
            rel: 'icon',
            type: 'image/png',
            sizes: '96x96',
            href: '/assets/icon/favicon.ico'
        },
        {
            rel: 'icon',
            type: 'image/png',
            sizes: '16x16',
            href: '/assets/icon/favicon.ico'
        },


        /** <link> tags for a Web App Manifest **/
        {
            rel: 'manifest',
            href: '/assets/manifest.json'
        }
    ],
    meta: [{
        name: 'msapplication-TileColor',
        content: '#00bcd4'
    },
    {
        name: 'msapplication-TileImage',
        content: '/assets/icon/ms-icon-144x144.png',
        '=content': true
    },
    {
        name: 'theme-color',
        content: '#00bcd4'
    }]
};
