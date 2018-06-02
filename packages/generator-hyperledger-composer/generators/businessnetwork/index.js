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

const optionOrPrompt = require('yeoman-option-or-prompt');
const Util = require('../util');
const version = require('../../package.json').version;
const yeoman = require('yeoman-generator');

module.exports = yeoman.Base.extend({

    _optionOrPrompt: optionOrPrompt,

    prompting: function() {
        Util.log('Welcome to the business network generator');

        let questions = [
            {
                type: 'input',
                name: 'appname',
                message: 'Business network name:',
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
                default: 'org.example.biznet',
                store: true,
                validate: Util.validateNamespace
            },
            {
                type: 'list',
                name: 'empty',
                message: 'Do you want to generate an empty template network?',
                default: 'false',
                store: true,
                choices: [{
                    name: 'Yes: generate an empty template network',
                    value: 'yes'
                },
                {
                    name: 'No: generate a populated sample network',
                    value: 'no'
                }
                ]
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
                this.empty = answers.empty;
            });
    },

    configuring: function() {
        this.destinationRoot(this.appname);
    },

    writing: function() {
        let model = this._generateTemplateModel();
        if (this.empty && this.empty.toLocaleLowerCase().localeCompare('yes') === 0) {
            this.fs.copyTpl(this.templatePath('package.json'), this.destinationPath('package.json'), model);
            this.fs.copyTpl(this.templatePath('README.md'), this.destinationPath('README.md'), model);
            this.fs.copyTpl(this.templatePath('models/empty_namespace.cto'), this.destinationPath('models/'+this.namespace+'.cto'), model);
            this.fs.copyTpl(this.templatePath('empty_permissions.acl'), this.destinationPath('permissions.acl'), model);
            this.fs.copyTpl(this.templatePath('_dot_eslintrc.yml'), this.destinationPath('.eslintrc.yml'), model);
        } else {
            this.fs.copyTpl(this.templatePath('package.json'), this.destinationPath('package.json'), model);
            this.fs.copyTpl(this.templatePath('README.md'), this.destinationPath('README.md'), model);
            this.fs.copyTpl(this.templatePath('models/namespace.cto'), this.destinationPath('models/'+this.namespace+'.cto'), model);
            this.fs.copyTpl(this.templatePath('permissions.acl'), this.destinationPath('permissions.acl'), model);
            this.fs.copyTpl(this.templatePath('_dot_eslintrc.yml'), this.destinationPath('.eslintrc.yml'), model);
            /* istanbul ignore else */
            if (!this.ismodel) {
                this.fs.copyTpl(this.templatePath('./features'), this.destinationPath('./features'), model);
                this.fs.copyTpl(this.templatePath('./test'), this.destinationPath('./test'), model);
                this.fs.copyTpl(this.templatePath('./lib'), this.destinationPath('./lib'), model);
            }
        }
    },

    _generateTemplateModel: function() {
        return {
            composerversion: `^${version}`,
            appname: this.appname,
            appemail: this.appemail,
            namespace: this.namespace,
            appdescription: this.appdescription,
            appauthor: this.appauthor,
            applicense: this.applicense
        };
    }
});
