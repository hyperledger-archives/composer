'use strict';

let yeoman = require('yeoman-generator');
let mkdirp = require('mkdirp');

module.exports = yeoman.Base.extend({
    constructor: function() {
        yeoman.Base.apply(this, arguments);
        this.options = this.env.options;
    },

    prompting: function() {
        console.log('Welcome to the business network skeleton generator');

        let questions = [
            {
                type: 'confirm',
                name: 'ismodel',
                message: 'Do you only want to generate a model?',
                store: true,
                default: false
            },
            {
                type: 'input',
                name: 'appname',
                message: 'What is the business network\'s name?',
                store: true,
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '' && input.indexOf(' ') === -1 && input === input.toLowerCase()) {
                        return true;
                    } else {
                        return 'Name cannot be null, empty or contain a space or uppercase character.';
                    }
                }
            },
            {
                type: 'input',
                name: 'namespace',
                message: 'What is the business network\'s namespace?',
                default: 'org.acme.biznet',
                store: true,
                validate: function(input) {
                    if(input !== null && input !== undefined && input.match(/^(?:[a-z]\d*(?:\.[a-z])?)+$/)) {
                        return true;
                    } else {
                        return 'Name must mactch: ^(?:[a-z]\d*(?:\.[a-z])?)+$';
                    }
                }
            },
            {
                type: 'input',
                name: 'appdescription',
                message: 'Describe the business network',
                store: true,
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
                name: 'appauthor',
                message: 'Who is the author?',
                store: true,
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    } else {
                        return 'Author cannot be null or empty.';
                    }
                }
            },
            {
                type: 'input',
                name: 'applicense',
                message: 'Which license do you want to use?',
                default: 'Apache-2',
                store: true,
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    } else {
                        return 'Licence cannot be null or empty.';
                    }
                }
            }
        ];

        return this.prompt(questions)
        .then((answers) => {
            this.appname = answers.appname;
            this.namespace = answers.namespace;
            this.appdescription = answers.appdescription;
            this.appauthor = answers.appauthor;
            this.applicense = answers.applicense;
            this.ismodel = answers.ismodel;
        });
    },

    configuring: function() {
        this.destinationRoot(this.appname);
    },

    writing: function() {
        let model = this._generateTemplateModel();
        this.fs.copyTpl(this.templatePath('**!(models|lib|test)*'), this.destinationPath(), model);
        this.fs.copyTpl(this.templatePath('models/namespace.cto'), this.destinationPath('models/'+this.namespace+'.cto'), model);
        this.fs.move(this.destinationPath('_dot_eslintrc.yml'), this.destinationPath('.eslintrc.yml'), model);
        if (!this.ismodel) {
            this.fs.copyTpl(this.templatePath('./test'), this.destinationPath('./test'), model);
            this.fs.copyTpl(this.templatePath('./lib'), this.destinationPath('./lib'), model);
        } else {
            mkdirp.sync(this.destinationPath('test'));
        }
    },

    _generateTemplateModel: function() {
        return {
            appname: this.appname,
            namespace: this.namespace,
            appdescription: this.appdescription,
            appauthor: this.appauthor,
            applicense: this.applicense
        };
    }
});
