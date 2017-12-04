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
    submitTransaction(context, args) {
        const method = 'submitTransaction';
        LOG.entry(method, context, args);
        if (args.length !== 1) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'submitTransaction', [ 'serializedResource']));
        }

        // Find the default transaction registry.
        let registryManager = context.getRegistryManager();
        let transaction = null;
        let historian = null;
        let txRegistry = null;

        // Parse the transaction from the JSON string..
        LOG.debug(method, 'Parsing transaction from JSON');
        let transactionData = JSON.parse(args[0]);

        // Now we need to convert the JavaScript object into a transaction resource.
        LOG.debug(method, 'Parsing transaction from parsed JSON object');
        // First we parse *our* copy, that is not resolved. This is the copy that gets added to the
        // transaction registry, and is the one in the context (for adding log entries).
        transaction = context.getSerializer().fromJSON(transactionData);

        // Store the transaction in the context.
        context.setTransaction(transaction);

        // This is the count of transaction processor functions executed.
        let totalCount = 0;

        let txClass = transaction.getFullyQualifiedType();
        LOG.debug(method, 'Getting default transaction registry for '+txClass);
        // Resolve the users copy of the transaction.
        LOG.debug(method, 'Parsed transaction, resolving it', transaction);
        let resolvedTransaction;


        // Get the historian.
        LOG.debug(method, 'Getting historian');
        return registryManager.get('Asset', 'org.hyperledger.composer.system.HistorianRecord')
            .then((result) => {
                historian = result;
                LOG.debug(method, 'Getting default transaction registry for '+txClass);
                return registryManager.get('Transaction', txClass);
            })
            .then((result) => {
                txRegistry = result;
                // check that we can add to both these registries ahead of time
                return txRegistry.testAdd(transaction);
            })
            .then((result)=>{
                if (result){
                    throw result;
                }
                return context.getResolver().resolve(transaction);
            })
            .then((resolvedTransaction_) => {

                // Save the resolved transaction.
                resolvedTransaction = resolvedTransaction_;

                // Execute any system transaction processor functions.
                const api = context.getApi();
                return context.getTransactionHandlers().reduce((promise, transactionHandler) => {
                    return promise.then(() => {

                        return transactionHandler.execute(api, resolvedTransaction)
                            .then((count) => {
                                totalCount += count;
                            });
                    });
                }, Promise.resolve());

            })
            .then(() => {

                // Execute any user transaction processor functions.
                const api = context.getApi();
                return context.getCompiledScriptBundle().execute(api, resolvedTransaction)
                    .then((count) => {
                        totalCount += count;
                    });

            })
            .then(() => {

                // Check that a transaction processor function was executed.
                if (totalCount === 0) {
                    const error = new Error(`Could not find any functions to execute for transaction ${resolvedTransaction.getFullyQualifiedIdentifier()}`);
                    LOG.error(method, error);
                    throw error;
                }

                // Store the transaction in the transaction registry.
                LOG.debug(method, 'Storing executed transaction in transaction registry');
                return txRegistry.add(transaction);
            })
            .then(()=>{
                return this.createHistorianRecord(transaction,context);
            })
            .then((result) => {
                // Store the transaction in the transaction registry.
                LOG.debug(method, 'Storing historian record in the registry');
                return historian.add(result);
            })
            .then(() => {
                context.clearTransaction();
                LOG.exit(method);
            });

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

        // Get the events that are generated - getting these as Resources
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

        // get the cached indentity
        // TODO there is the issue with the Admin userid that will be resolved in due course
        let id = context.getIdentity();
        if (id){
            record.identityUsed = factory.newRelationship(id.getNamespace(),id.getType(),id.getIdentifier());
        } else {
            LOG.debug(method, 'assuming admin userid again');
        }


        return Promise.resolve(record);

    }

}

module.exports = EngineTransactions;
