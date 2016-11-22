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
const hfc = require('hfc');
const path = require('path');
const temp = require('temp').track();
const uuid = require('node-uuid');
const version = require('../package.json').version;

/**
 * Internal Utility Class
 * <p><a href="diagrams/util.svg"><img src="diagrams/util.svg" style="width:100%;"/></a></p>
 * @private
 */
class Util {
    /**
     * Submit a query request to the chain-code
     * @param {ManagementConnection} managementConnection - The user's security context
     * @param {string} functionName - The name of the function to call.
     * @param {string[]} args - The arguments to pass to the function being called.
     * @return {Promise} - A promise that will be resolved with the value returned
     * by the chain-code function.
     */
    static queryChainCode(managementConnection, functionName, args) {
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
        let enrolledMember = managementConnection.enrolledMember;
        let queryRequest = {
            chaincodeID: managementConnection.chaincodeID,
            fcn: functionName,
            args: args
        };
        return new Promise(function (resolve, reject) {
            let transactionContext = enrolledMember.query(queryRequest);
            transactionContext.on('submitted', function () {
                // TODO: we should probably log this!
            });
            transactionContext.on('complete', function (data) {
                resolve(data.result);
            });
            transactionContext.on('error', function (error) {
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
     * @param {ManagementConnection} managementConnection - The user's security context
     * @param {string} functionName - The name of the function to call.
     * @param {string[]} args - The arguments to pass to the function being called.
     * @return {Promise} - A promise that will be resolved with the value returned
     * by the chain-code function.
     */
    static invokeChainCode(managementConnection, functionName, args) {
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
        let enrolledMember = managementConnection.enrolledMember;
        let invokeRequest = {
            chaincodeID: managementConnection.chaincodeID,
            fcn: functionName,
            args: args
        };
        return new Promise(function (resolve, reject) {
            let transactionContext = enrolledMember.invoke(invokeRequest);
            transactionContext.on('submitted', function () {
                // TODO: we should probably log this!
            });
            transactionContext.on('complete', function () {
                resolve();
            });
            transactionContext.on('error', function (error) {
                if (error instanceof hfc.EventTransactionError) {
                    reject(new Error(error.msg));
                } else {
                    reject(error);
                }
            });
        });
    }

    /**
     * Returns true if the typeof the object === 'undefined' or
     * the object === null.
     * @param {Object} obj - the object to be tested
     * @returns {boolean} true if the object is null or undefined
     */
    static isNull(obj) {
        return(typeof(obj) === 'undefined' || obj === null);
    }

    /**
     * Submit an deploy request to the chain-code
     * @param {ManagementConnection} managementConnection - The user's security context
     * @param {string} chaincodePath - The path of the chain-code to deploy.
     * @param {string} functionName - The name of the function to call.
     * @param {string[]} args - The arguments to pass to the function being called.
     * @param {boolean} force - Force a new instance of the chain-code to deploy.
     * @return {Promise} - A promise that will be resolved with the value returned
     * by the chain-code function.
     */
    static deployChainCode(managementConnection, chaincodePath, functionName, args, force) {
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
                let sourceDirectoryPath = path.resolve(__dirname, '..', 'chaincode', 'src', chaincodePath);
                let targetDirectoryPath = path.resolve(tempDirectoryPath, 'src', chaincodePath);
                fs.copy(sourceDirectoryPath, targetDirectoryPath, (err) => {
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
                let targetFilePath = path.resolve(tempDirectoryPath, 'src', chaincodePath, 'cc_version.go');
                let targetFileContents = `
                package main
                // The version for this chaincode.
                const chaincodeVersion = "${version}"
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
                    let targetFilePath = path.resolve(tempDirectoryPath, 'src', chaincodePath, 'cc_unique_id.go');
                    let targetUUID = uuid.v4();
                    let targetFileContents = `
                    package main
                    // The unique ID for this chaincode.
                    const chaincodeUniqueID = "${targetUUID}"
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
                let enrolledMember = managementConnection.enrolledMember;
                let transactionContext = enrolledMember.deploy(deployRequest);
                transactionContext.on('complete', function (result) {
                    resolve(result);
                });
                transactionContext.on('error', function (error) {
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

module.exports = Util;
