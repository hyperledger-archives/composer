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
                    return String(arg);
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

        // chaincode was upgraded, no change to business network and obviously
        // nothing the runtime can do to stop it.
        if (fcn === 'upgrade') {
            LOG.info(method, 'runtime has been upgraded');
            //TODO: Here we would need to invoke migrations if we are to support
            //upgrading from anything more than just micro version changes of the
            //runtime. Currently not supported and the connector will not allow
            //the upgrade. We could add a check here as well and reject the upgrade
            //but it's overkill at the moment.
            return Promise.resolve();
        }

        if (fcn !== 'init') {
            throw new Error(util.format('Unsupported function "%s" with arguments "%j"', fcn, args));
        } else if (args.length !== 1) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'init', ['serializedResource']));
        }

        // Parse the transaction from the JSON string..
        LOG.debug(method, 'Parsing transaction from JSON');
        let transactionData = JSON.parse(args[0]);

        // We can't parse the transaction data using the serializer.
        // This is because it may contain classes that we haven't loaded yet.
        // So we need to do it the "old fashioned way".
        if (transactionData.$class !== 'org.hyperledger.composer.system.StartBusinessNetwork') {
            throw new Error('The transaction data specified is not valid');
        }

        // Extract and validate the required business network archive property.
        const businessNetworkBase64 = transactionData.businessNetworkArchive;
        if (!businessNetworkBase64) {
            throw new Error('The business network archive specified is not valid');
        }

        // Extract and validate the optional log level property.
        const logLevel = transactionData.logLevel;
        if (logLevel) {
            this.getContainer().getLoggingService().setLogLevel(logLevel);
        }

        let dataService = context.getDataService();
        let businessNetworkHash, businessNetworkRecord, businessNetworkDefinition;
        let compiledScriptBundle, compiledQueryBundle, compiledAclBundle;
        let sysregistries, sysdata;
        return Promise.resolve()
            .then(() => {

                // Start the transaction.
                return context.transactionStart(false);

            })
            .then(() => {

                // Load, validate, and hash the business network definition.
                LOG.debug(method, 'Loading business network definition');
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
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive);

            })
            .then((businessNetworkDefinition_) => {

                // Cache the business network.
                businessNetworkDefinition = businessNetworkDefinition_;
                LOG.debug(method, 'Loaded business network definition, storing in cache');
                Context.cacheBusinessNetwork(businessNetworkHash, businessNetworkDefinition);

                // Cache the compiled script bundle.
                compiledScriptBundle = Context.getCachedCompiledScriptBundle(businessNetworkHash);
                if (!compiledScriptBundle) {
                    compiledScriptBundle = context.getScriptCompiler().compile(businessNetworkDefinition.getScriptManager());
                    LOG.debug(method, 'Loaded compiled script bundle, storing in cache');
                    Context.cacheCompiledScriptBundle(businessNetworkHash, compiledScriptBundle);
                }

                // Cache the compiled query bundle.
                compiledQueryBundle = Context.getCachedCompiledQueryBundle(businessNetworkHash);
                if (!compiledQueryBundle) {
                    compiledQueryBundle = context.getQueryCompiler().compile(businessNetworkDefinition.getQueryManager());
                    LOG.debug(method, 'Loaded compiled query bundle, storing in cache');
                    Context.cacheCompiledQueryBundle(businessNetworkHash, compiledQueryBundle);
                }

                // Cache the compiled ACL bundle.
                compiledAclBundle = Context.getCachedCompiledAclBundle(businessNetworkHash);
                if (!compiledAclBundle) {
                    compiledAclBundle = context.getAclCompiler().compile(businessNetworkDefinition.getAclManager(), businessNetworkDefinition.getScriptManager());
                    LOG.debug(method, 'Loaded compiled ACL bundle, storing in cache');
                    Context.cacheCompiledAclBundle(businessNetworkHash, compiledAclBundle);
                }

                // Get the sysdata collection where the business network definition is stored.
                LOG.debug(method, 'Loaded business network definition, storing in $sysdata collection');
                return dataService.ensureCollection('$sysdata');

            })
            .then((sysdata_) => {

                // Add the business network definition to the sysdata collection.
                sysdata = sysdata_;
                return sysdata.add('businessnetwork', businessNetworkRecord);

            })
            .then(() => {
                return sysdata.add('metanetwork', { '$class': 'org.hyperledger.composer.system.Network', 'networkId': businessNetworkDefinition.getIdentifier() });
            })
            .then(() => {

                // Ensure that the system registries collection exists.
                LOG.debug(method, 'Ensuring that sysregistries collection exists');
                return dataService.ensureCollection('$sysregistries')
                    .then((sysregistries_) => {
                        sysregistries = sysregistries_;
                    });

            })
            .then(() => {

                // Initialize the context.
                LOG.debug(method, 'Initializing context 2',this.getContainer().getVersion());

                return context.initialize({
                    function: fcn,
                    arguments: args,
                    businessNetworkDefinition: businessNetworkDefinition,
                    compiledScriptBundle: compiledScriptBundle,
                    compiledQueryBundle: compiledQueryBundle,
                    compiledAclBundle: compiledAclBundle,
                    sysregistries: sysregistries,
                    container: this.getContainer()
                });

            })
            .then(() => {

                // Create all the default registries for each asset, participant, and transaction type.
                LOG.debug(method, 'Creating default registries');
                let registryManager = context.getRegistryManager();
                return registryManager.createDefaults();

            })
            .then(() => {

                // We want the historian entries to be ordered, so lets bump the milliseconds for every
                // bootstrap transaction we execute.
                const timestamp = new Date(transactionData.timestamp);

                // First we need to prepare any bootstrap transactions by forcing the transaction ID
                // and timestamp to be derived from the start business network transaction.
                const bootstrapTransactions = transactionData.bootstrapTransactions || [];
                bootstrapTransactions.forEach((bootstrapTransaction, index) => {
                    bootstrapTransaction.transactionId = transactionData.transactionId + '#' + index;
                    timestamp.setMilliseconds(timestamp.getMilliseconds() + 1);
                    bootstrapTransaction.timestamp = timestamp.toISOString();
                });

                // Now update the original timestamp so the start business network transaction is correct.
                timestamp.setMilliseconds(timestamp.getMilliseconds() + 1);
                transactionData.timestamp = timestamp.toISOString();

                // Now that we have initialized and loaded the business network defintion, we can now
                // safely execute all of the bootstrap transactions.
                return bootstrapTransactions.reduce((promise, bootstrapTransaction) => {
                    return promise.then(() => {
                        LOG.debug(method, 'Executing bootstrap transaction', bootstrapTransaction.transactionId);
                        return this.submitTransaction(context, [JSON.stringify(bootstrapTransaction)]);
                    });
                }, Promise.resolve());

            })
            .then(() => {

                // This step executes the start business network transaction. This is a no-op, but records
                // the event into the transaction registry and historian.
                LOG.debug(method, 'Executing start business network transaction');
                return this.submitTransaction(context, [JSON.stringify(transactionData)]);

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
            return context.initialize({ function: fcn, arguments: args,  container: this.getContainer() })
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
            return context.initialize({ function: fcn, arguments: args, container: this.getContainer() })
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
mixin(require('./engine.queries'));
mixin(require('./engine.registries'));
mixin(require('./engine.resources'));
mixin(require('./engine.transactions'));
mixin(require('./engine.logging'));

module.exports = Engine;
