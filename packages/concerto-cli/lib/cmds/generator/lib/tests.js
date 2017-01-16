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
const CmdUtil = require('../../utils/cmdutils');

const path = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');
const Common = require('@ibm/concerto-common');
const BusinessNetworkDefinition = Common.BusinessNetworkDefinition;

const TEMPLATES_DIR = path.join(__dirname, './../../../../gen');

/**
 * <p>
 * Concerto Tests command
 * </p>
 * @private
 */
class Tests {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from concerto command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {
        if (!argv.testDirName) {
            argv.testDirName = 'test';
        }

        let projectDir = argv.projectDir;
        let projectDirTest = projectDir + '/' + argv.testDirName;
        let networkArchiveLocation = argv.networkArchiveLocation;
        // let networkArchive;
        let assetDeclarations = {};
        let transactionDeclarations = {};
        let businessNetworkDefinition;

        return (() => {
            if (!argv.enrollSecret) {
                return CmdUtil.prompt({
                    name: 'enrollmentSecret',
                    description: 'What is the enrollment secret of the user?',
                    required: true,
                    hidden: true,
                    replace: '*'
                })
                .then((result) => {
                    argv.enrollSecret = result;
                });
            } else {
                return Promise.resolve();
            }
        })()
        .then(() => {
            return new Promise((resolve, reject) => {
                fs.readFile(networkArchiveLocation, (err, contents) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(contents);
                });
            });
        })
        .then((networkArchive) => {
            return BusinessNetworkDefinition.fromArchive(networkArchive);
        })
        .then((result) => {
            businessNetworkDefinition = result;
            return businessNetworkDefinition.getModelManager();
        })
        .then((modelManager) => {
            let models = modelManager.getModelFiles();
            models.forEach((model) => {
                // if (!model.isAbstract()) {
                assetDeclarations[model.getNamespace()] = model.getAssetDeclarations();
                transactionDeclarations[model.getNamespace()] = model.getTransactionDeclarations();
                // }
            });
        })
        .then(() => {
            let itList = [];
            for (let namespace in transactionDeclarations) {
                let transactions = transactionDeclarations[namespace];
                transactions.forEach((transaction) => {
                    let payload = {$class: namespace + '.' + transaction.getName()};

                    transaction.getProperties().forEach((property) => {
                        if (property.name !== transaction.idField && property.name !== 'timestamp') {
                            payload[property.name] = 'TestValue';
                        }
                    });

                    itList.push(
                            Tests.getTransactionItBlock(
                                namespace + '.' + transaction.getName(),
                                businessNetworkDefinition.getIdentifier(),
                                argv.enrollId,
                                argv.enrollSecret,
                                payload
                            )
                        );
                });
            }
            return Promise.all(itList);
        })
        .then((itList) => {
            return Tests.readFile(TEMPLATES_DIR + '/transactiontemplate')
            .then((contents) => {
                return nunjucks.renderString(contents, {enrollId: argv.enrollId, enrollSecret: argv.enrollSecret, businessNetworkName: businessNetworkDefinition.getIdentifier(), networkArchiveLocation: networkArchiveLocation, tests: itList.join()});
            });
        })
        .then((file) => {
            if (!fs.existsSync(projectDirTest)){
                fs.mkdirSync(projectDirTest);
            }
            return Tests.writeFile(projectDirTest+'/transactions.js', file);
        });
    }

    /**
     * Reads the contents of any file
     * @param {string} file the relative file path
     * @return {Promise} Promise containing the contents of the file
    **/
    static readFile(file) {
        return new Promise((resolve, reject) => {
            fs.readFile(file, 'utf8', (err, contents) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(contents);
                }
            });
        });
    }

    /**
     * Write contents to file
     * @param {string} file the relative file path
     * @param {string} contents the new contents of the file
     * @return {Promise} Promise when the file is written
    **/
    static writeFile(file, contents) {
        return new Promise((resolve, reject) => {
            fs.writeFile(file, contents, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    /**
     * Get a describe block
     * @param {string} name the title of the describle block
     * @return {string} a mocha describe function as a string
    **/
    static getDescribeBlock(name) {
        return `describe('${name}', () => {{{tests}}})`;
    }

    /**
     * Get a describe block
     * @param {string} description the title of the it block
     * @param {object} businessNetworkName the name of the network
     * @param {object} enrollId the users enrollment id
     * @param {object} enrollSecret the users enrollment secret
     * @param {object} transactionJson json object containing the the transation
     * @return {Promise} promise containing the mocha 'it' fucntion template found in ./gen/ittemplate
    **/
    static getTransactionItBlock(description, businessNetworkName, enrollId, enrollSecret, transactionJson) {
        return Tests.readFile(TEMPLATES_DIR+'/ittemplate')
        .then((contents) => {
            let it = nunjucks.renderString(contents, {description: description, businessNetworkName: businessNetworkName, nrollId: enrollId, enrollSecret: enrollSecret, transaction: JSON.stringify(transactionJson)});
            return it;
        });
    }

}

module.exports = Tests;
