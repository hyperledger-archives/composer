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

const BusinessNetworkDefinition = require('@ibm/ibm-concerto-common').BusinessNetworkDefinition;
const Context = require('./context');
const createHash = require('sha.js');
const Logger = require('@ibm/ibm-concerto-common').Logger;
const util = require('util');

const LOG = Logger.getLog('Engine');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 */
class Engine {

    /**
     * Constructor.
     * @param {Container} container The chaincode container hosting this engine.
     */
    constructor(container) {
        this.container = container;
        this.installLogger();
        const method = 'constructor';
        LOG.entry(method);
        LOG.exit(method);
    }

    /**
     * Install the runtime logger into the common module.
     */
    installLogger() {
        let loggingService = this.container.getLoggingService();
        let loggingProxy = {
            log: (level, method, msg, args) => {
                args = args || [];
                let formattedArguments = args.map((arg) => {
                    if (arg === Object(arg)) {
                        // It's an object, array, or function, so serialize it as JSON.
                        try {
                            return JSON.stringify(arg);
                        } catch (e) {
                            return arg;
                        }
                    } else {
                        return arg;
                    }
                }).join(', ');
                switch (level) {
                case 'debug':
                    return loggingService.logDebug(util.format('@JS : %s %s %s', method, msg, formattedArguments));
                case 'warn':
                    return loggingService.logWarning(util.format('@JS : %s %s %s', method, msg, formattedArguments));
                case 'info':
                    return loggingService.logInfo(util.format('@JS : %s %s %s', method, msg, formattedArguments));
                case 'verbose':
                    return loggingService.logDebug(util.format('@JS : %s %s %s', method, msg, formattedArguments));
                case 'error':
                    return loggingService.logError(util.format('@JS : %s %s %s', method, msg, formattedArguments));
                }
            }
        };
        Logger.setFunctionalLogger(loggingProxy);
        Logger._envDebug = 'concerto:*';
        process.env = {};
        process.env.DEBUG = 'concerto:*';
    }

    /**
     * Handle an initialisation (deploy) request.
     * @param {Context} context The request context.
     * @param {string} fcn The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    init(context, fcn, args) {
        const method = 'init';
        LOG.entry(method, context, fcn, args);
        if (fcn !== 'init') {
            throw new Error(util.format('Unsupported function "%s" with arguments "%j"', fcn, args));
        } else if (args.length !== 1) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'init', ['businessNetworkArchive']));
        }
        let dataService = context.getDataService();
        return Promise.resolve()
            .then(() => {

                // Create the $sysdata collection if it does not exist.
                return dataService
                    .getCollection('$sysdata')
                    .then((sysdata) => {
                        LOG.debug(method, 'The $sysdata collection already exists');
                        return sysdata;
                    })
                    .catch((error) => {
                        LOG.debug(method, 'The $sysdata collection does not exist, creating');
                        return dataService.createCollection('$sysdata');
                    });

            })
            .then((sysdata) => {

                // Validate the business network archive and store it.
                let businessNetworkBase64 = args[0];
                let businessNetworkArchive = Buffer.from(businessNetworkBase64, 'base64');
                let sha256 = createHash('sha256');
                let businessNetworkHash = sha256.update(businessNetworkBase64, 'utf8').digest('hex');
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive)
                    .then((businessNetworkDefinition) => {
                        LOG.debug(method, 'Loaded business network definition, storing in cache');
                        Context.cacheBusinessNetwork(businessNetworkHash, businessNetworkDefinition);
                        LOG.debug(method, 'Loaded business network definition, storing in $sysdata collection');
                        return sysdata.add('businessnetwork', {
                            data: businessNetworkBase64,
                            hash: businessNetworkHash
                        });
                    });

            })
            .then(() => {

                // Initialize the context.
                LOG.debug(method, 'Initializing context');
                return context.initialize();

            })
            .then(() => {

                // Create the $sysregistries collection if it does not exist.
                return dataService
                    .getCollection('$sysregistries')
                    .then(() => {
                        LOG.debug(method, 'The $sysregistries collection already exists');
                    })
                    .catch((error) => {
                        LOG.debug(method, 'The $sysregistries collection does not exist, creating');
                        return dataService.createCollection('$sysregistries');
                    });

            })
            .then(() => {

                // Create the default transaction registry if it does not exist.
                let registryManager = context.getRegistryManager();
                return registryManager
                    .get('Transaction', 'default')
                    .then(() => {
                        LOG.debug(method, 'The default transaction registry already exists');
                    })
                    .catch((error) => {
                        LOG.debug(method, 'The default transaction registry does not exist, creating');
                        return registryManager.add('Transaction', 'default', 'Default Transaction Registry');
                    });

            })
            .then(() => {

                // Create all other default registries.
                LOG.debug(method, 'Creating default registries');
                let registryManager = context.getRegistryManager();
                return registryManager.createDefaults();

            })
            .catch((error) => {
                LOG.error(method, 'Caught error, rethrowing', error);
                throw error;
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Handle an initialisation (deploy) request.
     * @private
     * @param {Context} context The request context.
     * @param {string} fcn The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @param {function} callback The callback function to call when complete.
     */
    _init(context, fcn, args, callback) {
        this.init(context, fcn, args)
            .then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                callback(error, null);
            });
    }

    /**
     * Handle an invoke request.
     * @param {Context} context The request context.
     * @param {string} fcn The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    invoke(context, fcn, args) {
        const method = 'invoke';
        LOG.entry(method, context, fcn, args);
        if (this[fcn]) {
            LOG.debug(method, 'Initializing context');
            return context.initialize()
                .then(() => {
                    LOG.debug(method, 'Calling engine function', fcn);
                    return this[fcn](context, args);
                })
                .catch((error) => {
                    LOG.error(method, 'Caught error, rethrowing', error);
                    throw error;
                })
                .then(() => {
                    LOG.exit(method);
                });
        } else {
            LOG.error(method, 'Unsupported function', fcn, args);
            throw new Error(util.format('Unsupported function "%s" with arguments "%j"', fcn, args));
        }
    }

    /**
     * Handle an invoke request.
     * @private
     * @param {Context} context The request context.
     * @param {string} fcn The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @param {function} callback The callback function to call when complete.
     */
    _invoke(context, fcn, args, callback) {
        this.invoke(context, fcn, args)
            .then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                callback(error, null);
            });
    }

    /**
     * Handle a query request.
     * @param {Context} context The request context.
     * @param {string} fcn The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    query(context, fcn, args) {
        const method = 'query';
        LOG.entry(method, context, fcn, args);
        if (this[fcn]) {
            LOG.debug(method, 'Initializing context');
            return context.initialize()
                .then(() => {
                    LOG.debug(method, 'Calling engine function', fcn);
                    return this[fcn](context, args);
                })
                .catch((error) => {
                    LOG.error(method, 'Caught error, rethrowing', error);
                    throw error;
                })
                .then((result) => {
                    LOG.exit(method, result);
                    return result;
                });
        } else {
            LOG.error(method, 'Unsupported function', fcn, args);
            throw new Error(util.format('Unsupported function "%s" with arguments "%j"', fcn, args));
        }
    }

    /**
     * Handle a query request.
     * @private
     * @param {Context} context The request context.
     * @param {string} fcn The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @param {function} callback The callback function to call when complete.
     */
    _query(context, fcn, args, callback) {
        this.query(context, fcn, args)
            .then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                callback(error, null);
            });
    }

    /**
     * Handle a ping request.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    ping(context, args) {
        const method = 'ping';
        LOG.entry(method, context, args);
        if (args.length !== 0) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'ping', []));
        }
        let result = {
            version: this.container.getVersion()
        };
        LOG.exit(method, result);
        return Promise.resolve(result);
    }

    /**
     * Stop serialization of this object.
     * @return {Object} An empty object.
     */
    toJSON() {
        return {};
    }

}

/**
 * Add all of the methods of the source class to the engine class.
 * @param {Object} sourceClass The source class to copy methods from.
 */
function mixin(sourceClass) {
    Object.getOwnPropertyNames(sourceClass.prototype).forEach((method) => {
        if (method !== 'constructor') {
            Engine.prototype[method] = sourceClass.prototype[method];
        }
    });
}

mixin(require('./engine.businessnetworks'));
mixin(require('./engine.registries'));
mixin(require('./engine.resources'));
mixin(require('./engine.transactions'));

module.exports = Engine;
