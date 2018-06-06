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

let yeoman = require('yeoman-generator');
let optionOrPrompt = require('yeoman-option-or-prompt');
let Util = require('../util');

module.exports = yeoman.Base.extend({

    _optionOrPrompt: optionOrPrompt,

    constructor: function() {
        yeoman.Base.apply(this, arguments);
        this.options = this.env.options;
    },

    prompting: function() {
        Util.log('Welcome to the model generator');

        let questions = [
            {
                type: 'input',
                name: 'appname',
                message: 'Model project name:',
                store: true,
                validate: Util.validateBusinessNetworkName
            },
            {
                type: 'input',
                name: 'appdescription',
                message: 'Description:',
                store: true,
                validate: Util.validateDescription
            },
            {
                type: 'input',
                name: 'appauthor',
                message: 'Author name: ',
                store: true,
                validate: Util.validateAuthorName
            },
            {
                type: 'input',
                name: 'appemail',
                message: 'Author email:',
                store: true,
                validate: Util.validateAuthorEmail
            },
            {
                type: 'input',
                name: 'applicense',
                message: 'License:',
                default: 'Apache-2.0',
                store: true,
                validate: Util.validateLicense
            },
            {
                type: 'input',
                name: 'ns',
                message: 'Namespace:',
                default: 'org.example.mynetwork',
                store: true,
                validate: Util.validateNamespace
            }
        ];

        return this._optionOrPrompt(questions)
            .then((answers) => {
                this.appname = answers.appname;
                this.appemail = answers.appemail;
                this.namespace = answers.ns;
                this.appdescription = answers.appdescription;
                this.appauthor = answers.appauthor;
                this.applicense = answers.applicense;
            });
    },

    configuring: function() {
        this.destinationRoot(this.appname);
    },

    writing: function() {
        let model = this._generateTemplateModel();
        this.fs.copyTpl(this.templatePath('**!(models)*'), this.destinationPath(), model);
        this.fs.copyTpl(this.templatePath('models/namespace.cto'), this.destinationPath('models/'+this.namespace+'.cto'), model);
    },

    _generateTemplateModel: function() {
        return {
            appname: this.appname,
            appemail: this.appemail,
            namespace: this.namespace,
            appdescription: this.appdescription,
            appauthor: this.appauthor,
            applicense: this.applicense
        };
    }
});
