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
const util = require('util');

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
        // console.log('Engine.constructor', container);
        this.container = container;
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
        // console.log('Engine.init', context, fcn, args);
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
                    .catch((error) => {
                        return dataService.createCollection('$sysdata');
                    });

            })
            .then((sysdata) => {

                // Validate the business network archive and store it.
                let businessNetworkArchive = Buffer.from(args[0], 'base64');
                return BusinessNetworkDefinition.fromArchive(businessNetworkArchive)
                    .then((businessNetworkDefinition) => {
                        return sysdata.add('businessnetwork', {
                            data: args[0]
                        });
                    });

            })
            .then(() => {

                // Initialize the context.
                return context.initialize();

            })
            .then(() => {

                // Create the $sysregistries collection if it does not exist.
                return dataService
                    .getCollection('$sysregistries')
                    .catch((error) => {
                        return dataService.createCollection('$sysregistries');
                    });

            })
            .then(() => {

                // Create the default transaction registry if it does not exist.
                let registryManager = context.getRegistryManager();
                return registryManager
                    .get('Transaction', 'default')
                    .catch((error) => {
                        return registryManager.add('Transaction', 'default', 'Default Transaction Registry');
                    });

            })
            .then(() => {

                // Create all other default registries.
                let registryManager = context.getRegistryManager();
                return registryManager.createDefaults();

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
        // console.log('Engine._init', context, fcn, args, callback);
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
        // console.log('Engine.invoke', context, fcn, args);
        if (this[fcn]) {
            return context.initialize()
                .then(() => {
                    return this[fcn](context, args);
                });
        } else {
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
        // console.log('Engine._invoke', context, fcn, args, callback);
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
        // console.log('Engine.query', context, fcn, args);
        if (this[fcn]) {
            return context.initialize()
                .then(() => {
                    return this[fcn](context, args);
                });
        } else {
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
        // console.log('Engine._query', context, fcn, args, callback);
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
        if (args.length !== 0) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'ping', []));
        }
        return Promise.resolve({
            version: this.container.getVersion()
        });
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

mixin(require('./engine.assets'));
mixin(require('./engine.businessnetworkdefinitions'));
mixin(require('./engine.registries'));
mixin(require('./engine.resources'));
mixin(require('./engine.transactions'));

module.exports = Engine;
