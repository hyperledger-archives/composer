'use strict';

let yeoman = require('yeoman-generator');

module.exports = yeoman.Base.extend({
    constructor: function() {
        yeoman.Base.apply(this, arguments);
        this.options = this.env.options;
    },

    prompting: function() {
        console.log('Welcome to the business network generator');

        let questions = [
            {
                type: 'input',
                name: 'appname',
                message: 'Business network name:',
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
                name: 'appdescription',
                message: 'Description:',
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
                message: 'Author name: ',
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
                name: 'appemail',
                message: 'Author email:',
                store: true,
                validate: function(input) {
                    if(input !== null && input !== undefined && input !== '') {
                        return true;
                    }
                    else {
                        return 'Author email cannot be null or empty.';
                    }
                }
            },
            {
                type: 'input',
                name: 'applicense',
                message: 'License:',
                default: 'apache-2',
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
                name: 'namespace',
                message: 'Namespace:',
                default: 'org.acme.biznet',
                store: true,
                validate: function(input) {
                    if(input !== null && input !== undefined && input.match(/^(?:[a-z]\d*(?:\.[a-z])?)+$/)) {
                        return true;
                    } else {
                        return 'Name must mactch: ^(?:[a-z]\d*(?:\.[a-z])?)+$';
                    }
                }
            }
        ];

        return this.prompt(questions)
            .then((answers) => {
                this.appname = answers.appname;
                this.appemail = answers.appemail;
                this.namespace = answers.namespace;
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
        this.fs.copyTpl(this.templatePath('**!(models|lib|test)*'), this.destinationPath(), model);
        this.fs.copyTpl(this.templatePath('models/namespace.cto'), this.destinationPath('models/'+this.namespace+'.cto'), model);
        this.fs.move(this.destinationPath('_dot_eslintrc.yml'), this.destinationPath('.eslintrc.yml'), model);
        if (!this.ismodel) {
            this.fs.copyTpl(this.templatePath('./test'), this.destinationPath('./test'), model);
            this.fs.copyTpl(this.templatePath('./lib'), this.destinationPath('./lib'), model);
        }
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
