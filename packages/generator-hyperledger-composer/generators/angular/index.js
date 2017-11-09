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
const Util = require('./../util');
let yeoman = require('yeoman-generator');
let fs = require('fs');
let shell = require('shelljs');

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
let businessNetworkConnection;
const FileWriter = require('composer-common').FileWriter;
const TypescriptVisitor = require('composer-common').TypescriptVisitor;

const BrowserFS = require('browserfs/dist/node/index');
const bfs_fs = BrowserFS.BFSRequire('fs');

let businessNetworkDefinition;
let businessNetworkIdentifier;
let modelManager;
let assetList = [];
let assetServiceNames = [];
let assetComponentNames = [];
let transactionList = [];
let namespaceList;
let enumerations;
let introspector;
let assetProperties;
let destinationPath;
let liveNetwork;
let skipInstall = false;
let appName;
let appDescription;
let authorName;
let authorEmail;
let license;
let networkIdentifier;
let connectionProfileName;
let enrollmentId;
let enrollmentSecret;
let apiServer;
let apiIP;
let apiPort;
let apiNamespace;
let fileName;
let cardName;

module.exports = yeoman.Base.extend({
    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.options = this.env.options;
        if (arguments[1].skipInstall !== undefined) {
            skipInstall = arguments[1].skipInstall;
        }
        if (arguments[1].embeddedRuntime !== undefined) {
            businessNetworkConnection = new BusinessNetworkConnection({
                fs: bfs_fs
            });
        } else {
            businessNetworkConnection = new BusinessNetworkConnection();
        }
    },

    prompting: function () {
        console.log('Welcome to the Hyperledger Composer Angular project generator');

        return this.prompt([{
            type: 'confirm',
            name: 'liveNetwork',
            message: 'Do you want to connect to a running Business Network?',
            default: false,
            store: true
        }])
            .then((answers) => {
                liveNetwork = answers.liveNetwork;
                let questions;

                if (liveNetwork) {
                    questions = [{
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
                        validate: function (input) {
                            if (input !== null && input !== undefined && input !== '') {
                                return true;
                            } else {
                                return 'Connection Profile cannot be null or empty.';
                            }
                        }
                    }
                    ];
                } else {
                    questions = [{
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
                }

                let self = this;
                return this.prompt(questions).then(function (answers) {

                    appName = answers.appName;
                    appDescription = answers.appDescription;
                    authorName = answers.authorName;
                    authorEmail = answers.authorEmail;
                    license = answers.license;

                    let nextQuestions;

                    if (liveNetwork) {
                        cardName = answers.cardName;
                        apiServer = answers.apiServer;

                        if (apiServer === 'generate') {

                            apiIP = 'http://localhost';

                            nextQuestions = [{
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
                        } else if (apiServer === 'connect') {
                            nextQuestions = [{
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
                        } else {
                            console.log('Unknown option');
                        }

                        return self.prompt(nextQuestions).then(function (answers) {
                            if (apiIP === undefined) {
                                apiIP = answers.apiIP;
                            }
                            apiPort = answers.apiPort;
                            apiNamespace = answers.apiNamespace;
                        });
                    } else {
                        fileName = answers.fileName;

                        nextQuestions = [{
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

                        return self.prompt(nextQuestions).then(function (answers) {
                            if (apiIP === undefined) {
                                apiIP = answers.apiIP;
                            }
                            apiPort = answers.apiPort;
                            apiNamespace = answers.apiNamespace;
                        });
                    }
                });
            });
    },

    writing: function () {
        let completedApp = new Promise((resolve, reject) => {

            if (liveNetwork) {
                return businessNetworkConnection.connect(cardName)
                    .then((result) => {
                        businessNetworkDefinition = result;
                        return businessNetworkConnection.disconnect();
                    })
                    .then(() => {
                        this.destinationRoot(appName);
                        destinationPath = this.destinationPath();
                        resolve(this._createApp());
                    })
                    .catch((err) => {
                        reject(err);
                    });
            } else {
                fs.readFile(fileName, (err, buffer) => {
                    return BusinessNetworkDefinition.fromArchive(buffer)
                        .then((result) => {
                            businessNetworkDefinition = result;
                            this.destinationRoot(appName);
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
            console.log('Completed generation process');
        });

    },

    _createApp: function () {
        /* This function will actually generate application code. */

        let createdApp = new Promise((resolve, reject) => {

            businessNetworkIdentifier = businessNetworkDefinition.getIdentifier();
            introspector = businessNetworkDefinition.getIntrospector();

            modelManager = introspector.getModelManager();
            namespaceList = modelManager.getNamespaces();
            enumerations = modelManager.getEnumDeclarations();

            shell.mkdir('-p', destinationPath + '/src/assets/');
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
                                console.log('Unknown property type: ' + property);
                            }
                        } else if (property.constructor.name === 'RelationshipDeclaration') {
                            tempList.push({
                                'name': property.getName(),
                                'type': property.getType()
                            });
                        } else {
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

            let model = this._generateTemplateModel();
            this.fs.copyTpl(this.templatePath('**/!(node_modules|typings|asset|Transaction)*'), this.destinationPath(), model);
            this.fs.move(this.destinationPath('_dot_angular-cli.json'), this.destinationPath('.angular-cli.json'));
            this.fs.move(this.destinationPath('_dot_editorconfig'), this.destinationPath('.editorconfig'));
            this.fs.move(this.destinationPath('_dot_gitignore'), this.destinationPath('.gitignore'));

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
                        apiNamespace: apiNamespace
                    }
                );
                this.fs.copyTpl(
                    this.templatePath('src/app/asset/asset.component.spec.ts'),
                    this.destinationPath('src/app/' + assetList[x].name + '/' + assetList[x].name + '.component.spec.ts'), {
                        assetName: assetList[x].name
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

            let visitor = new TypescriptVisitor();
            let parameters = {
                fileWriter: new FileWriter(this.destinationPath() + '/src/app')
            };

            modelManager.accept(visitor, parameters);

            assetList = [];
            assetComponentNames = [];
            assetServiceNames = [];

            resolve();
        });
        return createdApp.then(() => {
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
            console.log('Skipped installing dependencies');
        }
    },

    _generateTemplateModel: function () {
        return {
            appName: appName,
            appDescription: appDescription,
            authorName: authorName,
            authorEmail: authorEmail,
            license: license,
            businessNetworkIdentifier: businessNetworkIdentifier,
            assetList: assetList,
            assetServiceNames: assetServiceNames,
            assetComponentNames: assetComponentNames,
            transactionList: transactionList,
            networkIdentifier: networkIdentifier,
            connectionProfileName: connectionProfileName,
            enrollmentId: enrollmentId,
            enrollmentSecret: enrollmentSecret,
            apiServer: apiServer,
            apiIP: apiIP,
            apiPort: apiPort,
            apiNamespace: apiNamespace,
            cardName: cardName
        };
    },

    end: function () {
        shell.exec('pkill yo');
    }
});
