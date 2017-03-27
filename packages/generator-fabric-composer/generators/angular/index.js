'use strict';
let yeoman = require('yeoman-generator');
let fs = require('fs');
// let fs = require('fs');
let shell = require('shelljs');

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
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
let namespaceList;
let introspector;
let assetProperties;
let destinationPath;
let liveNetwork;
let skipInstall = false;

module.exports = yeoman.Base.extend({
    constructor: function() {
        yeoman.Base.apply(this, arguments);
        this.options = this.env.options;

        if(arguments[1].skipInstall !== undefined){
            skipInstall = arguments[1].skipInstall;
        }
    },

    prompting: function () {
        console.log('Welcome to the Angular2 skeleton app generator');

        return this.prompt([
            {
                type: 'confirm',
                name: 'liveNetwork',
                message: 'Do you want to connect to a running Business Network?',
                default: false,
                store: true
            }
        ])
        .then((answers) => {
            liveNetwork = answers.liveNetwork;
            let questions;

            if(liveNetwork){
                questions = [
                    {
                        when: !this.options.appName,
                        type: 'input',
                        name: 'appName',
                        message: 'What is the name of the application you wish to generate?:',
                        default: 'angular-app',
                        store: false,
                        validate: function(input) {
                            if(input !== null && input !== undefined && input.match(/^[\w-]+$/)) {
                                return true;
                            } else {
                                return 'Name must only use lowercase letters, numbers and dashes: ^[a-z\-\d]+$';
                            }
                        }
                    },
                    {
                        type: 'input',
                        name: 'appDescription',
                        message: 'Description of the application:',
                        default: 'Skeleton Fabric Composer Angular2 project',
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
                        name: 'networkIdentifier',
                        message: 'What is the Business Network Identifier?:',
                        default: 'digitalproperty-network',
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
                    },
                    {
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
                    },
                    {
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
                ];
            }
            else{
                questions = [
                    {
                        when: !this.options.appName,
                        type: 'input',
                        name: 'appName',
                        message: 'What is the name of the application you wish to generate?:',
                        default: 'angular-app',
                        store: false,
                        validate: function(input) {
                            if(input !== null && input !== undefined && input.match(/^[\w-]+$/)) {
                                return true;
                            } else {
                                return 'Name must only use lowercase letters, numbers and dashes: ^[a-z\-\d]+$';
                            }
                        }
                    },
                    {
                        type: 'input',
                        name: 'appDescription',
                        message: 'Description of the application:',
                        default: 'Skeleton Fabric Composer Angular2 project',
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
                    },{
                        type: 'input',
                        name: 'fileName',
                        message: 'What is the name of the business network archive file? (Path from the current working directory):',
                        default: 'org.acme.biznet@0.0.2.bna',
                        store: false,
                        validate: function(input) {
                            if(input !== null && input !== undefined) {
                                return true;
                            } else {
                                return 'File name cannot be null or empty.';
                            }
                        }
                    }];
            }






            return this.prompt(questions).then(function (answers) {
      // To access props later use this.props.someAnswer;

                this.appName = answers.appName;
                this.appDescription = answers.appDescription;
                this.authorName = answers.authorName;
                this.authorEmail = answers.authorEmail;
                if(liveNetwork){
                    this.networkIdentifier = answers.networkIdentifier;
                    this.connectionProfileName = answers.connectionProfileName;
                    this.enrollmentId = answers.enrollmentId;
                    this.enrollmentSecret = answers.enrollmentSecret;
                }
                else{
                    this.fileName = answers.fileName;
                }


            }.bind(this));
        });
    },


    configuring: function() {
        console.log('Configuring: '+this.appName);

    },

    writing: function () {
        let completedApp = new Promise((resolve, reject) => {
            console.log('About to start creating files');

            if(liveNetwork){

                console.log('About to connect to a running business network');

                return businessNetworkConnection.connect(this.connectionProfileName, this.networkIdentifier, this.enrollmentId, this.enrollmentSecret)
                    .then((result) => {
                        console.log('Connected to:',this.networkIdentifier);
                        businessNetworkDefinition = result;
                        return businessNetworkConnection.disconnect();

                    })
                    .then(() => {
                        this.destinationRoot(this.appName);
                        destinationPath = this.destinationPath();
                        resolve(this._createApp());
                    });

            }
            else{
                console.log('About to read a business network archive file');
                fs.readFile(this.fileName,(err,buffer) => {
                    console.log('Reading file:',this.fileName);
                    return BusinessNetworkDefinition.fromArchive(buffer)
                    .then((result) => {
                        businessNetworkDefinition = result;
                        this.destinationRoot(this.appName);
                        destinationPath = this.destinationPath();
                        resolve(this._createApp());

                    });
                });
            }
        });
        return completedApp.then(() => {
            console.log('Completed generation process');
        });

    },


    _createApp: function(){
        let createdApp = new Promise((resolve, reject) => {

            /*
            * This function will actually generate application code.
            */

            businessNetworkIdentifier = businessNetworkDefinition.getIdentifier();
            introspector = businessNetworkDefinition.getIntrospector();

            modelManager = introspector.getModelManager();
            namespaceList = modelManager.getNamespaces();

            shell.mkdir('-p', destinationPath+'/src/assets/');
            namespaceList.forEach((namespace) => {


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


            assetList = [];
            assetComponentNames = [];
            assetServiceNames = [];
            resolve();
        });
        return createdApp.then(()=>{
            console.log('Created application!');
        });
    },


    install: function () {
        if(!skipInstall){
            return this.installDependencies({
                bower: false,
                npm: true
            });
        }
        else{
            console.log('Skipped installing dependencies');
        }
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
        shell.exec('pkill yo');
    }
});
