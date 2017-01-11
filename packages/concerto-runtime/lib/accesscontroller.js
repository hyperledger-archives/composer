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

const AccessException = require('./accessexception');
const Logger = require('@ibm/concerto-common').Logger;

const LOG = Logger.getLog('AccessController');

/**
 * A class that manages access to registries and resources by processing
 * the access control list(s) in a business network definition.
 * @private
 * @class
 * @memberof module:ibm-concerto-runtime
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
        LOG.exit(method);
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
    check(resource, access, participant) {
        const method = 'check';
        LOG.entry(method, resource.getFullyQualifiedIdentifier(), access, participant.getFullyQualifiedIdentifier());
        try {

            // Iterate over the ACL rules in order, but stop at the first rule
            // that permits the action.
            let aclRules = this.aclManager.getAclRules();
            let result = aclRules.some((aclRule) => {
                return this.checkRule(resource, access, participant, aclRule);
            });

            // If a ACL rule permitted the action, return.
            if (result) {
                LOG.exit(method);
                return;
            }

            // Otherwise no ACL rule permitted the action.
            throw new AccessException(resource, access, participant);

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
     * @param {AclRule} aclRule The ACL rule.
     * @returns {boolean} True if the specified ACL rule permits
     * the specified level of access to the specified resource.
     */
    checkRule(resource, access, participant, aclRule) {
        const method = 'checkRule';
        LOG.entry(method, participant.getFullyQualifiedIdentifier(), resource, access, participant, aclRule);

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

        // Is the predicate met?
        if (!this.matchPredicate(resource, access, participant, aclRule)) {
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
        let e = new AccessException(resource, access, participant);
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
        let result = false;
        let verb = aclRule.getVerb();
        if (verb === 'ALL' || access === verb) {
            result = true;
        }

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

        // Determine the input fully qualified name and ID.
        let ns = participant.getNamespace();
        let fqn = participant.getFullyQualifiedType();
        let id = participant.getIdentifier();

        // Check to see if the fully qualified name matches.
        let reqFQN = reqParticipant.getFullyQualifiedName();
        if (fqn === reqFQN) {
            // Participant is matching fully qualified type.
        } else if (ns === reqFQN) {
            // Participant is matching namespace.
        } else {
            // Participant does not match.
            LOG.exit(method, false);
            return false;
        }

        // Check to see if the identifier matches (if specified).
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
     * Check that the specified participant has the specified
     * level of access to the specified resource.
     * @param {Resource} resource The resource.
     * @param {string} access The level of access.
     * @param {Resource} participant The participant.
     * @param {AclRule} aclRule The ACL rule.
     * @returns {boolean} True if the specified ACL rule permits
     * the specified level of access to the specified resource.
     */
    matchPredicate(resource, access, participant, aclRule) {
        const method = 'matchPredicate';
        LOG.entry(method, resource.getFullyQualifiedIdentifier(), access, participant.getFullyQualifiedIdentifier(), aclRule);

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

        // Compile and execute the function.
        let result;
        try {
            LOG.debug(method, 'Compiling and executing function', source, argNames, argValues);
            let func = new Function(argNames.join(','), source);
            result = func.apply(null, argValues);
        } catch (e) {
            LOG.error(method, e);
            throw new AccessException(resource, access, participant);
        }

        // Convert the result into a boolean before returning it.
        result = !!result;
        LOG.exit(method, result);
        return result;
    }

}

module.exports = AccessController;
