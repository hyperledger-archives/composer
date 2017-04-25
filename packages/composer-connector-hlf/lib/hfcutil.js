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

const fs = require('fs-extra');
const Globalize = require('composer-common').Globalize;
const hfc = require('hfc');
const HFCSecurityContext = require('./hfcsecuritycontext');
const path = require('path');
const SecurityException = require('composer-common').SecurityException;
const temp = require('temp').track();
const Util = require('composer-common').Util;
const uuid = require('uuid');
const version = require('../package.json').version;
const LOG = require('composer-common').Logger.getLog('HFCUtil');

const runtimeModulePath = path.dirname(require.resolve('composer-runtime-hlf'));

/**
 * Internal Utility Class
 * <p><a href="diagrams/util.svg"><img src="diagrams/util.svg" style="width:100%;"/></a></p>
 * @private
 */
class HFCUtil {

    /**
     * Internal method to check the security context
     * @param {SecurityContext} securityContext - The user's security context
     * @throws {SecurityException} if the user context is invalid
     */
    static securityCheck(securityContext) {
        if (Util.isNull(securityContext)) {
            throw new SecurityException(Globalize.formatMessage('util-securitycheck-novalidcontext'));
        } else if (!(securityContext instanceof HFCSecurityContext)) {
            throw new SecurityException(Globalize.formatMessage('util-securitycheck-novalidcontext'));
        }
    }

    /**
     * Submit a query request to the chain-code
     * @param {HFCSecurityContext} securityContext - The user's security context
     * @param {string} functionName - The name of the function to call.
     * @param {string[]} args - The arguments to pass to the function being called.
     * @return {Promise} - A promise that will be resolved with the value returned
     * by the chain-code function.
     */
    static queryChainCode(securityContext, functionName, args) {
        HFCUtil.securityCheck(securityContext);
        if (!functionName) {
            throw new Error('functionName not specified');
        } else if (!args) {
            throw new Error('args not specified');
        }
        args.forEach((arg) => {
            if (typeof arg !== 'string') {
                throw new Error('invalid arg specified: ' + arg);
            }
        });
        let enrolledMember = securityContext.getEnrolledMember();
        let queryRequest = {
            chaincodeID: securityContext.getChaincodeID(),
            fcn: functionName,
            args: args,
            attrs: ['userID']
        };
        LOG.info('queryChainCode', 'enrolledMember ' + enrolledMember, queryRequest);
        return new Promise((resolve, reject) => {
            let transactionContext = enrolledMember.query(queryRequest);
            transactionContext.on('submitted', () => {
                LOG.info('queryChainCode', 'onSubmitted ' + enrolledMember, queryRequest);
            });
            transactionContext.on('complete', (data) => {
                LOG.info('queryChainCode', 'onComplete ' + enrolledMember, queryRequest);
                resolve(data.result);
            });
            transactionContext.on('error', (error) => {
                LOG.error('queryChainCode', 'onError ' + enrolledMember, error);
                if (error instanceof hfc.EventTransactionError) {
                    reject(new Error(error.msg));
                } else {
                    reject(error);
                }
            });
        });
    }

    /**
     * Submit an invoke request to the chain-code
     * @param {HFCSecurityContext} securityContext - The user's security context
     * @param {string} functionName - The name of the function to call.
     * @param {string[]} args - The arguments to pass to the function being called.
     * @return {Promise} - A promise that will be resolved with the value returned
     * by the chain-code function.
     */
    static invokeChainCode(securityContext, functionName, args) {
        HFCUtil.securityCheck(securityContext);
        if (!functionName) {
            throw new Error('functionName not specified');
        } else if (!args) {
            throw new Error('args not specified');
        }
        args.forEach((arg) => {
            if (typeof arg !== 'string') {
                throw new Error('invalid arg specified: ' + arg);
            }
        });
        let enrolledMember = securityContext.getEnrolledMember();
        let invokeRequest = {
            chaincodeID: securityContext.getChaincodeID(),
            fcn: functionName,
            args: args,
            attrs: ['userID']
        };
        LOG.info('invokeChainCode', 'function ' + functionName, args);
        return new Promise((resolve, reject) => {
            let transactionContext = enrolledMember.invoke(invokeRequest);
            transactionContext.on('submitted', () => {
                LOG.info('invokeChainCode', 'onSubmitted ' + enrolledMember, invokeRequest);
            });
            transactionContext.on('complete', () => {
                LOG.info('invokeChainCode', 'onComplete ' + enrolledMember, invokeRequest);
                resolve();
            });
            transactionContext.on('error', (error) => {
                LOG.info('invokeChainCode', 'onError ' + enrolledMember, invokeRequest);
                if (error instanceof hfc.EventTransactionError) {
                    reject(new Error(error.msg));
                } else {
                    reject(error);
                }
            });
        });
    }

    /**
     * Submit an deploy request to the chain-code
     * @param {HFCSecurityContext} securityContext - The user's security context
     * @param {string} chaincodePath - The path of the chain-code to deploy.
     * @param {string} functionName - The name of the function to call.
     * @param {string[]} args - The arguments to pass to the function being called.
     * @param {boolean} force - Force a new instance of the chain-code to deploy.
     * @return {Promise} - A promise that will be resolved with the value returned
     * by the chain-code function.
     */
    static deployChainCode(securityContext, chaincodePath, functionName, args, force) {
        HFCUtil.securityCheck(securityContext);
        if (!chaincodePath) {
            throw new Error('chaincodePath not specified');
        } else if (!functionName) {
            throw new Error('functionName not specified');
        } else if (!args) {
            throw new Error('args not specified');
        }
        args.forEach((arg) => {
            if (typeof arg !== 'string') {
                throw new Error('invalid arg specified: ' + arg);
            }
        });
        LOG.info('deployChainCode', 'function ' + functionName + ' force ' + force, chaincodePath);

        // We need the connection options as they include the certificate and
        // certificate path options that are relevant to the deploy of the chaincode.
        const connectOptions = securityContext.getConnection().getConnectionOptions();

        // Because hfc needs to write a Dockerfile to the chaincode directory, we
        // must copy the chaincode to a temporary directory. We need to do this
        // to handle the case where Composer is installed into the global directory
        // (npm install -g) and is therefore owned by the root user.
        return new Promise((resolve, reject) => {
            // Create a temporary directory to contain the chaincode.
            temp.mkdir('concerto', (err, tempDirectoryPath) => {
                if (err) {
                    LOG.error('deployChainCode', 'mkdir', err);
                    return reject(err);
                }
                resolve(tempDirectoryPath);
            });
        })
        .then((tempDirectoryPath) => {
            // Copy the chaincode from source directory to temporary directory.
            return new Promise((resolve, reject) => {
                let sourceDirectoryPath = path.resolve(runtimeModulePath);
                let targetDirectoryPath = path.resolve(tempDirectoryPath, 'src', chaincodePath);
                fs.copy(sourceDirectoryPath, targetDirectoryPath, { filter: (path) => { return !/composer-runtime-hlf.*node_modules/.test(path); }}, (err) => {
                    if (err) {
                        LOG.error('deployChainCode', 'copy', err);
                        return reject(err);
                    }
                    resolve(tempDirectoryPath);
                });
            });
        })
        .then((tempDirectoryPath) => {
            // identify the version of the product that generated this chaincode
            return new Promise((resolve, reject) => {
                let targetFilePath = path.resolve(tempDirectoryPath, 'src', chaincodePath, 'version.go');
                let targetFileContents = `
                package main
                // The version for this chaincode.
                const version = "${version}"
                `;
                fs.outputFile(targetFilePath, targetFileContents, (err) => {
                    if (err) {
                        LOG.error('deployChainCode', 'outputFile version', err);
                        return reject(err);
                    }
                    resolve(tempDirectoryPath);
                });
            });
        })
        .then((tempDirectoryPath) => {
            // If force is specified, then we want to write a unique file into
            // the chaincode to trick hfc into deploying a new instance.
            if (force) {
                return new Promise((resolve, reject) => {
                    let targetFilePath = path.resolve(tempDirectoryPath, 'src', chaincodePath, 'unique_id.go');
                    let targetUUID = uuid.v4();
                    let targetFileContents = `
                    package main
                    // The unique ID for this chaincode.
                    const uniqueID = "${targetUUID}"
                    `;
                    fs.outputFile(targetFilePath, targetFileContents, (err) => {
                        if (err) {
                            LOG.error('deployChainCode', 'outputFile uuid', err);
                            return reject(err);
                        }
                        resolve(tempDirectoryPath);
                    });
                });
            } else {
                return tempDirectoryPath;
            }
        })
        .then((tempDirectoryPath) => {
            // If the connection options specify a certificate, write that to the file
            // system for the chaincode to use to communicate with the peer.
            if (connectOptions.certificate) {
                return new Promise((resolve, reject) => {
                    let targetFilePath = path.resolve(tempDirectoryPath, 'src', chaincodePath, 'certificate.pem');
                    fs.outputFile(targetFilePath, connectOptions.certificate, (err) => {
                        if (err) {
                            LOG.error('deployChainCode', 'Failed to write certificate.pem', err);
                            return reject(err);
                        }
                        resolve(tempDirectoryPath);
                    });
                });
            } else {
                return tempDirectoryPath;
            }
        })
        .then((tempDirectoryPath) => {
            // Now we can ask hfc to deploy the chaincode.
            return new Promise((resolve, reject) => {
                // This is evil! I shouldn't need to set GOPATH in a node.js program.
                process.env.GOPATH = tempDirectoryPath;
                let deployRequest = {
                    fcn: functionName,
                    args: args,
                    chaincodePath: chaincodePath
                };
                if (connectOptions.certificatePath) {
                    deployRequest.certificatePath = connectOptions.certificatePath;
                }
                let enrolledMember = securityContext.getEnrolledMember();
                let transactionContext = enrolledMember.deploy(deployRequest);
                transactionContext.on('complete', (result) => {
                    LOG.info('deployChainCode', 'onComplete uuid', result);
                    resolve(result);
                });
                transactionContext.on('error', (error) => {
                    LOG.error('deployChainCode', 'onError', error);

                    if (error instanceof hfc.EventTransactionError) {
                        reject(new Error(error.msg));
                    } else {
                        reject(error);
                    }
                });
            })
            // On failure, we need to delete the temporary directory.
            .catch((err) => {
                return new Promise((resolve, reject) => {
                    fs.remove(tempDirectoryPath, (err2) => {
                        if (err2) {
                            return reject(err2);
                        }
                        return resolve();
                    });
                })
                .catch((err2) => {
                    // We want to throw the original exception!
                    throw err;
                })
                .then(() => {
                    // We want to throw the original exception!
                    throw err;
                });
            })
            // On success, we also need to delete the temporary directory.
            .then((result) => {
                return new Promise((resolve, reject) => {
                    fs.remove(tempDirectoryPath, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(result);
                    });
                });
            });
        });
    }

    /**
     * Create a new identity for the specified user ID.
     * @param {SecurityContext} securityContext The participant's security context.
     * @param {string} userID The user ID.
     * @param {object} [options] Options for the new identity.
     * @param {boolean} [options.issuer] Whether or not the new identity should have
     * permissions to create additional new identities. False by default.
     * @param {string} [options.affiliation] Specify the affiliation for the new
     * identity. Defaults to 'institution_a'.
     * @return {Promise} A promise that is resolved with a generated user
     * secret once the new identity has been created, or rejected with an error.
     */
    static createIdentity(securityContext, userID, options) {
        const method = 'createIdentity';
        LOG.entry(method, securityContext, userID, options);
        HFCUtil.securityCheck(securityContext);
        if (!userID) {
            throw new Error('userID not specified');
        }
        options = options || {};
        const attributes = {
            userID: userID
        };
        return new Promise((resolve, reject) => {
            let enrolledMember = securityContext.getEnrolledMember();
            let chain = enrolledMember.getChain();
            let registerRequest = {
                enrollmentID: userID,
                affiliation: options.affiliation || 'institution_a',
                attributes: []
            };
            if (options.issuer) {
                registerRequest.registrar = {
                    // Everyone we create can register clients.
                    roles: ['client'],
                    // Everyone we create can register clients that can register clients.
                    delegateRoles: ['client']
                };
            }
            for (let attribute in attributes) {
                LOG.debug(method, 'Adding attribute to request', attribute);
                registerRequest.attributes.push({
                    name: attribute,
                    value: attributes[attribute]
                });
            }
            const memberServices = chain.getMemberServices();
            memberServices.register(registerRequest, enrolledMember, (error, userSecret) => {
                if (error) {
                    LOG.error(method, 'Register request failed', error);
                    return reject(error);
                }
                LOG.exit(method, 'Register request succeeded');
                resolve({
                    userID: userID,
                    userSecret: userSecret
                });
            });
        });
    }

}

module.exports = HFCUtil;
