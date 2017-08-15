'use strict';

const Util = require('./../util');

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
                name: 'sample',
                message: 'Namespace:',
                default: 'org.acme.biznet',
                store: true,
                validate: Util.validateNamespace
            }
        ];

        return this.prompt(questions)
            .then((answers) => {
                this.appname = answers.appname;
                this.appemail = answers.appemail;
                this.sample = answers.sample;
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
        this.fs.copyTpl(this.templatePath('models/sample.cto'), this.destinationPath('models/'+this.sample+'.cto'), model);
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
            sample: this.sample,
            appdescription: this.appdescription,
            appauthor: this.appauthor,
            applicense: this.applicense
        };
    }
});
