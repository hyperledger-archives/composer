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

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const FileWriter = require('composer-common').FileWriter;
const fs = require('fs');
const shell = require('shelljs');
const TypescriptVisitor = require('composer-common').TypescriptVisitor;
const Util = require('./../util');
const version = require('../../package.json').version;
const yeoman = require('yeoman-generator');
const optionOrPrompt = require('yeoman-option-or-prompt');
const { URL } = require('url');

let businessNetworkConnection;
let businessNetworkDefinition;
let businessNetworkName;
let businessNetworkVersion;
let businessNetworkIdentifier;
let modelManager;
let assetList = [];
let participantList = [];
let conceptList = [];
let assetServiceNames = [];
let participantServiceNames = [];
let assetComponentNames = [];
let participantComponentNames = [];
let conceptServiceNames = [];
let conceptComponentNames = [];
let transactionList = [];
let transactionComponentNames = [];
let transactionServiceNames = [];
let namespaceList;
let enumerations;
let introspector;
let assetProperties;
let participantProperties;
let conceptProperties;
let transactionProperties;
let destinationPath;
let skipInstall = false;
let networkIdentifier;
let connectionProfileName;
let enrollmentId;
let enrollmentSecret;

module.exports = yeoman.Base.extend({

    _optionOrPrompt: optionOrPrompt,

    prompting: function () {
        Util.log('Welcome to the Hyperledger Composer Angular project generator');

        let liveConnectQuestion = [{
            type: 'confirm',
            name: 'liveNetwork',
            message: 'Do you want to connect to a running Business Network?',
            default: false,
            store: true
        }];

        let liveBusinessNetworkQuestions = [
            {
                when: !this.options.appName,
                type: 'input',
                name: 'appName',
                message: 'Project name:',
                default: 'angular-app',
                store: true,
                validate: Util.validateAppName
            },
            {
                type: 'input',
                name: 'appDescription',
                message: 'Description:',
                default: 'Hyperledger Composer Angular project',
                store: true,
                validate: Util.validateDescription
            },
            {
                type: 'input',
                name: 'authorName',
                message: 'Author name:',
                store: true,
                validate: Util.validateAuthorName
            },
            {
                type: 'input',
                name: 'authorEmail',
                message: 'Author email:',
                store: true,
                validate: Util.validateAuthorEmail
            },
            {
                type: 'input',
                name: 'license',
                message: 'License:',
                default: 'Apache-2.0',
                store: true,
                validate: Util.validateLicense
            },
            {
                type: 'input',
                name: 'cardName',
                message: 'Name of the Business Network card:',
                store: true,
                validate: Util.cardName
            },
            {
                type: 'list',
                name: 'apiServer',
                message: 'Do you want to generate a new REST API or connect to an existing REST API? ',
                default: 'generate',
                store: true,
                choices: [{
                    name: 'Generate a new REST API',
                    value: 'generate'
                },
                {
                    name: 'Connect to an existing REST API',
                    value: 'connect'
                }
                ],
                validate: Util.validateApi
            }
        ];

        let notLiveBusinessNetworkQuestions = [{
            when: !this.options.appName,
            type: 'input',
            name: 'appName',
            message: 'Project name:',
            default: 'angular-app',
            store: true,
            validate: Util.validateAppName
        },
        {
            type: 'input',
            name: 'appDescription',
            message: 'Description:',
            default: 'Hyperledger Composer Angular project',
            store: true,
            validate: Util.validateDescription
        },
        {
            type: 'input',
            name: 'authorName',
            message: 'Author name:',
            store: true,
            validate: Util.validateAuthorName
        },
        {
            type: 'input',
            name: 'authorEmail',
            message: 'Author email:',
            store: true,

            validate: Util.validateAuthorEmail
        },
        {
            type: 'input',
            name: 'license',
            message: 'License:',
            default: 'Apache-2.0',
            store: true,
            validate: Util.validateLicense
        },
        {
            type: 'input',
            name: 'fileName',
            message: 'Business network archive file (Path from the current working directory):',
            default: 'digitalproperty-network.bna',
            store: true,
            validate: Util.validateBnaName
        }
        ];

        let newNextQuestions = [{
            type: 'input',
            name: 'apiPort',
            store: true,
            message: 'REST server port:',
            default: '3000'
        },
        {
            type: 'list',
            name: 'apiNamespace',
            message: 'Should namespaces be used in the generated REST API?',
            default: 'never',
            store: true,
            choices: [{
                name: 'Always use namespaces',
                value: 'always'
            },
            {
                name: 'Never use namespaces',
                value: 'never'
            }
            ],
            validate: Util.validateNamespace
        }
        ];

        let newNextQuestions2 = [{
            type: 'input',
            name: 'apiIP',
            store: true,
            message: 'REST server address:',
            default: 'http://localhost'
        },
        {
            type: 'input',
            name: 'apiPort',
            store: true,
            message: 'REST server port:',
            default: '3000'
        },
        {
            type: 'list',
            name: 'apiNamespace',
            message: 'Should namespaces be used in the generated REST API?',
            default: 'never',
            store: true,
            choices: [{
                name: 'Namespaces are used',
                value: 'always'
            },
            {
                name: 'Namespaces are not used',
                value: 'never'
            }
            ],
            validate: Util.validateNamespace
        }
        ];

        let newNextQuestions3 = [{
            type: 'input',
            name: 'apiIP',
            store: true,
            message: 'REST server address:',
            default: 'http://localhost'
        },
        {
            type: 'input',
            name: 'apiPort',
            store: true,
            message: 'REST server port:',
            default: '3000'
        },
        {
            type: 'list',
            name: 'apiNamespace',
            message: 'Are namespaces used in the generated REST API: ',
            default: 'never',
            store: true,
            choices: [{
                name: 'Namespaces are used',
                value: 'always'
            },
            {
                name: 'Namespaces are not used',
                value: 'never'
            }
            ],
            validate: Util.validateNamespace
        }
        ];

        return this._optionOrPrompt(liveConnectQuestion)
            .then((answers) => {
                if (typeof(answers.liveNetwork) === 'string' && answers.liveNetwork === 'true') {
                    this.liveNetwork = true;
                } else if (typeof(answers.liveNetwork) === 'string' && answers.liveNetwork === 'false') {
                    this.liveNetwork = false;
                } else {
                    this.liveNetwork = answers.liveNetwork;
                }
            })
            .then(() => {
                if (this.liveNetwork) {
                    return this._optionOrPrompt(liveBusinessNetworkQuestions);
                } else {
                    return this._optionOrPrompt(notLiveBusinessNetworkQuestions);
                }
            })
            .then((answers2) => {
                if (this.liveNetwork) {
                    this.appName = answers2.appName;
                    this.appDescription = answers2.appDescription;
                    this.authorName = answers2.authorName;
                    this.authorEmail = answers2.authorEmail;
                    this.license = answers2.license;
                    this.cardName = answers2.cardName;
                    businessNetworkConnection = new BusinessNetworkConnection(this.cardName);
                    this.apiServer = answers2.apiServer;
                } else {
                    this.appName = answers2.appName;
                    this.appDescription = answers2.appDescription;
                    this.authorName = answers2.authorName;
                    this.authorEmail = answers2.authorEmail;
                    this.license = answers2.license;
                    this.fileName = answers2.fileName;
                }
            })
            .then(() => {
                if (this.liveNetwork) {
                    if (this.apiServer === 'generate') {
                        return this._optionOrPrompt(newNextQuestions);
                    } else if (this.apiServer === 'connect') {
                        return this._optionOrPrompt(newNextQuestions2);
                    } else {
                        Util.log('Unknown API server option');
                    }
                } else {
                    return this._optionOrPrompt(newNextQuestions3);
                }
            })
            .then((answers3) => {
                if (this.liveNetwork) {
                    if (this.apiServer === 'generate') {
                        this.apiIP = 'http://localhost';
                        this.apiPort = answers3.apiPort;
                        this.apiNamespace = answers3.apiNamespace;
                    } else if (this.apiServer === 'connect') {
                        this.apiIP = answers3.apiIP;
                        this.apiPort = answers3.apiPort;
                        this.apiNamespace = answers3.apiNamespace;
                    }
                } else {
                    this.apiIP = answers3.apiIP;
                    this.apiPort = answers3.apiPort;
                    this.apiNamespace = answers3.apiNamespace;
                }
                this.apiURL = new URL(`${this.apiIP}:${this.apiPort}`).origin;
            });
    },

    writing: function () {
        let completedApp = new Promise((resolve, reject) => {
            if (this.liveNetwork) {
                return businessNetworkConnection.connect(this.cardName)
                    .then((result) => {
                        businessNetworkDefinition = result;
                        return businessNetworkConnection.disconnect();
                    })
                    .then(() => {
                        this.destinationRoot(this.appName);
                        destinationPath = this.destinationPath();
                        resolve(this._createApp());
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                fs.readFile(this.fileName, (err, buffer) => {
                    if (err) {
                        throw err;
                    }
                    return BusinessNetworkDefinition.fromArchive(buffer)
                        .then((result) => {
                            businessNetworkDefinition = result;
                            this.destinationRoot(this.appName);
                            destinationPath = this.destinationPath();
                            resolve(this._createApp());
                        })
                        .catch((err) => {
                            reject(err);
                        });
                });
            }
        });
        return completedApp.then(() => {
            // eslint-disable-next-line no-console
            console.log('Completed generation process');
        });

    },

    _createApp: function () {
        /* This function will actually generate application code. */

        let createdApp = new Promise((resolve, reject) => {

            businessNetworkName = businessNetworkDefinition.getName();
            businessNetworkVersion = businessNetworkDefinition.getVersion();
            businessNetworkIdentifier = businessNetworkDefinition.getIdentifier();
            introspector = businessNetworkDefinition.getIntrospector();

            modelManager = introspector.getModelManager();
            namespaceList = modelManager.getNamespaces();
            enumerations = modelManager.getEnumDeclarations();

            namespaceList.forEach((namespace) => {

                let modelFile = modelManager.getModelFile(namespace);
                let assetDeclarations = modelFile.getAssetDeclarations();

                assetDeclarations
                .filter((assetDeclaration) =>{
                    return !assetDeclaration.isAbstract();
                })
                .filter((assetDeclaration) => {
                    if (assetDeclaration.isSystemType()) {
                        return assetDeclaration.isSystemCoreType();
                    }
                    return true;
                })
                .forEach((asset) => {

                    let tempList = [];
                    assetProperties = asset.getProperties();

                    assetProperties.forEach((property) => {
                        if (property.constructor.name === 'Field') {
                            if (property.isTypeEnum()) {
                                // handle enumerations
                                let enumValues = [];
                                // compose array of enumeration values
                                enumerations.forEach(enumeration => {
                                    if (enumeration.name === property.getType()) {
                                        enumValues = enumeration.properties;
                                    }
                                });
                                // add meta information to the field list
                                tempList.push({
                                    'name': property.getName(),
                                    'type': property.getType(),
                                    'enum': true,
                                    'array': property.array === true,
                                    enumValues,
                                });
                            } else if (property.isPrimitive() || !property.isPrimitive()) {

                                tempList.push({
                                    'name': property.getName(),
                                    'type': property.getType()
                                });
                            } else {
                                // eslint-disable-next-line no-console
                                console.log('Unknown property type: ' + property);
                            }
                        } else if (property.constructor.name === 'RelationshipDeclaration') {
                            tempList.push({
                                'name': property.getName(),
                                'type': property.getType()
                            });
                        } else {
                            // eslint-disable-next-line no-console
                            console.log('Unknown property constructor name: ' + property );
                        }
                    });

                    assetList.push({
                        'name': asset.name,
                        'namespace': asset.getNamespace(),
                        'properties': tempList,
                        'identifier': asset.getIdentifierFieldName()
                    });
                    shell.mkdir('-p', destinationPath + '/src/app/' + asset.name);

                });
            });

            assetList.forEach((asset) => {
                assetServiceNames.push(asset.name + 'Service');
            });

            assetList.forEach((asset) => {
                assetComponentNames.push(asset.name + 'Component');
            });
            namespaceList.forEach((namespace) => {

                let modelFile = modelManager.getModelFile(namespace);
                let participantDeclarations = modelFile.getParticipantDeclarations();

                participantDeclarations
                .filter((participantDeclaration) =>{
                    return !participantDeclaration.isAbstract();
                })
                .filter((participantDeclaration) => {
                    if (participantDeclaration.isSystemType()) {
                        return participantDeclaration.isSystemCoreType();
                    }
                    return true;
                })
                .forEach((participant) => {

                    let tempList = [];
                    participantProperties = participant.getProperties();

                    participantProperties.forEach((property) => {
                        if (property.constructor.name === 'Field') {
                            if (property.isTypeEnum()) {
                                // handle enumerations
                                let enumValues = [];
                                // compose array of enumeration values
                                enumerations.forEach(enumeration => {
                                    if (enumeration.name === property.getType()) {
                                        enumValues = enumeration.properties;
                                    }
                                });
                                // add meta information to the field list
                                tempList.push({
                                    'name': property.getName(),
                                    'type': property.getType(),
                                    'enum': true,
                                    'array': property.array === true,
                                    enumValues,
                                });
                            } else if (property.isPrimitive() || !property.isPrimitive()) {

                                tempList.push({
                                    'name': property.getName(),
                                    'type': property.getType()
                                });
                            } else {
                                // eslint-disable-next-line no-console
                                console.log('Unknown property type: ' + property);
                            }
                        } else if (property.constructor.name === 'RelationshipDeclaration') {
                            tempList.push({
                                'name': property.getName(),
                                'type': property.getType()
                            });
                        } else {
                            // eslint-disable-next-line no-console
                            console.log('Unknown property constructor name: ' + property );
                        }
                    });

                    participantList.push({
                        'name': participant.name,
                        'namespace': participant.getNamespace(),
                        'properties': tempList,
                        'identifier': participant.getIdentifierFieldName()
                    });
                    shell.mkdir('-p', destinationPath + '/src/app/' + participant.name);

                });
            });

            participantList.forEach((participant) => {
                participantServiceNames.push(participant.name + 'Service');
            });

            participantList.forEach((participant) => {
                participantComponentNames.push(participant.name + 'Component');
            });

            namespaceList.forEach((namespace) => {

                let modelFile = modelManager.getModelFile(namespace);
                let conceptDeclarations = modelFile.getConceptDeclarations();

                conceptDeclarations
            .filter((conceptDeclaration) =>{
                return conceptDeclaration.isAbstract();
            })
            .filter((conceptDeclaration) => {
                if (conceptDeclaration.isSystemType()) {
                    return conceptDeclaration.isSystemCoreType();
                }
                return true;
            })
            .forEach((concept) => {
                let tempList = [];
                conceptProperties = concept.getProperties();

                conceptProperties.forEach((property) => {
                    if (property.constructor.name === 'Field') {
                        if (property.isTypeEnum()) {
                            // handle enumerations
                            let enumValues = [];
                            // compose array of enumeration values
                            enumerations.forEach(enumeration => {
                                if (enumeration.name === property.getType()) {
                                    enumValues = enumeration.properties;
                                }
                            });
                            // add meta information to the field list
                            tempList.push({
                                'name': property.getName(),
                                'type': property.getType(),
                                'enum': true,
                                'array': property.array === true,
                                enumValues,
                            });
                        } else if (property.isPrimitive() || !property.isPrimitive()) {

                            tempList.push({
                                'name': property.getName(),
                                'type': property.getType()
                            });
                        } else {
                            // eslint-disable-next-line no-console
                            console.log('Unknown property type: ' + property);
                        }
                    } else if (property.constructor.name === 'RelationshipDeclaration') {
                        tempList.push({
                            'name': property.getName(),
                            'type': property.getType()
                        });
                    } else {
                        // eslint-disable-next-line no-console
                        console.log('Unknown property constructor name: ' + property );
                    }
                });
                conceptList.push({
                    'name': concept.name,
                    'namespace': concept.getNamespace(),
                    'properties': tempList,
                    'identifier': concept.getIdentifierFieldName()
                });
                shell.mkdir('-p', destinationPath + '/src/app/' + concept.name);

            });
            });
            conceptList.forEach((concept) => {
                conceptServiceNames.push(concept.name + 'Service');
            });
            conceptList.forEach((concept) => {
                conceptComponentNames.push(concept.name + 'Component');
            });

            namespaceList.forEach((namespace) => {

                let modelFile = modelManager.getModelFile(namespace);
                let transactionDeclarations = modelFile.getTransactionDeclarations();

                transactionDeclarations
                .filter((transactionDeclaration) =>{
                    return !transactionDeclaration.isAbstract();
                })
                .filter((transactionDeclaration) => {
                    if (transactionDeclaration.isSystemType()) {
                        return transactionDeclaration.isSystemCoreType();
                    }
                    return true;
                })
                .forEach((transaction) => {

                    let tempList = [];
                    transactionProperties = transaction.getProperties();

                    transactionProperties.forEach((property) => {
                        if (property.constructor.name === 'Field') {
                            if (property.isTypeEnum()) {
                                // handle enumerations
                                let enumValues = [];
                                // compose array of enumeration values
                                enumerations.forEach(enumeration => {
                                    if (enumeration.name === property.getType()) {
                                        enumValues = enumeration.properties;
                                    }
                                });
                                // add meta information to the field list
                                tempList.push({
                                    'name': property.getName(),
                                    'type': property.getType(),
                                    'enum': true,
                                    'array': property.array === true,
                                    enumValues,
                                });
                            } else if (property.isPrimitive() || !property.isPrimitive()) {

                                tempList.push({
                                    'name': property.getName(),
                                    'type': property.getType()
                                });
                            } else {
                                // eslint-disable-next-line no-console
                                console.log('Unknown property type: ' + property);
                            }
                        } else if (property.constructor.name === 'RelationshipDeclaration') {
                            tempList.push({
                                'name': property.getName(),
                                'type': property.getType()
                            });
                        } else {
                            // eslint-disable-next-line no-console
                            console.log('Unknown property constructor name: ' + property );
                        }
                    });

                    transactionList.push({
                        'name': transaction.name,
                        'namespace': transaction.getNamespace(),
                        'properties': tempList,
                        'identifier': transaction.getIdentifierFieldName()
                    });
                    shell.mkdir('-p', destinationPath + '/src/app/' + transaction.name);

                });
            });

            transactionList.forEach((transaction) => {
                transactionServiceNames.push(transaction.name + 'Service');
            });

            transactionList.forEach((transaction) => {
                transactionComponentNames.push(transaction.name + 'Component');
            });

            let model = this._generateTemplateModel();
            this.fs.copyTpl(this.templatePath('**/!(node_modules|typings|asset|participant|concept|transaction)*'), this.destinationPath(), model);
            this.fs.move(this.destinationPath('_dot_angular-cli.json'), this.destinationPath('.angular-cli.json'));
            this.fs.move(this.destinationPath('_dot_editorconfig'), this.destinationPath('.editorconfig'));
            this.fs.move(this.destinationPath('_dot_gitignore'), this.destinationPath('.gitignore'));
            this.fs.move(this.destinationPath('_dot_dockerignore'), this.destinationPath('.dockerignore'));
            this.fs.move(this.destinationPath('_dot_cfignore'), this.destinationPath('.cfignore'));
            this.fs.move(this.destinationPath('_dot_npmignore'), this.destinationPath('.npmignore'));

            for (let x = 0; x < assetList.length; x++) {
                this.fs.copyTpl(
                    this.templatePath('src/app/asset/asset.component.ts'),
                    this.destinationPath('src/app/' + assetList[x].name + '/' + assetList[x].name + '.component.ts'), {
                        currentAsset: assetList[x],
                        namespace: assetList[x].namespace,
                        assetIdentifier: assetList[x].identifier
                    }
                );
                this.fs.copyTpl(
                    this.templatePath('src/app/asset/asset.service.ts'),
                    this.destinationPath('src/app/' + assetList[x].name + '/' + assetList[x].name + '.service.ts'), {
                        assetName: assetList[x].name,
                        namespace: assetList[x].namespace,
                        apiNamespace: this.apiNamespace
                    }
                );
                this.fs.copyTpl(
                    this.templatePath('src/app/asset/asset.component.spec.ts'),
                    this.destinationPath('src/app/' + assetList[x].name + '/' + assetList[x].name + '.component.spec.ts'), {
                        currentAsset: assetList[x]
                    }
                );
                this.fs.copyTpl(
                    this.templatePath('src/app/asset/asset.component.html'),
                    this.destinationPath('src/app/' + assetList[x].name + '/' + assetList[x].name + '.component.html'), {
                        currentAsset: assetList[x]
                    }
                );

                this.fs.copyTpl(
                    this.templatePath('src/app/asset/asset.component.css'),
                    this.destinationPath('src/app/' + assetList[x].name + '/' + assetList[x].name + '.component.css'), {
                        styling: '{}'
                    }
                );
            }
            for (let x = 0; x < participantList.length; x++) {
                this.fs.copyTpl(
                    this.templatePath('src/app/participant/participant.component.ts'),
                    this.destinationPath('src/app/' + participantList[x].name + '/' + participantList[x].name + '.component.ts'), {
                        currentParticipant: participantList[x],
                        namespace: participantList[x].namespace,
                        participantIdentifier: participantList[x].identifier
                    }
                );
                this.fs.copyTpl(
                    this.templatePath('src/app/participant/participant.service.ts'),
                    this.destinationPath('src/app/' + participantList[x].name + '/' + participantList[x].name + '.service.ts'), {
                        participantName: participantList[x].name,
                        namespace: participantList[x].namespace,
                        apiNamespace: this.apiNamespace
                    }
                );
                this.fs.copyTpl(
                    this.templatePath('src/app/participant/participant.component.spec.ts'),
                    this.destinationPath('src/app/' + participantList[x].name + '/' + participantList[x].name + '.component.spec.ts'), {
                        currentParticipant: participantList[x]
                    }
                );
                this.fs.copyTpl(
                    this.templatePath('src/app/participant/participant.component.html'),
                    this.destinationPath('src/app/' + participantList[x].name + '/' + participantList[x].name + '.component.html'), {
                        currentParticipant: participantList[x]
                    }
                );

                this.fs.copyTpl(
                    this.templatePath('src/app/participant/participant.component.css'),
                    this.destinationPath('src/app/' + participantList[x].name + '/' + participantList[x].name + '.component.css'), {
                        styling: '{}'
                    }
                );
            }
            for (let x = 0; x < transactionList.length; x++) {
                this.fs.copyTpl(
                    this.templatePath('src/app/transaction/transaction.component.ts'),
                    this.destinationPath('src/app/' + transactionList[x].name + '/' + transactionList[x].name + '.component.ts'), {
                        currentTransaction: transactionList[x],
                        namespace: transactionList[x].namespace,
                        transactionIdentifier: transactionList[x].identifier
                    }
                );
                this.fs.copyTpl(
                    this.templatePath('src/app/transaction/transaction.service.ts'),
                    this.destinationPath('src/app/' + transactionList[x].name + '/' + transactionList[x].name + '.service.ts'), {
                        transactionName: transactionList[x].name,
                        namespace: transactionList[x].namespace,
                        apiNamespace: this.apiNamespace
                    }
                );
                this.fs.copyTpl(
                    this.templatePath('src/app/transaction/transaction.component.spec.ts'),
                    this.destinationPath('src/app/' + transactionList[x].name + '/' + transactionList[x].name + '.component.spec.ts'), {
                        transactionName: transactionList[x].name
                    }
                );
                this.fs.copyTpl(
                    this.templatePath('src/app/transaction/transaction.component.html'),
                    this.destinationPath('src/app/' + transactionList[x].name + '/' + transactionList[x].name + '.component.html'), {
                        currentTransaction: transactionList[x]
                    }
                );

                this.fs.copyTpl(
                    this.templatePath('src/app/transaction/transaction.component.css'),
                    this.destinationPath('src/app/' + transactionList[x].name + '/' + transactionList[x].name + '.component.css'), {
                        styling: '{}'
                    }
                );
            }

            let visitor = new TypescriptVisitor();
            let parameters = {
                fileWriter: new FileWriter(this.destinationPath() + '/src/app')
            };

            modelManager.accept(visitor, parameters);

            assetList = [];
            assetComponentNames = [];
            assetServiceNames = [];
            participantList = [];
            participantComponentNames = [];
            participantServiceNames = [];
            conceptList = [];
            conceptComponentNames = [];
            conceptServiceNames = [];
            transactionList = [];
            transactionComponentNames = [];
            transactionServiceNames = [];

            resolve();
        });
        return createdApp.then(() => {
            // eslint-disable-next-line no-console
            console.log('Created application!');
        });
    },

    install: function () {
        if (!skipInstall) {
            return this.installDependencies({
                bower: false,
                npm: true
            });
        } else {
            // eslint-disable-next-line no-console
            console.log('Skipped installing dependencies');
        }
    },

    _generateTemplateModel: function () {
        return {
            composerversion: `^${version}`,
            appName: this.appName,
            appDescription: this.appDescription,
            authorName: this.authorName,
            authorEmail: this.authorEmail,
            license: this.license,
            businessNetworkName: businessNetworkName,
            businessNetworkVersion: businessNetworkVersion,
            businessNetworkIdentifier: businessNetworkIdentifier,
            assetList: assetList,
            assetServiceNames: assetServiceNames,
            assetComponentNames: assetComponentNames,
            participantList: participantList,
            participantServiceNames: participantServiceNames,
            participantComponentNames: participantComponentNames,
            transactionList: transactionList,
            transactionComponentNames : transactionComponentNames,
            transactionServiceNames : transactionServiceNames,
            networkIdentifier: networkIdentifier,
            connectionProfileName: connectionProfileName,
            enrollmentId: enrollmentId,
            enrollmentSecret: enrollmentSecret,
            apiServer: this.apiServer,
            apiIP: this.apiIP,
            apiPort: this.apiPort,
            apiNamespace: this.apiNamespace,
            apiURL: this.apiURL,
            cardName: this.cardName
        };
    },

    end: function () {
        // eslint-disable-next-line no-console
        console.log('Application generated');
    }
});

