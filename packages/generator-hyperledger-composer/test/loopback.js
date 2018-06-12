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

const { AdminConnection } = require('composer-admin');
const assert = require('yeoman-assert');
const fs = require('fs');
const { BusinessNetworkDefinition, IdCard } = require('composer-common');
const helpers = require('yeoman-test');
const path = require('path');
const rewire = require('rewire');
const version = require('../package.json').version;

require('chai').should();
const sinon = require('sinon');

/**
 * Get all files recursively in a directoy
 * @param {*} dir directory to search
 * @param {*} fileList file list to append
 * @returns {*} list of files in directory
 */
function getFiles(dir, fileList){
    fileList = fileList || [];
    let files = fs.readdirSync(dir);
    for(let i in files){
        if (!files.hasOwnProperty(i)){
            continue;
        }
        let name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, fileList);
        } else {
            fileList.push(name);
        }
    }
    return fileList.sort();
}

describe('hyperledger-composer:loopback for generating a LoopBack application', () => {

    [true, false].forEach((liveNetwork) => {

        describe(`liveNetwork = ${liveNetwork}`, () => {

            let tmpDir;
            let appDir;

            before(async () => {
                if (liveNetwork) {
                    const blockchainNetworkCard = new IdCard({
                        userName : 'admin',
                        enrollmentSecret : 'adminpw'
                    }, {
                        'x-type' : 'embedded',
                        name : 'generatorProfile'
                    });
                    const adminConnection = new AdminConnection({ wallet: { type: 'composer-wallet-inmemory' }});
                    await adminConnection.importCard('admin@blockchain-network', blockchainNetworkCard);
                    await adminConnection.connect('admin@blockchain-network');
                    const businessNetworkArchive = fs.readFileSync(path.resolve(__dirname + '/data/', 'digitalPropertyNetwork.bna'));
                    const businessNetworkDefinition = await BusinessNetworkDefinition.fromArchive(businessNetworkArchive);
                    await adminConnection.install(businessNetworkDefinition);
                    await adminConnection.start(businessNetworkDefinition.getName(), businessNetworkDefinition.getVersion(), {
                        networkAdmins : [{
                            userName : 'admin',
                            enrollmentSecret : 'adminpw'
                        }]
                    });
                }
            });

            before(() => {
                const prompts = {
                    liveNetwork,
                    appName: 'digitalPropertyNetwork',
                    appDescription: 'A digitalPropertyNetwork application',
                    authorName: 'TestUser',
                    authorEmail: 'TestUser@TestApp.com',
                    license: 'Apache-2.0',
                    fileName: (path.join(__dirname, '/data/digitalPropertyNetwork.bna')),
                    cardName: 'admin@digitalproperty-network'
                };
                if (liveNetwork) {
                    delete prompts.fileName;
                }
                return helpers.run(path.resolve(__dirname, '../generators/loopback'))
                    .inTmpDir((dir) => {
                        tmpDir = dir;
                        appDir = path.join(tmpDir, 'digitalPropertyNetwork');
                    })
                    .withOptions({ skipInstall: true })
                    .withPrompts(prompts)
                    .on('error', (error) => {
                        console.error(error);
                        assert.fail(error);
                    });
            });

            it('should create a client directory', () => {
                const files = getFiles(path.join(appDir, 'client'));
                const fileNames = files.map((file) => {
                    return path.relative(path.join(appDir, 'client'), file);
                });
                fileNames.should.deep.equal([
                    'README.md'
                ]);
            });

            it('should create the common library module', () => {
                const file = path.join(appDir, 'common', 'lib', 'composer.js');
                assert.file(file);
                require(file);
            });

            const builtInModelFiles = [
                'ping-response.js',
                'ping-response.json',
                'system.js',
                'system.json'
            ];

            it('should create common model files for builtin types', () => {
                const files = getFiles(path.join(appDir, 'common', 'models')).filter((file) => {
                    const fileName = path.relative(path.join(appDir, 'common', 'models'), file);
                    return builtInModelFiles.indexOf(fileName) !== -1;
                });
                const fileNames = files.map((file) => {
                    return path.relative(path.join(appDir, 'common', 'models'), file);
                }).filter((file) => {
                    return builtInModelFiles.indexOf(file) !== -1;
                });
                fileNames.should.deep.equal(builtInModelFiles);
                files.forEach((file) => {
                    if (file.endsWith('.js')) {
                        const modelFunc = rewire(file);
                        const mockModel = {};
                        modelFunc(mockModel);
                    } else {
                        require(file);
                    }
                });
            });

            it('should create common model files for all types', () => {
                const files = getFiles(path.join(appDir, 'common', 'models')).filter((file) => {
                    const fileName = path.relative(path.join(appDir, 'common', 'models'), file);
                    return builtInModelFiles.indexOf(fileName) === -1;
                });
                const fileNames = files.map((file) => {
                    return path.relative(path.join(appDir, 'common', 'models'), file);
                }).filter((fileName) => {
                    return builtInModelFiles.indexOf(fileName) === -1;
                });
                fileNames.should.deep.equal([
                    'LandTitle.js',
                    'LandTitle.json',
                    'Person.js',
                    'Person.json',
                    'RegisterPropertyForSale.js',
                    'RegisterPropertyForSale.json',
                    'SalesAgreement.js',
                    'SalesAgreement.json',
                ]);
                files.forEach((file) => {
                    if (file.endsWith('.js')) {
                        const modelFunc = rewire(file);
                        const mockComposer = {
                            restrictModelMethods: sinon.stub()
                        };
                        const mockModel = {};
                        modelFunc.__set__('Composer', mockComposer);
                        modelFunc(mockModel);
                        sinon.assert.calledOnce(mockComposer.restrictModelMethods);
                        sinon.assert.calledWith(mockComposer.restrictModelMethods, mockModel);
                    } else {
                        const modelJSON = require(file);
                        modelJSON.options.composer.namespace.should.equal('net.biz.digitalPropertyNetwork');
                    }
                });
            });

            it('should create a server directory', () => {
                const files = getFiles(path.join(appDir, 'server'));
                const fileNames = files.map((file) => {
                    return path.relative(path.join(appDir, 'server'), file);
                });
                fileNames.should.deep.equal([
                    'boot/root.js',
                    'component-config.json',
                    'config.json',
                    'datasources.json',
                    'middleware.development.json',
                    'middleware.json',
                    'model-config.json',
                    'server.js'
                ]);
            });

            it('should set up a valid data source called composer', () => {
                const file = path.join(appDir, 'server', 'datasources.json');
                assert.file(file);
                const datasources = require(file);
                datasources.should.deep.equal({
                    composer: {
                        card: 'admin@digitalproperty-network',
                        connector: 'loopback-connector-composer',
                        name: 'composer',
                        namespaces: false
                    }
                });
            });

            it('should set up valid model configuration', () => {
                const file = path.join(appDir, 'server', 'model-config.json');
                assert.file(file);
                const modelConfig = require(file);
                modelConfig.should.deep.equal({
                    _meta: {
                        sources: [
                            'loopback/common/models',
                            'loopback/server/models',
                            '../common/models',
                            './models'
                        ],
                        mixins: [
                            'loopback/common/mixins',
                            'loopback/server/mixins',
                            '../common/mixins',
                            './mixins'
                        ]
                    },
                    System: {
                        dataSource: 'composer',
                        public: true
                    },
                    PingResponse: {
                        dataSource: 'composer',
                        public: false
                    },
                    LandTitle: {
                        dataSource: 'composer',
                        public: true
                    },
                    SalesAgreement: {
                        dataSource: 'composer',
                        public: true
                    },
                    Person: {
                        dataSource: 'composer',
                        public: true
                    },
                    RegisterPropertyForSale: {
                        dataSource: 'composer',
                        public: true
                    }
                });
            });

            it('should create a correct package.json including specified options', () => {
                const file = path.join(appDir, 'package.json');
                assert.file(file);
                const packageJSON = require(file);
                packageJSON.name.should.equal('digitalPropertyNetwork');
                packageJSON.version.should.equal('1.0.0');
                packageJSON.description.should.equal('A digitalPropertyNetwork application');
                packageJSON.license.should.equal('Apache-2.0');
                packageJSON.author.should.equal('TestUser <TestUser@TestApp.com>');
                packageJSON.engines.should.deep.equal({
                    node: '>=8',
                    npm: '>=5'
                });
                packageJSON.dependencies['loopback-connector-composer'].should.equal(version);
            });

        });

    });

});