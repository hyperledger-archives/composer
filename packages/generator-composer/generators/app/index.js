'use strict';

let generators = require('yeoman-generator');
//
// let chalk       = require('chalk');
// let figlet      = require('figlet');


module.exports = generators.Base.extend({

    constructor: function() {
        generators.Base.apply(this, arguments);
        this.options = this.env.options;
//         console.log(
//   chalk.yellow(
//     figlet.textSync('IBM Concerto')
//   )
// );

    },

  /**
   * @returns {Object} List of questins to ask
   */
    prompting: function() {
        const questions = [{
            when: !this.options.appName,
            type: 'input',
            name: 'appName',
            message: 'Your NPM library name:',
            default: 'concerto-sample-app',
            store: false,
            validate: function(input) {
                if(input !== null && input !== undefined &&
          input.match(/^[\w-]+$/)) {
                    return true;
                } else {
                    return 'Name must only use lowercase letters, numbers and dashes: ^[a-z\-\d]+$';
                }
            }
        }, {
            type: 'input',
            name: 'appDescription',
            message: 'Short description:',
            default: 'Test Concerto project',
            store: false,
            validate: function(input) {
                if(input !== null && input !== undefined && input !== '') {
                    return true;
                } else {
                    return 'Description cannot be null or empty.';
                }
            }
        }, {
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
        }, {
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
        },{
            type: 'input',
            name: 'npmNetworkDependancy',
            message: 'NPM Module name of the Business Network to connect to:',
            default: '@ibm/digitalproperty-network',
            store: false,
            validate: function(input) {
                if(input !== null && input !== undefined && input !== '') {
                    return true;
                } else {
                    return 'Network cannot be null or empty.';
                }
            }
        }, {
            type: 'confirm',
            name: 'isNpmSameAsNetworkIdentifier',
            message: 'Is the name in NPM registry the same as the Business Network Identifier?:',
            default: true,
            store: false
        }, {
            type: 'input',
            name: 'networkIdentifier',
            message: 'What is the Business Network Identifier?:',
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
        },  {
            type: 'input',
            name: 'connectionProfileName',
            message: 'What is the Connection Profile to use?',
            default: 'defaultProfile',
            store: false,
            validate: function(input) {
                if(input !== null && input !== undefined && input !== '') {
                    return true;
                } else {
                    return 'Connection Profile cannot be null or empty.';
                }
            }
        },{
            type: 'input',
            name: 'enrollmentId',
            message: 'Enrollment id:',
            store: true,
            default: 'WebAppAdmin',
            validate: function(input) {
                if(input !== null && input !== undefined && input !== '') {
                    return true;
                } else {
                    return 'Enrollment id name cannot be null or empty.';
                }
            }
        }, {
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
        }];

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
    // create project in new folder with chosen appName
        console.log('configuring: '+this.appName);
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
        console.log('Getting the npm module describing the ' + this.concertoNetwork);
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
            networkIdentifier: this.networkIdentifier,
            npmNetworkDependancy: this.npmNetworkDependancy,
            connectionProfileName: this.connectionProfileName,
            enrollmentId: this.enrollmentId,
            enrollmentSecret: this.enrollmentSecret
        };
    }

});
