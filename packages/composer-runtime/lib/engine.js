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

const Logger = require('composer-common').Logger;
const semver = require('semver');
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
        let loggerCfg = loggingService.getLoggerCfg();
        Logger.setLoggerCfg(loggerCfg,true);

    }

    /**
     * Handle an initialisation (deploy) request.
     * @param {Context} context The request context.
     * @param {string} fcn The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @async
     */
    async init(context, fcn, args) {
        const dataService = context.getDataService();
        let start = false;
        let sysdata, metanetwork;
        try {
            sysdata = await dataService.getCollection('$sysdata');
            const metanetworkJSON = await sysdata.get('metanetwork');
            metanetwork = context.getSerializer().fromJSON(metanetworkJSON);
            if (!metanetwork) {
                start = true;
            }
        } catch(err) {
            start = true;
        }

        if (start) {
            await this.start(context, args);
        } else {
            await this.upgrade(context, args, sysdata, metanetwork);
        }
    }

    /**
     * Perform a start of the business network.
     * @param {Context} context transaction context
     * @param {Array} args chaincode invocation arguments
     * @async
     */
    async start(context, args) {
        const method = 'start';
        LOG.entry(method, context, args);

        if (args.length !== 1) {
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, method, ['serializedResource']));
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

        const dataService = context.getDataService();

        // Extract and validate the optional log level property.
        const logLevel = transactionData.logLevel;
        if (logLevel) {
            let cfg = await this.getContainer().getLoggingService().getLoggerCfg();

            let newLevel = this.getContainer().getLoggingService().mapCfg(logLevel);
            let c =  Logger.setLoggerCfg(Object.assign(cfg,{debug:newLevel}),true);
            await this.getContainer().getLoggingService().setLoggerCfg(c);
        }

        await context.transactionStart(false);

        LOG.debug(method, 'Storing metanetwork in $sysdata collection');
        const sysdata = await dataService.ensureCollection('$sysdata');
        const networkIdentifier = context.getBusinessNetworkDefinition().getIdentifier();
        await sysdata.add('metanetwork', {
            '$class': 'org.hyperledger.composer.system.Network',
            'networkId': networkIdentifier,
            'runtimeVersion': this.container.getVersion()
        });

        LOG.debug(method, 'Ensuring that sysregistries collection exists');
        const sysregistries = await dataService.ensureCollection('$sysregistries');

        LOG.debug(method, 'Initializing context', this.getContainer().getVersion());
        await context.initialize({
            function: 'init',
            arguments: args,
            sysregistries: sysregistries,
            container: this.getContainer()
        });

        LOG.debug(method, 'Creating default registries');
        const registryManager = context.getRegistryManager();
        await registryManager.createDefaults();

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

        try {
            for(let transaction of bootstrapTransactions) {
                LOG.debug(method, 'Executing bootstrap transaction', transaction.transactionId);
                await this.submitTransaction(context, [JSON.stringify(transaction)]);
            }

            // This step executes the start business network transaction. This is a no-op, but records
            // the event into the transaction registry and optionally historian.
            LOG.debug(method, 'Executing start business network transaction');
            await this.submitTransaction(context, [JSON.stringify(transactionData)]);

            await context.transactionPrepare();
            await context.transactionCommit();
            await context.transactionEnd();
        } catch (error) {
            LOG.error(method, 'Caught error, rethrowing', error);
            await context.transactionRollback();
            await context.transactionEnd();
            throw error;
        }

        LOG.exit(method);
    }

    /**
     * Perform an upgrade of the business network.
     * @param {Context} context transaction context
     * @param {Array} args chaincode invocation arguments
     * @param {DataCollection} sysdata the sysdata collection
     * @param {object} metanetwork the metanetwork data object
     * @async
     */
    async upgrade(context, args, sysdata, metanetwork) {
        const method = 'upgrade';
        LOG.entry(method, context, args);

        const dataService = context.getDataService();

        await context.transactionStart(false);
        LOG.debug(method, 'Updating metanetwork in $sysdata collection');

        const newRuntimeVersion = this.container.getVersion();
        // Check our new version should be greater than or equal but only a micro version change.
        const range =  `^${metanetwork.runtimeVersion}`;
        if (!semver.satisfies(newRuntimeVersion, range)) {
            throw new Error(`Cannot upgrade business network. New composer runtime version of (${newRuntimeVersion}) is not compatible with (${metanetwork.runtimeVersion}). Composer runtime has changed major or minor version and cannot be upgraded.`);
        }

        try {
            // update the metanetwork with new identifier and version
            const networkId = context.getBusinessNetworkDefinition().getIdentifier();

            LOG.debug(method, `Updating metanetwork. id:${networkId} and version:${newRuntimeVersion}`);
            await sysdata.update('metanetwork', {
                '$class': 'org.hyperledger.composer.system.Network',
                'networkId': networkId,
                'runtimeVersion': newRuntimeVersion
            });

            LOG.debug(method, 'Ensuring that sysregistries collection exists');
            const sysregistries = await dataService.ensureCollection('$sysregistries');

            LOG.debug(method, 'Initializing context', this.getContainer().getVersion());
            await context.initialize({
                function: 'init',
                arguments: args,
                sysregistries: sysregistries,
                container: this.getContainer()
            });

            LOG.debug(method, 'Creating default registries');
            const registryManager = context.getRegistryManager();
            await registryManager.createDefaults();
            await context.transactionPrepare();
            await context.transactionCommit();
            await context.transactionEnd();
        } catch(error) {
            LOG.error(method, 'Caught error, rethrowing', error);
            await context.transactionRollback();
            await context.transactionEnd();
            throw error;
        }

        LOG.exit(method);
    }

    /**
     * Handle an invoke request.
     * @param {Context} context The request context.
     * @param {string} fcn The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async invoke(context, fcn, args) {
        const method = 'invoke';
        LOG.entry(method, context, fcn, args);
        if (!this[fcn] || fcn.match(/^_/)) {
            LOG.error(method, 'Unsupported function', fcn, args);
            throw new Error(util.format('Unsupported function "%s" with arguments "%j"', fcn, args));
        }
        LOG.debug(method, 'Initializing context');
        await context.initialize({ function: fcn, arguments: args,  container: this.getContainer() });
        try {
            await context.transactionStart(false);
            LOG.debug(method, 'Calling engine function', fcn);
            const result = await this[fcn](context, args);
            await context.transactionPrepare();
            await context.transactionCommit();
            await context.transactionEnd();
            LOG.exit(method, result);
            return result;
        } catch (error) {
            await context.transactionRollback();
            await context.transactionEnd();
            LOG.error(method, 'Caught error, rethrowing', error);
            throw error;
        }
    }

    /**
     * Handle a query request.
     * @param {Context} context The request context.
     * @param {string} fcn The name of the chaincode function to invoke.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async query(context, fcn, args) {
        const method = 'query';
        LOG.entry(method, context, fcn, args);
        if (!this[fcn] || fcn.match(/^_/)) {
            LOG.error(method, 'Unsupported function', fcn, args);
            throw new Error(util.format('Unsupported function "%s" with arguments "%j"', fcn, args));
        }
        LOG.debug(method, 'Initializing context');
        await context.initialize({ function: fcn, arguments: args, container: this.getContainer() });
        try {
            await context.transactionStart(true);
            LOG.debug(method, 'Calling engine function', fcn);
            const result = await this[fcn](context, args);
            await context.transactionPrepare();
            await context.transactionCommit();
            await context.transactionEnd();
            LOG.exit(method, result);
            return result;
        } catch (error) {
            await context.transactionRollback();
            await context.transactionEnd();
            LOG.error(method, 'Caught error, rethrowing', error);
            throw error;
        }
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
        let identityFQI = null;
        let identity = context.getIdentity();
        if (identity) {
            identityFQI = identity.getFullyQualifiedIdentifier();
        }
        let result = {
            version: this.container.getVersion(),
            participant: participantFQI,
            identity: identityFQI
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
