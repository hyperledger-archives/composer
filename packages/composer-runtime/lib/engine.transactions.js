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

const { Logger, Typed } = require('composer-common');
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
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
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
        const transactionFQT = transaction.getFullyQualifiedType();

        // Store the transaction in the context.
        context.setTransaction(transaction);

        // Get the transaction and historian registries
        let registryManager = context.getRegistryManager();

        LOG.debug(method, 'Getting default transaction registry for ' + transactionFQT);
        const txRegistry = await registryManager.get('Transaction', transactionFQT);

        let historian;
        let historianRecord;
        let canHistorianAdd = null;  // this means it's good otherwise it will contain an error object
        if (context.historianEnabled === undefined || context.historianEnabled) {
            LOG.debug(method, 'Getting historian registry');
            historian = await registryManager.get('Asset', 'org.hyperledger.composer.system.HistorianRecord');

            // Form the historian record
            historianRecord = this._createHistorianRecord(context, transaction);
            canHistorianAdd = await historian.testAdd(historianRecord);
        }

            // check that we can add to both these registries ahead of time
        LOG.debug(method, 'Validating ability to create in Transaction and optionally Historian registries');
        let canTxAdd = await txRegistry.testAdd(transaction);

        if (canTxAdd || canHistorianAdd){
            throw canTxAdd ? canTxAdd : canHistorianAdd;
        }

        // Execute the transaction.
        const returnValue = await this._executeTransaction(context, transaction);

        // Store the transaction in the transaction registry.
        LOG.debug(method, 'Storing executed transaction in Transaction registry');
        await txRegistry.add(transaction, {noTest: true});

        if (context.historianEnabled === undefined || context.historianEnabled) {
            // Update the historian record before we store it.
            this._updateHistorianRecord(context, historianRecord);

            // Store the historian record in the historian registry.
            LOG.debug(method, 'Storing Historian record in Historian registry');
            await historian.add(historianRecord, {noTest: true, validate: false});
        }

        context.clearTransaction();
        LOG.exit(method, returnValue);
        LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
        return returnValue;
    }

    /**
     * Execute the transaction transaction processor functions for a transaction.
     * @param {Context} context The request context.
     * @param {Resource} transaction The transaction.
     * @return {*} The return value if there was one.
     */
    async _executeTransaction(context, transaction) {
        const method = 'executeTransaction';
        LOG.entry(method, context, transaction);
        const t0 = Date.now();

        // Resolve the users copy of the transaction.
        LOG.debug(method, 'Resolving transaction', transaction);
        const resolvedTransaction = await context.getResolver().resolve(transaction);

        // Execute any system transaction processor functions.
        let totalExecuted = 0;
        for (let transactionHandler of context.getTransactionHandlers()) {
            const executed = await transactionHandler.execute(context.getApi(), resolvedTransaction);
            totalExecuted += executed;
        }

        // Execute any user transaction processor functions.
        const { executed, returnValues } = await context.getCompiledScriptBundle().execute(context.getApi(), resolvedTransaction);
        totalExecuted += executed;

        // Check that a transaction processor function was executed.
        if (totalExecuted === 0) {
            const error = new Error(`Could not find any functions to execute for transaction ${resolvedTransaction.getFullyQualifiedIdentifier()}`);
            LOG.error(method, error);
            LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
            throw error;
        }

        // Handle the return values.
        const returnValue = this._processReturnValues(context, transaction, returnValues);
        LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
        LOG.exit(method, returnValue);
        return returnValue;
    }

    /**
     * Creates the Historian Record for a given transaction
     * @param {Context} context of the transaction
     * @param {Transaction} transaction originally submitted transaction
     * @return {Resource} resolved with the Historian Record
     * @private
     */
    _createHistorianRecord(context, transaction) {
        const method = 'createHistorianRecord';
        LOG.entry(method, context, transaction);
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
        LOG.perf(method, 'Total (ms) duration: ', context.getContextId(), t0);
        return record;
    }

    /**
     * Updates the Historian Record for a given transaction after it has executed
     * @param {Context} context of the transaction
     * @param {Resource} record the historian record
     * @private
     */
    _updateHistorianRecord(context, record) {

        // Get the events that are generated - getting these as Resources - and add to the historian record
        const eventService = context.getEventService();
        record.eventsEmitted = [];
        eventService.getEvents().forEach((element) => {
            const r = context.getSerializer().fromJSON(element, {validate: false});
            record.eventsEmitted.push(r);
        } );

    }

    /**
     * Process all return values returned by a transaction processor function for a transaction.
     * @param {Context} context The request context.
     * @param {Resource} transaction The transaction.
     * @param {*} returnValues The return values.
     * @return {*} The return value if there was one.
     */
    _processReturnValues(context, transaction, returnValues) {
        const method = 'processReturnValues';
        LOG.entry(method, context, transaction, returnValues);

        // Determine whether or not a result was expected.
        const returnsDecorator = transaction.getClassDeclaration().getDecorator('returns');
        if (!returnsDecorator) {
            LOG.exit(method, undefined);
            return undefined;
        }

        // Find all results that aren't undefined.
        const filteredReturnValues = returnValues.filter(result => result !== undefined);

        // Ensure one, and only one result was returned.
        if (filteredReturnValues.length === 0) {
            const error = new Error(`A return value of type ${returnsDecorator.getType()} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but nothing was returned by any functions`);
            LOG.error(method, error);
            throw error;
        } else if (filteredReturnValues.length !== 1) {
            const error = new Error(`A return value of type ${returnsDecorator.getType()} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but more than one function returned a value`);
            LOG.error(method, error);
            throw error;
        }
        const actualReturnValue = filteredReturnValues[0];

        // Handle enum return values.
        if (returnsDecorator.isTypeEnum()) {
            const result = this._processEnumReturnValue(context, transaction, actualReturnValue);
            LOG.exit(method, result);
            return result;
        }

        // Handle non-primitive return values.
        if (!returnsDecorator.isPrimitive()) {
            const result = this._processComplexReturnValue(context, transaction, actualReturnValue);
            LOG.exit(method, result);
            return result;
        }

        // Handle primitive return values.
        const result = this._processPrimitiveReturnValue(context, transaction, actualReturnValue);
        LOG.exit(method, result);
        return result;
    }

    /**
     * Process a complex return value returned by a transaction processor function for a transaction.
     * @param {Context} context The request context.
     * @param {Resource} transaction The transaction.
     * @param {*} actualReturnValue The return value.
     * @return {*} The return value if there was one.
     */
    _processComplexReturnValue(context, transaction, actualReturnValue) {
        const method = 'processComplexReturnValue';
        LOG.entry(method, context, transaction, actualReturnValue);

        // Get the type and resolved type.
        const transactionDeclaration = transaction.getClassDeclaration();
        const returnsDecorator = transactionDeclaration.getDecorator('returns');
        const readOnly = transactionDeclaration.getDecorator('readonly') ? true : false;
        const returnValueType = returnsDecorator.getType();
        const returnValueResolvedType = returnsDecorator.getResolvedType();
        const isArray = returnsDecorator.isArray();
        const formattedExpectedType = `${returnValueType}${isArray ? '[]' : ''}`;

        // Validate the return value type.
        const processComplexReturnValueInner = (actualReturnValue) => {
            if (!(actualReturnValue instanceof Typed)) {
                const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a non-typed value was returned`);
                LOG.error(method, error);
                throw error;
            } else if (!actualReturnValue.instanceOf(returnValueResolvedType.getFullyQualifiedName())) {
                const actualReturnValueType = actualReturnValue.getType();
                const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                LOG.error(method, error);
                throw error;
            }
            return context.getSerializer().toJSON(actualReturnValue, { convertResourcesToRelationships: true, permitResourcesForRelationships: false, useOriginal: readOnly });
        };

        // Handle the non-array case - a single return value.
        if (!returnsDecorator.isArray()) {
            const returnValue = processComplexReturnValueInner(actualReturnValue);
            LOG.exit(method, returnValue);
            return returnValue;
        }

        // This is the array case - ensure the return value is an array.
        if (!Array.isArray(actualReturnValue)) {
            const actualReturnValueType = typeof actualReturnValue;
            const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
            LOG.error(method, error);
            throw error;
        }

        // Now handle all the elements of the array.
        const returnValue = actualReturnValue.map((item) => {
            return processComplexReturnValueInner(item);
        });
        LOG.exit(method, returnValue);
        return returnValue;
    }

    /**
     * Process an enum return value returned by a transaction processor function for a transaction.
     * @param {Context} context The request context.
     * @param {Resource} transaction The transaction.
     * @param {*} actualReturnValue The return value.
     * @return {*} The return value if there was one.
     */
    _processEnumReturnValue(context, transaction, actualReturnValue) {
        const method = '_processEnumReturnValue';
        LOG.entry(method, actualReturnValue);

        // Get the type.
        const transactionDeclaration = transaction.getClassDeclaration();
        const returnsDecorator = transactionDeclaration.getDecorator('returns');
        const returnValueType = returnsDecorator.getType();
        const returnValueResolvedType = returnsDecorator.getResolvedType();
        const validEnumValues = returnValueResolvedType.getProperties().map(enumValueProperty => enumValueProperty.getName());
        const isArray = returnsDecorator.isArray();
        const formattedExpectedType = `${returnValueType}${isArray ? '[]' : ''}`;

        // Validate the return value type.
        const processPrimitiveReturnValueInner = (actualReturnValue) => {
            if (typeof actualReturnValue !== 'string') {
                const actualReturnValueType = typeof actualReturnValue;
                const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                LOG.error(method, error);
                throw error;
            } else if (validEnumValues.indexOf(actualReturnValue) === -1) {
                const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but an invalid enum value ${actualReturnValue} was returned`);
                LOG.error(method, error);
                throw error;
            }
            return actualReturnValue;
        };

        // Handle the non-array case - a single return value.
        if (!returnsDecorator.isArray()) {
            const returnValue = processPrimitiveReturnValueInner(actualReturnValue);
            LOG.exit(method, returnValue);
            return returnValue;
        }

        // This is the array case - ensure the return value is an array.
        if (!Array.isArray(actualReturnValue)) {
            const actualReturnValueType = typeof actualReturnValue;
            const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
            LOG.error(method, error);
            throw error;
        }

        // Now handle all the elements of the array.
        const returnValue = actualReturnValue.map((item) => {
            return processPrimitiveReturnValueInner(item);
        });
        LOG.exit(method, returnValue);
        return returnValue;
    }

    /**
     * Process a primitive return value returned by a transaction processor function for a transaction.
     * @param {Context} context The request context.
     * @param {Resource} transaction The transaction.
     * @param {*} actualReturnValue The return value.
     * @return {*} The return value if there was one.
     */
    _processPrimitiveReturnValue(context, transaction, actualReturnValue) {
        const method = 'processPrimitiveReturnValue';
        LOG.entry(method, actualReturnValue);

        // Get the type.
        const transactionDeclaration = transaction.getClassDeclaration();
        const returnsDecorator = transactionDeclaration.getDecorator('returns');
        const returnValueType = returnsDecorator.getType();
        const isArray = returnsDecorator.isArray();
        const formattedExpectedType = `${returnValueType}${isArray ? '[]' : ''}`;

        // Validate the return value type.
        const processPrimitiveReturnValueInner = (actualReturnValue) => {
            switch (returnValueType) {
            case 'DateTime':
                if (!(actualReturnValue instanceof Date)) {
                    const actualReturnValueType = typeof actualReturnValue;
                    const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                    LOG.error(method, error);
                    throw error;
                }
                return actualReturnValue.toISOString();
            case 'Integer':
            case 'Long':
            case 'Double':
                if (typeof actualReturnValue !== 'number') {
                    const actualReturnValueType = typeof actualReturnValue;
                    const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                    LOG.error(method, error);
                    throw error;
                }
                return actualReturnValue;
            case 'Boolean':
                if (typeof actualReturnValue !== 'boolean') {
                    const actualReturnValueType = typeof actualReturnValue;
                    const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                    LOG.error(method, error);
                    throw error;
                }
                return actualReturnValue;
            default:
                if (actualReturnValue === undefined || actualReturnValue === null) {
                    const actualReturnValueType = typeof actualReturnValue;
                    const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
                    LOG.error(method, error);
                    throw error;
                }
                return actualReturnValue.toString();
            }
        };

        // Handle the non-array case - a single return value.
        if (!returnsDecorator.isArray()) {
            const returnValue = processPrimitiveReturnValueInner(actualReturnValue);
            LOG.exit(method, returnValue);
            return returnValue;
        }

        // This is the array case - ensure the return value is an array.
        if (!Array.isArray(actualReturnValue)) {
            const actualReturnValueType = typeof actualReturnValue;
            const error = new Error(`A return value of type ${formattedExpectedType} was expected for transaction ${transaction.getFullyQualifiedIdentifier()}, but a value of type ${actualReturnValueType} was returned`);
            LOG.error(method, error);
            throw error;
        }

        // Now handle all the elements of the array.
        const returnValue = actualReturnValue.map((item) => {
            return processPrimitiveReturnValueInner(item);
        });
        LOG.exit(method, returnValue);
        return returnValue;
    }

}

module.exports = EngineTransactions;
