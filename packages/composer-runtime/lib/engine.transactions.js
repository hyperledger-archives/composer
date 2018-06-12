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
const util = require('util');
const LOG = Logger.getLog('EngineTransactions');

/**
 * The JavaScript engine responsible for processing chaincode commands.
 * @protected
 * @memberof module:composer-runtime
 */
class EngineTransactions {

    /**
     * Submit a transaction for execution.
     * @param {Context} context The request context.
     * @param {string[]} args The arguments to pass to the chaincode function.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    async submitTransaction(context, args) {
        const method = 'submitTransaction';
        LOG.entry(method, context, args);

        const t0 = Date.now();

        if (args.length !== 1) {
            LOG.error(method, 'Invalid arguments', args);
            LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'submitTransaction', [ 'serializedResource']));
        }

        // Parse the transaction from the JSON string..
        LOG.debug(method, 'Parsing transaction from JSON');
        let transactionData = JSON.parse(args[0]);

        // Now we need to convert the JavaScript object into a transaction resource.
        // This is *our* copy, that is not resolved. It is the copy that gets added to the
        // transaction registry, and is the one in the context (for adding log entries).
        LOG.debug(method, 'Parsing transaction from parsed JSON object');
        const transaction = context.getSerializer().fromJSON(transactionData);
        const txClass = transaction.getFullyQualifiedType();

        // Store the transaction in the context.
        context.setTransaction(transaction);

        // Get the transaction and historian registries
        let registryManager = context.getRegistryManager();

        LOG.debug(method, 'Getting default transaction registry for ' + txClass);
        const txRegistry = await registryManager.get('Transaction', txClass);

        LOG.debug(method, 'Getting historian registry');
        const historian = await registryManager.get('Asset', 'org.hyperledger.composer.system.HistorianRecord');

        // Form the historian record
        const record = await this.createHistorianRecord(transaction, context);

        // check that we can add to both these registries ahead of time
        LOG.debug(method, 'Validating ability to create in Transaction and Historian registries');
        let canTxAdd = await txRegistry.testAdd(transaction);
        let canHistorianAdd = await historian.testAdd(record);

        if (canTxAdd || canHistorianAdd){
            throw canTxAdd ? canTxAdd : canHistorianAdd;
        }

        // Resolve the users copy of the transaction.
        LOG.debug(method, 'Resolving transaction', transaction);
        const resolvedTransaction = await context.getResolver().resolve(transaction);

        // Execute any system transaction processor functions.
        let count = 0;
        let totalCount = 0;
        for (let transactionHandler of context.getTransactionHandlers()) {
            count = await transactionHandler.execute(context.getApi(), resolvedTransaction);
            totalCount += count;
        }

        // Execute any user transaction processor functions.
        count = await context.getCompiledScriptBundle().execute(context.getApi(), resolvedTransaction);
        totalCount += count;

        // Check that a transaction processor function was executed.
        if (totalCount === 0) {
            const error = new Error(`Could not find any functions to execute for transaction ${resolvedTransaction.getFullyQualifiedIdentifier()}`);
            LOG.error(method, error);
            LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
            throw error;
        }

        // Store the transaction in the transaction registry.
        LOG.debug(method, 'Storing executed transaction in Transaction registry');
        await txRegistry.add(transaction, {noTest: true});

        // Get the events that are generated - getting these as Resources - and add to the historian record
        let evtSvr = context.getEventService();
        record.eventsEmitted = [];

        if(evtSvr) {
            let s = evtSvr.getEvents();
            if (s) {
                s.forEach((element) => {
                    let r = context.getSerializer().fromJSON(element);
                    record.eventsEmitted.push(r);
                } );
            }
        }

        // Store the transaction in the historian registry.
        LOG.debug(method, 'Storing Historian record in Historian registry');
        await historian.add(record, {noTest: true});

        context.clearTransaction();
        LOG.exit(method);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
        return Promise.resolve();
    }

    /**
     * Creates the Historian Record for a given transaction
     * @param {Transaction} transaction originally submitted transaction
     * @param {Context} context of the transaction
     * @return {Promise} resolved with the Historian Record
     * @private
     */
    createHistorianRecord(transaction,context) {
        const method = 'createHistorianRecord';
        LOG.entry(method,transaction,context);
        const t0 = Date.now();

        // For reference the historian record looks like this
        // asset HistorianRecord identified by transactionId {
        //     o String      transactionId
        //   --> Transaction transactionInvoked
        //   --> Participant participantInvoking
        //   --> Identity    identityUsed
        //   o Event[]     eventsEmitted
        //   o DateTime      tranactionTimestamp
        // }

        // create a record from the factory
        let factory = context.getFactory();
        let record = factory.newResource('org.hyperledger.composer.system', 'HistorianRecord', transaction.getIdentifier());

        LOG.info(method,'created historian record');
        // Get the current participant & create a relationship
        let participant = context.getParticipant();
        if (!participant){
            record.participantInvoking = null;
        } else {
            record.participantInvoking = factory.newRelationship(participant.getNamespace(),participant.getType(),participant.getIdentifier());
        }

        // Get the transaction in question and also create a relationship
        record.transactionInvoked = factory.newRelationship(transaction.getNamespace(),transaction.getType(),transaction.getIdentifier());
        record.transactionTimestamp = transaction.timestamp;
        record.transactionType = transaction.getFullyQualifiedType();

        // get the cached indentity
        // TODO there is the issue with the Admin userid that will be resolved in due course
        let id = context.getIdentity();
        if (id){
            record.identityUsed = factory.newRelationship(id.getNamespace(),id.getType(),id.getIdentifier());
        } else {
            LOG.debug(method, 'assuming admin userid again');
        }

        LOG.exit(method);
        LOG.debug('@PERF ' + method, 'Total (ms) duration: ' + (Date.now() - t0).toFixed(2));
        return Promise.resolve(record);
    }

}

module.exports = EngineTransactions;
