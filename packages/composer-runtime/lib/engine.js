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

const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const Context = require('./context');
const createHash = require('sha.js');
const Logger = require('composer-common').Logger;
const util = require('util');

const LOG = Logger.getLog('Engine');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
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
     * Get the chaincode container hosting this engine.
     * @return {Container} The chaincode container hosting this engine.
     */
    getContainer() {
        return this.container;
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
        let businessNetworkBase64, businessNetworkHash, businessNetworkRecord, businessNetworkDefinition, compiledScriptBundle;
        let sysregistries, sysidentities;
        return Promise.resolve()
            .then(() => {

                // Start the transaction.
                return context.transactionStart(false);

            })
            .then(() => {

                // Load, validate, and hash the business network definition.
                LOG.debug(method, 'Loading business network definition');
                businessNetworkBase64 = args[0];
                let businessNetworkArchive = Buffer.from(businessNetworkBase64, 'base64');
                let sha256 = createHash('sha256');
                businessNetworkHash = sha256.update(businessNetworkBase64, 'utf8').digest('hex');
                LOG.debug(method, 'Calculated business network definition hash', businessNetworkHash);

                // Create the business network record.
                businessNetworkRecord = {
                    data: businessNetworkBase64,
                    hash: businessNetworkHash
                };

                // Load the business network.
                businessNetworkDefinition = Context.getCachedBusinessNetwork(businessNetworkHash);
                if (!businessNetworkDefinition) {
                    return BusinessNetworkDefinition.fromArchive(businessNetworkArchive)
                        .then((businessNetworkDefinition_) => {

                            // Cache the business network.
                            businessNetworkDefinition = businessNetworkDefinition_;
                            LOG.debug(method, 'Loaded business network definition, storing in cache');
                            Context.cacheBusinessNetwork(businessNetworkHash, businessNetworkDefinition);

                        });
                }

            })
            .then(() => {

                // Load the compiled script bundle.
                compiledScriptBundle = Context.getCachedCompiledScriptBundle(businessNetworkHash);
                if (!compiledScriptBundle) {

                    // Cache the compiled script bundle.
                    compiledScriptBundle = context.getScriptCompiler().compile(businessNetworkDefinition.getScriptManager());
                    LOG.debug(method, 'Loaded compiled script bundle, storing in cache');
                    Context.cacheCompiledScriptBundle(businessNetworkHash, compiledScriptBundle);

                }

                // Get the sysdata collection where the business network definition is stored.
                LOG.debug(method, 'Loaded business network definition, storing in $sysdata collection');
                return dataService.getCollection('$sysdata')
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

                // Add the business network definition to the sysdata collection.
                return sysdata.add('businessnetwork', businessNetworkRecord);

            })
            .then(() => {

                // Ensure that the system registries collection exists.
                LOG.debug(method, 'Ensuring that sysregistries collection exists');
                return dataService.getCollection('$sysregistries')
                    .then((sysregistries_) => {
                        LOG.debug(method, 'The $sysregistries collection already exists');
                        return sysregistries_;
                    })
                    .catch((error) => {
                        LOG.debug(method, 'The $sysregistries collection does not exist, creating');
                        return dataService.createCollection('$sysregistries');
                    })
                    .then((sysregistries_) => {
                        sysregistries = sysregistries_;
                    });

            })
            .then(() => {

                // Ensure that the system identities collection exists.
                LOG.debug(method, 'Ensuring that sysidentities collection exists');
                return dataService.getCollection('$sysidentities')
                    .then((sysidentities_) => {
                        LOG.debug(method, 'The $sysidentities collection already exists');
                        return sysidentities_;
                    })
                    .catch((error) => {
                        LOG.debug(method, 'The $sysidentities collection does not exist, creating');
                        return dataService.createCollection('$sysidentities');
                    })
                    .then((sysidentities_) => {
                        sysidentities = sysidentities_;
                    });

            })
            .then(() => {

                // Initialize the context.
                LOG.debug(method, 'Initializing context');
                return context.initialize({
                    businessNetworkDefinition: businessNetworkDefinition,
                    compiledScriptBundle: compiledScriptBundle,
                    sysregistries: sysregistries,
                    sysidentities: sysidentities
                });

            })
            .then(() => {

                // Create all the default registries for each asset and participant type.
                LOG.debug(method, 'Creating default registries');
                let registryManager = context.getRegistryManager();
                return registryManager.createDefaults();

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
                return context.transactionPrepare()
                    .then(() => {
                        return context.transactionCommit();
                    })
                    .then(() => {
                        return context.transactionEnd();
                    });
            })
            .catch((error) => {
                LOG.error(method, 'Caught error, rethrowing', error);
                return context.transactionRollback()
                    .then(() => {
                        return context.transactionEnd();
                    })
                    .then(() => {
                        throw error;
                    });
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
                    return context.transactionStart(false);
                })
                .then(() => {
                    LOG.debug(method, 'Calling engine function', fcn);
                    return this[fcn](context, args);
                })
                .then((result) => {
                    return context.transactionPrepare()
                        .then(() => {
                            return context.transactionCommit();
                        })
                        .then(() => {
                            return context.transactionEnd();
                        })
                        .then(() => {
                            return result;
                        });
                })
                .catch((error) => {
                    LOG.error(method, 'Caught error, rethrowing', error);
                    return context.transactionRollback()
                        .then(() => {
                            return context.transactionEnd();
                        })
                        .then(() => {
                            throw error;
                        });
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
                    return context.transactionStart(true);
                })
                .then(() => {
                    LOG.debug(method, 'Calling engine function', fcn);
                    return this[fcn](context, args);
                })
                .then((result) => {
                    return context.transactionPrepare()
                        .then(() => {
                            return context.transactionCommit();
                        })
                        .then(() => {
                            return context.transactionEnd();
                        })
                        .then(() => {
                            return result;
                        });
                })
                .catch((error) => {
                    LOG.error(method, 'Caught error, rethrowing', error);
                    return context.transactionRollback()
                        .then(() => {
                            return context.transactionEnd();
                        })
                        .then(() => {
                            throw error;
                        });
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
        let participantFQI = null;
        let participant = context.getParticipant();
        if (participant) {
            participantFQI = participant.getFullyQualifiedIdentifier();
        }
        let result = {
            version: this.container.getVersion(),
            participant: participantFQI
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
 * @private
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
mixin(require('./engine.identities'));
mixin(require('./engine.registries'));
mixin(require('./engine.resources'));
mixin(require('./engine.transactions'));

module.exports = Engine;
