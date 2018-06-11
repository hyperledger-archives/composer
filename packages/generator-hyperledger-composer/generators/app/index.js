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

let generators = require('yeoman-generator');
let optionOrPrompt = require('yeoman-option-or-prompt');
let Util = require('../util');

module.exports = generators.Base.extend({

    _optionOrPrompt: optionOrPrompt,

    constructor: function() {
        generators.Base.apply(this, arguments);
        this.options = this.env.options;
    },

    /**
    * @returns {Object} List of questions to ask
    */
    prompting: function() {
        Util.log('Welcome to the Hyperledger Composer project generator');
        const questions = [{
            type: 'list',
            name: 'generatorType',
            message: 'Please select the type of project:',
            choices: [
                {
                    name: 'Angular',
                    value: 'Angular'
                },
                {
                    name: 'Business Network',
                    value: 'businessnetwork'
                },
                {
                    name: 'LoopBack',
                    value: 'loopback'
                },
                {
                    name: 'Model',
                    value: 'model'
                }
            ],
            store: true,
            validate: Util.validateGeneratorType
        }];

        return this._optionOrPrompt(questions)
            .then((answers) => {
                this.generatorType = answers.generatorType;
            });
    },

    configuring: function() {
        if(this.generatorType === 'Angular'){
            Util.log('You can run this generator using: \'yo hyperledger-composer:angular\'');
            this.composeWith(require.resolve('../angular'));
        } else if (this.generatorType === 'businessnetwork') {
            Util.log('You can run this generator using: \'yo hyperledger-composer:businessnetwork\'');
            this.composeWith(require.resolve('../businessnetwork'));
        } else if (this.generatorType === 'loopback') {
            Util.log('You can run this generator using: \'yo hyperledger-composer:loopback\'');
            this.composeWith(require.resolve('../loopback'));
        } else if (this.generatorType === 'model') {
            Util.log('You can run this generator using: \'yo hyperledger-composer:model\'');
            this.composeWith(require.resolve('../model'));
        } else{
            Util.log('Generator type not recognised');
        }
    },
});
