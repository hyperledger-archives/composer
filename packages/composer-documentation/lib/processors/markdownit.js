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

const fs = require('fs');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');

let htmlify = async function(context,meta){

    let md = new MarkdownIt();
    md.use(markdownItAnchor, {
        level: 1,
        permalink: false,
        permalinkClass: 'header-anchor',
        permalinkSymbol: '¶',
        permalinkBefore: false
    });


    let produce = (file,cb) => {

        let contents = fs.readFileSync(file.path);
        file.contents = Buffer.from(md.render(contents.toString()));
        cb(null, file);
    };

    context[meta.streamId].pipeElements.push(produce);

};

module.exports = function(processors){
    processors.markdownit = { post: htmlify};
};