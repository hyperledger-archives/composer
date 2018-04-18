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
const cheerio = require('cheerio');

/**
 * @class
 * @classdesc A class for extracting code-block elements from markdown files
 */
class MDCodeExtractor {
    /**
     * @example
     * // returns {"commands": {"cli": {"network-start": "composer network start"}, "yo": {"start-generator": "yo hyperledger-composer:angular"}, "arguments": {"cli": {"card-name": "admin@tutorial-network"}}}}
     * File at filepath passed contains:
     * <code-block type="commands" sub-type="cli" identifier="network-start" >
     *
     *  composer network start
     *
     * </code-block>
     *
     * Some text here talking about an argument to be passed <code-block type="arguments" sub-type="cli" identifier="card-name" > admin@tutorial-network </code-block>
     *
     * <code-block type="commands" sub-type="yo" identifier="start-generator" >
     *
     *  yo hyperledger-composer:angular
     *
     * </code-block>
     * @param {string} filepath the path to the markdown file where code-block elements should be parsed from
     * @returns {object} object made up of top level keys that consist of values set in the type attribute of the code block element, second level keys made up of sub-type attributes and third level keys made up of identifier attributes. Value at third level key is the text in the code-block
     */
    static extract(filepath) {
        const $ = cheerio.load(fs.readFileSync(filepath, 'UTF8'));
        const codeBlocks = {};
        $('code-block').each((i, el) => {
            let type = $(el).attr('type');
            let subType = $(el).attr('sub-type');
            let identifier = $(el).attr('identifier');
            let text = $(el).text().trim();
            if (!type) {
                console.warn(`code-block: ${text} \ndoes not contain a type attribute, not adding to set.`);
                return;
            } else if (!subType) {
                console.warn(`code-block: ${text} \ndoes not contain a sub-type attribute, not adding to set.`);
                return;
            } else if (!identifier) {
                console.warn(`code-block: ${text} \ndoes not contain an identifier attribute, not adding to set.`);
                return;
            }
            if (!codeBlocks.hasOwnProperty(type)) {
                codeBlocks[type] = {};
            }
            if (!codeBlocks[type].hasOwnProperty(subType)) {
                codeBlocks[type][subType] = {};
            }
            codeBlocks[type][subType][identifier] = text.split('`').join('');
        });
        return codeBlocks;
    }
}
module.exports = MDCodeExtractor;