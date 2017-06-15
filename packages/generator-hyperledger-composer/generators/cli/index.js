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


module.exports = generators.Base.extend({

    constructor: function() {
        generators.Base.apply(this, arguments);
        this.options = this.env.options;
    },

  /**
   * @returns {Object} List of questins to ask
   */
    prompting: function() {
        console.log('Welcome to the CLI project generator');
        const questions = [
            {
                when: !this.options.appName,
                type: 'input',
                name: 'appName',
                message: 'Project name:',
                default: 'cli-app',
                store: false,
                validate: function(input) {
                    if(input !== null && input !== undefined &&
          input.match(/^[\w-]+$/)) {
                        return true;
                    } else {
                        return 'Name must only use lowercase letters, numbers and dashes: ^[a-z\-\d]+$';
                    }
                }
            },
            {
                type: 'input',
                name: 'appDescription',
                message: 'Description:',
                default: 'Hyperledger Composer CLI project',
                store: false,
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    } else {
                        return 'Description cannot be null or empty.';
                    }
                }
            },
            {
                type: 'input',
                name: 'authorName',
                message: 'Author name:',
                store: true,
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    } else {
                        return 'Author name cannot be null or empty.';
                    }
                }
            },
            {
                type: 'input',
                name: 'authorEmail',
                message: 'Author email:',
                store: true,
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    } else {
                        return 'Author email cannot be null or empty.';
                    }
                }
            },
            {
                type: 'input',
                name: 'license',
                message: 'License:',
                default: 'Apache-2.0',
                store: true,
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    } else {
                        return 'Licence cannot be null or empty.';
                    }
                }
            },
            {
                type: 'input',
                name: 'npmNetworkDependancy',
                message: 'NPM business network module:',
                default: 'digitalproperty-network',
                store: false,
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    } else {
                        return 'Network cannot be null or empty.';
                    }
                }
            },
            {
                type: 'confirm',
                name: 'isNpmSameAsNetworkIdentifier',
                message: 'Is the name in NPM registry the same as the Business Network Identifier?:',
                default: true,
                store: false
            },
            {
                type: 'input',
                name: 'networkIdentifier',
                message: 'Business network identifier:',
                store: false,
                when: function(answers) {
                    return !answers.isNpmSameAsNetworkIdentifier;
                },
                validate: function(input) {
                    if(input !== null && input !== undefined &&
          input.match(/^[\/\@\w-]+$/)) {
                        return true;
                    } else {
                        return 'Name must only use lowercase letters, numbers and dashes: ^[a-z\-\d]+$';
                    }
                }
            },
            {
                type: 'input',
                name: 'connectionProfileName',
                message: 'Connection profile:',
                default: 'defaultProfile',
                store: false,
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    } else {
                        return 'Connection Profile cannot be null or empty.';
                    }
                }
            },
            {
                type: 'input',
                name: 'enrollmentId',
                message: 'Enrollment ID:',
                store: true,
                default: 'WebAppAdmin',
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    } else {
                        return 'Enrollment id name cannot be null or empty.';
                    }
                }
            },
            {
                type: 'input',
                name: 'enrollmentSecret',
                message: 'Enrollment Secret:',
                default: 'DJY27pEnl16d',
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    } else {
                        return 'Enrollment Secret email cannot be null or empty.';
                    }
                }
            }
        ]
        ;

        return this.prompt(questions).then(answers => {
            if (!this.options.appName) {
                this.appName = answers.appName;
            } else {
                this.appName = this.options.appName;
            }
            if (answers.isNpmSameAsNetworkIdentifier){
                this.networkIdentifier = answers.npmNetworkDependancy;
            }else {
                this.networkIdentifier = answers.networkIdentifier;
            }
            this.appDescription = answers.appDescription;

            this.authorName = answers.authorName;
            this.authorEmail = answers.authorEmail;
            this.license = answers.license;

            this.npmNetworkDependancy = answers.npmNetworkDependancy;
            this.connectionProfileName = answers.connectionProfileName;
            this.enrollmentId = answers.enrollmentId;
            this.enrollmentSecret = answers.enrollmentSecret;
        });
    },

  /**
   * #3 in Yeoman run context.
   * Configure generator.
   */
    configuring: function() {
        this.destinationRoot(this.appName);
    },

  /**
   * #5 in Yeoman run context.
   * Write templates to destination.
   */
    writing: function() {
        let model = this._generateTemplateModel();
        this.fs.copyTpl(this.templatePath('**/*'), this.destinationPath(), model);
        this.fs.move(this.destinationPath('_dot_gitignore'), this.destinationPath('.gitignore'));
    },

  /**
   * Creates a model object passed into all templates.
   * @return {Object} to be passed to the templates
   */
    _generateTemplateModel: function() {
        return {
            appName: this.appName,
            appDescription: this.appDescription,
            authorName: this.authorName,
            authorEmail: this.authorEmail,
            license: this.license,
            networkIdentifier: this.networkIdentifier,
            npmNetworkDependancy: this.npmNetworkDependancy,
            connectionProfileName: this.connectionProfileName,
            enrollmentId: this.enrollmentId,
            enrollmentSecret: this.enrollmentSecret
        };
    }

});
