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
const ModelUtil = require('composer-common').ModelUtil;

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
     * @param {Context} context The transaction context.
     */
    constructor(context) {
        const method = 'constructor';
        LOG.entry(method, context);
        this.context = context;
        this.participant = null;
        this.transaction = null;
        this.aclRuleStack=[];
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
     * @return {Promise} A promise that is resolved if the specified
     * participant has the specified level of access to the specified
     * resource, or rejected otherwise.
     */
    check(resource, access) {
        const method = 'check';
        LOG.entry(method, resource.getFullyQualifiedIdentifier(), access);
        const t0 = Date.now();

        // Check to see if a participant has been set. If not, then ACL
        // enforcement is not enabled.
        let participant = this.participant;
        if (!participant) {
            LOG.perf(method, 'NO PARTICIPANT: Total (ms) duration: ', this.context.getContextId(), t0);
            LOG.exit(method);
            return Promise.resolve();
        }

        // Grab the transaction. Does not matter if this is null.
        let transaction = this.transaction;

        // Check to see if an ACL file was supplied. If not, then ACL
        // enforcement is not enabled.
        let aclManager = this.context.getAclManager();
        if (!aclManager.getAclFile()) {
            LOG.perf(method, 'NO ACL FILE: Total (ms) duration: ', this.context.getContextId(), t0);
            LOG.exit(method);
            return Promise.resolve();
        }

        // Filter the list of ACL rules into ones that it could be.
        let aclRules = aclManager.getAclRules();
        let filteredAclRules = aclRules.filter((aclRule) => {
            return this.matchRule(resource, access, participant, transaction, aclRule);
        });

        // Iterate over the ACL rules in order, but stop at the first rule
        // that permits the action.
        return filteredAclRules.reduce((promise, aclRule,currentIndex) => {
            LOG.debug(`Processing rule ${aclRule.getName()}, index ${currentIndex} `);
            return promise.then((result) => {
                if (result) {
                    return result;
                }
                LOG.debug(method, 'Processing rule', aclRule);
                let value = this.checkRule(resource, access, participant, transaction, aclRule);
                LOG.debug(method, 'Processed rule', value);
                return value;
            });
        }, Promise.resolve(false))
            .then((result) => {

                // If a ACL rule permitted the action, return.
                if (result) {
                    LOG.exit(method);
                    LOG.perf(method, 'Total (ms) duration: ', this.context.getContextId(), t0);
                    return;
                }

                // Otherwise no ACL rule permitted the action.
                throw new AccessException(resource, access, participant, transaction);

            })
            .catch((error) => {
                LOG.error(method, error);
                LOG.perf(method, 'Total (ms) duration: ', this.context.getContextId(), t0);
                throw error;
            });
    }

    /**
     * Match the specified ACL rule, returning true if the rule is a match,
     * and false otherwise.
     * @param {Resource} resource The resource.
     * @param {string} access The level of access.
     * @param {Resource} participant The participant.
     * @param {Resource} transaction The transaction.
     * @param {AclRule} aclRule The ACL rule to filter.
     * @return {boolean} True if the rule is a match, and false otherwise.
     */
    matchRule(resource, access, participant, transaction, aclRule) {
        const method = 'matchRule';
        LOG.entry(method, resource, access, participant, transaction, aclRule);

        // Is the ACL rule relevant to the specified verb?
        if (!this.matchVerb(access, aclRule)) {
            LOG.debug(method, 'Verb does not match');
            LOG.exit(method, false);
            return false;
        }

        // Is the ACL rule relevant to the specified noun?
        if (!this.matchNoun(resource, aclRule)) {
            LOG.debug(method, 'Noun does not match');
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

        LOG.exit(method, true);
        return true;
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
        let pid='',tx='';
        if (participant){
            pid = participant.getFullyQualifiedIdentifier();
        }
        if (transaction){
            tx = transaction.getFullyQualifiedIdentifier();
        }
        let checkId = `${aclRule.getName()}/${access}/${pid}/${tx}/`;
        if (this.aclRuleStack.includes(checkId)){
            this.aclRuleStack=[];

            // This must be an explicit deny rule, so throw.
            let e = new Error('Cyclic ACL Rule detected, rule condition is invoking the same rule');
            LOG.error(method, e);
            this.aclRuleStack=[];
            return Promise.reject(e);
        }
        this.aclRuleStack.push(checkId);

        // Is the predicate met?
        return this.matchPredicate(resource, participant, transaction, aclRule)
            .then((result) => {

                // pop...
                this.aclRuleStack.pop();

                // No, predicate not met.
                if (!result) {
                    LOG.debug(method, 'Predicate does not match');
                    LOG.exit(method, false);
                    return false;
                }

                // Yes, predicate met, is this an allow or deny rule?
                if (aclRule.getAction() === 'ALLOW') {
                    LOG.exit(method, true);
                    return true;
                }

                // This must be an explicit deny rule, so throw.
                let e = new AccessException(resource, access, participant, transaction);
                LOG.error(method, e);
                this.aclRuleStack=[];
                throw e;

            });

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

        // Determine the input ID.
        let id = resource.getIdentifier();

        // Check to see if the resource is an instance of the
        // required resource type, or is in the required
        // namespace.
        let noun = aclRule.getNoun();
        let reqFQN = noun.getFullyQualifiedName();

        if (noun.hasWildcard()) {
            if (!ModelUtil.isMatchingType(resource, reqFQN)) {
                LOG.exit(method, false);
                return false;
            }
        } else if (!resource.instanceOf(reqFQN)) {
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
        let reqFQN = reqParticipant.getFullyQualifiedName();

        if (reqParticipant.hasWildcard()) {
            if (!ModelUtil.isMatchingType(participant, reqFQN)) {
                LOG.exit(method, false);
                return false;
            }
        } else if (!participant.instanceOf(reqFQN)) {
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
        let reqFQN = reqTransaction.getFullyQualifiedName();

        if (reqTransaction.hasWildcard()) {
            if (!ModelUtil.isMatchingType(transaction, reqFQN)) {
                LOG.exit(method, false);
                return false;
            }
        } else if (!transaction.instanceOf(reqFQN)) {
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
     * @param {Resource} participant The participant.
     * @param {Resource} transaction The transaction.
     * @param {AclRule} aclRule The ACL rule.
     * @returns {Promise} A promise that will be resolved with true if the specified ACL rule permits
     * the specified level of access to the specified resource, or false otherwise.
     */
    matchPredicate(resource, participant, transaction, aclRule) {
        const method = 'matchPredicate';
        LOG.entry(method, resource, participant, transaction, aclRule);

        // shortcut evaluation if simple boolean predicate
        if (aclRule.getPredicate().getExpression() === 'true') {
            LOG.exit(method, true);
            return Promise.resolve(true);
        } else if (aclRule.getPredicate().getExpression() === 'false') {
            LOG.exit(method, false);
            return Promise.resolve(false);
        }

        // We want to permit access to related assets and participants, so prepare the resources.
        const compiledAclBundle = this.context.getCompiledAclBundle();
        const resolver = this.context.getResolver();
        let resolverPromise = Promise.resolve(), resolverCallbackCalled = false;
        const resolverCallback = (resolverPromise_) => {
            LOG.debug(method, 'Got resolver callback');
            resolverCallbackCalled = true;
            resolverPromise = resolverPromise.then(() => {
                return resolverPromise_;
            });
        };
        let preparedResource, preparedParticipant, preparedTransaction;
        return Promise.resolve()
            .then(() => {

                // We should always have a resource to prepare.
                return resolver.prepare(resource, resolverCallback);

            })
            .then((preparedResource_) => {

                // Save the prepared resource.
                preparedResource = preparedResource_;

                // We should always have a participant to prepare.
                return resolver.prepare(participant, resolverCallback);

            })
            .then((preparedParticipant_) => {

                // Save the prepared participant.
                preparedParticipant = preparedParticipant_;

                // We may not have a transaction to prepare.
                if (transaction) {
                    return resolver.prepare(transaction, resolverCallback);
                }

            })
            .then((preparedTransaction_) => {

                // Save the prepared transaction.
                preparedTransaction = preparedTransaction_;

                // Now all the resources are prepared, loop until we are no longer resolving anything.
                const iteration = () => {
                    LOG.debug(method, 'Executing compiled ACL predicate');
                    resolverCallbackCalled = false;
                    const result = compiledAclBundle.execute(aclRule, preparedResource, preparedParticipant, preparedTransaction);
                    if (resolverCallbackCalled) {
                        return resolverPromise.then(() => {
                            return iteration();
                        });
                    } else {
                        return result;
                    }
                };
                return iteration();

            })
            .then((result) => {

                // Return the result, which should be a boolean.
                LOG.exit(method, result);
                return result;

            });
    }

}

module.exports = AccessController;
