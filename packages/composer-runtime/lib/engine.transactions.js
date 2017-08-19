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
        if (args.length !== 2) {
            LOG.error(method, 'Invalid arguments', args);
            throw new Error(util.format('Invalid arguments "%j" to function "%s", expecting "%j"', args, 'submitTransaction', ['registryId', 'serializedResource']));
        }

        // Find the default transaction registry.
        let registryManager = context.getRegistryManager();
        let transaction = null;
        let historian = null;
        let txRegistry = null;

        // Parse the transaction from the JSON string..
        LOG.debug(method, 'Parsing transaction from JSON');
        let transactionData = JSON.parse(args[1]);

        // Now we need to convert the JavaScript object into a transaction resource.
        LOG.debug(method, 'Parsing transaction from parsed JSON object');
        // First we parse *our* copy, that is not resolved. This is the copy that gets added to the
        // transaction registry, and is the one in the context (for adding log entries).
        transaction = context.getSerializer().fromJSON(transactionData);

        // Store the transaction in the context.
        context.setTransaction(transaction);

        // This is the count of transaction processor functions executed.
        let totalCount = 0;

        // Resolve the users copy of the transaction.
        LOG.debug(method, 'Parsed transaction, resolving it', transaction);
        let resolvedTransaction;
        return context.getResolver().resolve(transaction)
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

                // Get the historian.
                LOG.debug(method, 'Getting historian');
                return registryManager.get('Asset', 'org.hyperledger.composer.system.HistorianRecord');

            })
            .then((result) => {
                historian = result;
                // Get the default transaction registry.
                LOG.debug(method, 'Getting default transaction registry');
                return registryManager.get('Transaction', 'default');
            })
            .then((result) => {
                txRegistry = result;
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
            record.participantInvoking = factory.newRelationship('org.hyperledger.composer.system','Participant',participant.getIdentifier());
        }

        // Get the transaction in question and also create a relationship
        record.transactionInvoked = factory.newRelationship('org.hyperledger.composer.system','Transaction',transaction.getIdentifier());
        record.transactionTimestamp = transaction.timestamp;
        record.transactionType = transaction.getType();

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

        // Note that this is only call out to collect data that returns a promise.
        // Get the current identity that is being used
        return context.getIdentityManager().getIdentity()
        .then( (result) => {
            record.identityUsed = factory.newRelationship('org.hyperledger.composer.system','Identity',result.getIdentifier());
            LOG.exit(method, record);
            return record;
        }).catch(/* istanbul ignore next */error => {
            //TODO:  need to remove this when the admin is sorted out!
            /* istanbul ignore next */
            if(error.identityName){
                LOG.debug(method, 'admin userid again');
            } else {
                throw error;
            }
        }).then(()=>{
            LOG.exit(method, record);
            return record;
        } );

    }

}

module.exports = EngineTransactions;
