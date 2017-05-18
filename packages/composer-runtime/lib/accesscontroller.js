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

const AccessException = require('./accessexception');
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('AccessController');

/**
 * A class that manages access to registries and resources by processing
 * the access control list(s) in a business network definition.
 * @private
 * @class
 * @memberof module:composer-runtime
 */
class AccessController {

    /**
     * Constructor.
     * @param {AclManager} aclManager The ACL manager to use.
     */
    constructor(aclManager) {
        const method = 'constructor';
        LOG.entry(method, aclManager);
        this.aclManager = aclManager;
        this.participant = null;
        this.transaction = null;
        LOG.exit(method);
    }

    /**
     * Get the current participant.
     * @return {Resource} The current participant.
     */
    getParticipant() {
        return this.participant;
    }

    /**
     * Set the current participant.
     * @param {Resource} participant The current participant.
     */
    setParticipant(participant) {
        this.participant = participant;
    }

    /**
     * Get the current transaction.
     * @return {Resource} The current transaction.
     */
    getTransaction() {
        return this.transaction;
    }

    /**
     * Set the current transaction.
     * @param {Resource} transaction The current transaction.
     */
    setTransaction(transaction) {
        this.transaction = transaction;
    }

    /**
     * Check that the specified participant has the specified
     * level of access to the specified resource.
     * @param {Resource} resource The resource.
     * @param {string} access The level of access.
     * @param {Resource} participant The participant.
     * @throws {AccessException} If the specified participant
     * does not have the specified level of access to the specified
     * resource.
     */
    check(resource, access) {
        const method = 'check';
        LOG.entry(method, resource.getFullyQualifiedIdentifier(), access);
        try {

            // Check to see if a participant has been set. If not, then ACL
            // enforcement is not enabled.
            let participant = this.participant;
            if (!participant) {
                LOG.debug(method, 'No participant');
                LOG.exit(method);
                return;
            }

            // Grab the transaction. Does not matter if this is null.
            let transaction = this.transaction;

            // Check to see if an ACL file was supplied. If not, then ACL
            // enforcement is not enabled.
            if (!this.aclManager.getAclFile()) {
                LOG.debug(method, 'No ACL file');
                LOG.exit(method);
                return;
            }

            // Iterate over the ACL rules in order, but stop at the first rule
            // that permits the action.
            let aclRules = this.aclManager.getAclRules();
            let result = aclRules.some((aclRule) => {
                LOG.debug(method, 'Processing rule', aclRule);
                let value = this.checkRule(resource, access, participant, transaction, aclRule);
                LOG.debug(method, 'Processed rule', value);
                return value;
            });

            // If a ACL rule permitted the action, return.
            if (result) {
                LOG.exit(method);
                return;
            }

            // Otherwise no ACL rule permitted the action.
            throw new AccessException(resource, access, participant, transaction);

        } catch (e) {
            LOG.error(method, e);
            throw e;
        }
    }

    /**
     * Check the specified ACL rule permits the specified level
     * of access to the specified resource.
     * @param {Resource} resource The resource.
     * @param {string} access The level of access.
     * @param {Resource} participant The participant.
     * @param {Resource} transaction The transaction.
     * @param {AclRule} aclRule The ACL rule.
     * @returns {boolean} True if the specified ACL rule permits
     * the specified level of access to the specified resource.
     */
    checkRule(resource, access, participant, transaction, aclRule) {
        const method = 'checkRule';
        LOG.entry(method, resource, access, participant, transaction, aclRule);

        // Is the ACL rule relevant to the specified noun?
        if (!this.matchNoun(resource, aclRule)) {
            LOG.debug(method, 'Noun does not match');
            LOG.exit(method, false);
            return false;
        }

        // Is the ACL rule relevant to the specified verb?
        if (!this.matchVerb(access, aclRule)) {
            LOG.debug(method, 'Verb does not match');
            LOG.exit(method, false);
            return false;
        }

        // Is the ACL rule relevant to the specified participant?
        if (!this.matchParticipant(participant, aclRule)) {
            LOG.debug(method, 'Participant does not match');
            LOG.exit(method, false);
            return false;
        }

        // Is the ACL rule relevant to the specified transaction?
        if (!this.matchTransaction(transaction, aclRule)) {
            LOG.debug(method, 'Transaction does not match');
            LOG.exit(method, false);
            return false;
        }

        // Is the predicate met?
        if (!this.matchPredicate(resource, access, participant, transaction, aclRule)) {
            LOG.debug(method, 'Predicate does not match');
            LOG.exit(method, false);
            return false;
        }

        // Yes, is this an allow or deny rule?
        if (aclRule.getAction() === 'ALLOW') {
            LOG.exit(method, true);
            return true;
        }

        // This must be an explicit deny rule, so throw.
        let e = new AccessException(resource, access, participant, transaction);
        LOG.error(method, e);
        throw e;

    }

    /**
     * Check that the specified participant has the specified
     * level of access to the specified resource.
     * @param {Resource} resource The resource.
     * @param {AclRule} aclRule The ACL rule.
     * @returns {boolean} True if the specified ACL rule permits
     * the specified level of access to the specified resource.
     */
    matchNoun(resource, aclRule) {
        const method = 'matchNoun';
        LOG.entry(method, resource.getFullyQualifiedIdentifier(), aclRule);

        // Determine the input fully qualified name and ID.
        let fqn = resource.getFullyQualifiedType();
        let ns = resource.getNamespace();
        let id = resource.getIdentifier();

        // Check the namespace and type of the ACL rule.
        let noun = aclRule.getNoun();

        // Check to see if the fully qualified name matches.
        let reqFQN = noun.getFullyQualifiedName();
        if (fqn === reqFQN) {
            // Noun is matching fully qualified type.
        } else if (ns === reqFQN) {
            // Noun is matching namespace.
        } else {
            // Noun does not match.
            LOG.exit(method, false);
            return false;
        }

        // Check to see if the identifier matches (if specified).
        let reqID = noun.getInstanceIdentifier();
        if (reqID) {
            if (id === reqID) {
                // Noun is matching identifier.
            } else {
                // Noun does not match.
                LOG.exit(method, false);
                return false;
            }
        } else {
            // Noun does not specify identifier.
        }

        LOG.exit(method, true);
        return true;
    }

    /**
     * Check that the specified participant has the specified
     * level of access to the specified resource.
     * @param {string} access The level of access.
     * @param {AclRule} aclRule The ACL rule.
     * @returns {boolean} True if the specified ACL rule permits
     * the specified level of access to the specified resource.
     */
    matchVerb(access, aclRule) {
        const method = 'matchVerb';
        LOG.entry(method, access, aclRule);

        // Check to see if the access matches the verb of the ACL rule.
        // Verb can be one of:
        //   'CREATE' / 'READ' / 'UPDATE' / 'ALL' / 'DELETE'
        let verbs = aclRule.getVerbs();
        let result = verbs.some((verb) => {
            return verb === 'ALL' || access === verb;
        });

        LOG.exit(method, result);
        return result;
    }

    /**
     * Check that the specified participant has the specified
     * level of access to the specified resource.
     * @param {Resource} participant The participant.
     * @param {AclRule} aclRule The ACL rule.
     * @returns {boolean} True if the specified ACL rule permits
     * the specified level of access to the specified resource.
     */
    matchParticipant(participant, aclRule) {
        const method = 'matchParticipant';
        LOG.entry(method, participant.getFullyQualifiedIdentifier(), aclRule);

        // Is a participant specified in the ACL rule?
        let reqParticipant = aclRule.getParticipant();
        if (!reqParticipant) {
            LOG.exit(method, true);
            return true;
        }

        // Check to see if the participant is an instance of the
        // required participant type, or is in the required
        // namespace.
        let ns = participant.getNamespace();
        let reqFQN = reqParticipant.getFullyQualifiedName();
        if (participant.instanceOf(reqFQN)) {
            // Participant is matching type or subtype.
        } else if (ns === reqFQN) {
            // Participant is matching namespace.
        } else {
            // Participant does not match.
            LOG.exit(method, false);
            return false;
        }

        // Check to see if the identifier matches (if specified).
        let id = participant.getIdentifier();
        let reqID = reqParticipant.getInstanceIdentifier();
        if (reqID) {
            if (id === reqID) {
                // Participant is matching identifier.
            } else {
                // Participant does not match.
                LOG.exit(method, false);
                return false;
            }
        } else {
            // Participant does not specify identifier.
        }

        LOG.exit(method, true);
        return true;
    }

    /**
     * Check that the specified transaction has the specified
     * level of access to the specified resource.
     * @param {Resource} transaction The transaction.
     * @param {AclRule} aclRule The ACL rule.
     * @returns {boolean} True if the specified ACL rule permits
     * the specified level of access to the specified resource.
     */
    matchTransaction(transaction, aclRule) {
        const method = 'matchTransaction';
        LOG.entry(method, transaction ? transaction.getFullyQualifiedIdentifier() : transaction, aclRule);

        // Is a transaction specified in the ACL rule?
        let reqTransaction = aclRule.getTransaction();
        if (!reqTransaction) {
            LOG.exit(method, true);
            return true;
        }

        // OK, a transaction is specified in the ACL rule, but
        // are we executing in the scope of a transaction?
        if (!transaction) {
            LOG.exit(method, false);
            return false;
        }

        // Check to see if the participant is an instance of the
        // required participant type, or is in the required
        // namespace.
        let ns = transaction.getNamespace();
        let reqFQN = reqTransaction.getFullyQualifiedName();
        if (transaction.instanceOf(reqFQN)) {
            // Transaction is matching type or subtype.
        } else if (ns === reqFQN) {
            // Transaction is matching namespace.
        } else {
            // Participant does not match.
            LOG.exit(method, false);
            return false;
        }

        LOG.exit(method, true);
        return true;
    }

    /**
     * Check that the specified participant has the specified
     * level of access to the specified resource.
     * @param {Resource} resource The resource.
     * @param {string} access The level of access.
     * @param {Resource} participant The participant.
     * @param {Resource} transaction The transaction.
     * @param {AclRule} aclRule The ACL rule.
     * @returns {boolean} True if the specified ACL rule permits
     * the specified level of access to the specified resource.
     */
    matchPredicate(resource, access, participant, transaction, aclRule) {
        const method = 'matchPredicate';
        LOG.entry(method, resource, access, participant, transaction, aclRule);

        // Get the predicate from the rule.
        let predicate = aclRule.getPredicate().getExpression();

        // We can fast track the simple boolean predicates.
        if (predicate === 'true') {
            LOG.exit(method, true);
            return true;
        } else if (predicate === 'false') {
            LOG.exit(method, false);
            return false;
        }

        // Otherwise we need to build a function.
        let source = `return (${predicate});`;
        let argNames = [];
        let argValues = [];

        // Check to see if the resource needs to be bound.
        let resourceVar = aclRule.getNoun().getVariableName();
        if (resourceVar) {
            argNames.push(resourceVar);
            argValues.push(resource);
        }

        // Check to see if the participant needs to be bound.
        let reqParticipant = aclRule.getParticipant();
        if (reqParticipant) {
            let participantVar = aclRule.getParticipant().getVariableName();
            if (participantVar) {
                argNames.push(participantVar);
                argValues.push(participant);
            }
        }

        // Check to see if the transaction needs to be bound.
        let reqTransaction = aclRule.getTransaction();
        if (reqTransaction) {
            let transactionVar = aclRule.getTransaction().getVariableName();
            if (transactionVar) {
                argNames.push(transactionVar);
                argValues.push(transaction);
            }
        }

        // Compile and execute the function.
        let result;
        try {
            LOG.debug(method, 'Compiling and executing function', source, argNames, argValues);
            let func = new Function(argNames.join(','), source);
            result = func.apply(null, argValues);
        } catch (e) {
            LOG.error(method, e);
            throw new AccessException(resource, access, participant, transaction);
        }

        // Convert the result into a boolean before returning it.
        result = !!result;
        LOG.exit(method, result);
        return result;
    }

}

module.exports = AccessController;
