/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const fs = require('fs-extra');
const Globalize = require('@ibm/ibm-concerto-common').Globalize;
const hfc = require('hfc');
const HFCSecurityContext = require('./hfcsecuritycontext');
const path = require('path');
const SecurityException = require('@ibm/ibm-concerto-common').SecurityException;
const temp = require('temp').track();
const Util = require('@ibm/ibm-concerto-common').Util;
const uuid = require('node-uuid');
const version = require('../package.json').version;

const runtimeModulePath = path.dirname(require.resolve('@ibm/ibm-concerto-runtime-hlf'));

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
            args: args
        };
        return new Promise((resolve, reject) => {
            let transactionContext = enrolledMember.query(queryRequest);
            transactionContext.on('submitted', () => {
                // TODO: we should probably log this!
            });
            transactionContext.on('complete', (data) => {
                resolve(data.result);
            });
            transactionContext.on('error', (error) => {
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
            args: args
        };
        return new Promise((resolve, reject) => {
            let transactionContext = enrolledMember.invoke(invokeRequest);
            transactionContext.on('submitted', () => {
                // TODO: we should probably log this!
            });
            transactionContext.on('complete', () => {
                resolve();
            });
            transactionContext.on('error', (error) => {
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
        // Because hfc needs to write a Dockerfile to the chaincode directory, we
        // must copy the chaincode to a temporary directory. We need to do this
        // to handle the case where Concerto is installed into the global directory
        // (npm install -g) and is therefore owned by the root user.
        return new Promise((resolve, reject) => {
            // Create a temporary directory to contain the chaincode.
            temp.mkdir('concerto', (err, tempDirectoryPath) => {
                if (err) {
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
                fs.copy(sourceDirectoryPath, targetDirectoryPath, { filter: (path) => { return !/(Concerto-Runtime-Hyperledger-Fabric|ibm-concerto-runtime-hlf).*node_modules/.test(path); }}, (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(tempDirectoryPath);
                });
            });
        })
        .then((tempDirectoryPath) => {
            // If force is specified, then we want to write a unique file into
            // the chaincode to trick hfc into deploying a new instance.
            return new Promise((resolve, reject) => {
                let targetFilePath = path.resolve(tempDirectoryPath, 'src', chaincodePath, 'version.go');
                let targetFileContents = `
                package main
                // The version for this chaincode.
                const version = "${version}"
                `;
                fs.outputFile(targetFilePath, targetFileContents, (err) => {
                    if (err) {
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
                let enrolledMember = securityContext.getEnrolledMember();
                let transactionContext = enrolledMember.deploy(deployRequest);
                transactionContext.on('complete', (result) => {
                    resolve(result);
                });
                transactionContext.on('error', (error) => {
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

}

module.exports = HFCUtil;
