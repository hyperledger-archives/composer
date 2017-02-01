'use strict';
let yeoman = require('yeoman-generator');
// let fs = require('fs');
let shell = require('shelljs');

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
let businessNetworkConnection = new BusinessNetworkConnection();
const FileWriter = require('composer-common').FileWriter;
const TypescriptVisitor = require('composer-common').TypescriptVisitor;

let businessNetworkDefinition;
let businessNetworkIdentifier;
let modelManager;
let assetList = [];
let assetServiceNames = [];
let assetComponentNames = [];
let transactionList = [];
let transactionProperties = [];
let namespaceList;
let introspector;
// let scriptManager;
let assetProperties;

// let currentNamespace;



module.exports = yeoman.Base.extend({
    constructor: function() {
        yeoman.Base.apply(this, arguments);
        this.options = this.env.options;
    },

    prompting: function () {
    // Have Yeoman greet the user.
        console.log('Welcome to the skeleton app generator');

        let questions = [
            {
                when: !this.options.appName,
                type: 'input',
                name: 'appName',
                message: 'Your app name:',
                default: 'test-app',
                store: false,
                validate: function(input) {
                    if(input !== null && input !== undefined && input.match(/^[\w-]+$/)) {
                        return true;
                    } else {
                        return 'Name must only use lowercase letters, numbers and dashes: ^[a-z\-\d]+$';
                    }
                }
            }, {
                type: 'input',
                name: 'appDescription',
                message: 'Short description:',
                default: 'Skeleton Fabric Composer angular2 project',
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
                name: 'networkIdentifier',
                message: 'What is the Business Network Identifier?:',
                default: 'org.acme.biznet',
                store: true,
                when: function(answers) {
                    return !answers.isNpmSameAsNetworkIdentifier;
                },
                validate: function(input) {
                    if(input !== null && input !== undefined) {
                        return true;
                    } else {
                        return 'Name must only use lowercase letters, numbers and dashes: ^[a-z\-\d]+$';
                    }
                }
            },  {
                type: 'input',
                name: 'connectionProfileName',
                message: 'What is the Connection Profile to use?',
                default: 'hyperledger',
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

        return this.prompt(questions).then(function (answers) {
      // To access props later use this.props.someAnswer;
            this.appName = answers.appName;
            this.appDescription = answers.appDescription;
            this.authorName = answers.authorName;
            this.authorEmail = answers.authorEmail;
            this.networkIdentifier = answers.networkIdentifier;
            this.connectionProfileName = answers.connectionProfileName;
            this.enrollmentId = answers.enrollmentId;
            this.enrollmentSecret = answers.enrollmentSecret;
        }.bind(this));
    },


    configuring: function() {
        console.log('Configuring: '+this.appName);
        this.destinationRoot(this.appName);
    },

    writing: function () {

        let destinationPath = this.destinationPath();
        console.log('About to connect to business network..');

        return businessNetworkConnection.connect(this.connectionProfileName, this.networkIdentifier, this.enrollmentId, this.enrollmentSecret)
        .then((result) => {
            console.log('Connected!');
            businessNetworkDefinition = result;
            businessNetworkIdentifier = businessNetworkDefinition.getIdentifier();
            introspector = businessNetworkDefinition.getIntrospector();
            // scriptManager = businessNetworkDefinition.getScriptManager();
            modelManager = introspector.getModelManager();
            namespaceList = modelManager.getNamespaces();

            shell.mkdir('-p', destinationPath+'/src/assets/');
            namespaceList.forEach((namespace) => {

                // currentNamespace = namespace;

                let modelFile = modelManager.getModelFile(namespace);
                let assetDeclarations = modelFile.getAssetDeclarations();

                assetDeclarations.forEach((asset) => {
                    let tempList = [];
                    assetProperties = asset.getProperties();

                    assetProperties.forEach((property) =>   {

                        if(property.constructor.name === 'Field'){
                            if(property.isTypeEnum()){
                                tempList.push({'name':property.getName(),'type':property.getType()});
                            }
                            else if(property.isPrimitive()){
                                tempList.push({'name':property.getName(),'type':property.getType()});
                            }
                            else if(!property.isPrimitive()){
                                tempList.push({'name':property.getName(),'type':property.getType()});
                            }
                            else{
                                console.log('Unknown property type');
                            }
                        }
                        else if(property.constructor.name === 'RelationshipDeclaration'){
                            tempList.push({'name':property.getName(),'type':property.getType()});
                        }
                        else{
                            console.log('Unknown property constructor name');
                        }


                    });

                    assetList.push({'name':asset.name,'namespace':asset.getModelFile().getNamespace(), 'properties':tempList, 'identifier':asset.getIdentifierFieldName()});
                    shell.mkdir('-p', destinationPath+'/src/app/'+asset.name);
                });


            });


        })
        .then(() => {
            return businessNetworkConnection.disconnect()
            .then(() => {

                assetList.forEach((asset) => {
                    assetServiceNames.push(asset.name+'Service');
                });

                assetList.forEach((asset) => {
                    assetComponentNames.push(asset.name+'Component');
                });

                let model = this._generateTemplateModel();
                this.fs.copyTpl(this.templatePath('**/!(node_modules|typings|asset|Transaction)*'), this.destinationPath(), model);

                for(let x=0;x<assetList.length;x++){
                    this.fs.copyTpl(
                        this.templatePath('src/app/asset/asset.component.ts'),
                        this.destinationPath('src/app/'+assetList[x].name+'/'+assetList[x].name+'.component.ts'),
                        { currentAsset: assetList[x], namespace: assetList[x].namespace, assetIdentifier:assetList[x].identifier }
                    );

                    this.fs.copyTpl(

                        this.templatePath('src/app/asset/asset.service.ts'),
                        this.destinationPath('src/app/'+assetList[x].name+'/'+assetList[x].name+'.service.ts'),
                        { assetName: assetList[x].name, namespace: assetList[x].namespace }
                    );

                    this.fs.copyTpl(
                        this.templatePath('src/app/asset/asset.component.spec.ts'),
                        this.destinationPath('src/app/'+assetList[x].name+'/'+assetList[x].name+'.component.spec.ts'),
                        { assetName: assetList[x].name }
                    );

                    this.fs.copyTpl(
                        this.templatePath('src/app/asset/asset.component.html'),
                        this.destinationPath('src/app/'+assetList[x].name+'/'+assetList[x].name+'.component.html'),
                        { currentAsset: assetList[x] }
                    );

                    this.fs.copyTpl(
                        this.templatePath('src/app/asset/asset.component.css'),
                        this.destinationPath('src/app/'+assetList[x].name+'/'+assetList[x].name+'.component.css'),
                        { styling: '{}' }
                    );
                }

                let visitor = null;
                visitor = new TypescriptVisitor();
                let parameters = {};
                parameters.fileWriter = new FileWriter(this.destinationPath()+'/src/app');
                modelManager.accept(visitor, parameters);

            })
            .then(() => {
                console.log('Created Asset specific files!');

            });
        });
    },

    install: function () {
        return this.installDependencies();
    },

    _generateTemplateModel: function() {
        return {
            appName: this.appName,
            appDescription: this.appDescription,
            authorName: this.authorName,
            authorEmail: this.authorEmail,
            businessNetworkIdentifier: businessNetworkIdentifier,
            assetList: assetList,
            assetServiceNames: assetServiceNames,
            assetComponentNames: assetComponentNames,
            transactionList: transactionList,
            networkIdentifier: this.networkIdentifier,
            connectionProfileName: this.connectionProfileName,
            enrollmentId: this.enrollmentId,
            enrollmentSecret: this.enrollmentSecret
        };
    },

    end: function() {
        console.log('Complete');
        process.exit(0);
    }
});
