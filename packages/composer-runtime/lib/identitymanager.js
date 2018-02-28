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

const createHash = require('sha.js');
const { Certificate, Logger } = require('composer-common');
const TransactionHandler = require('./transactionhandler');
const LOG = Logger.getLog('IdentityManager');


/**
 * A class for managing and persisting identities.
 * @protected
 */
class IdentityManager extends TransactionHandler {

    /**
     * Constructor.
     * @param {Context} context The request context.
     */
    constructor(context) {
        super();
        this.identityService = context.getIdentityService();
        this.registryManager = context.getRegistryManager();
        this.factory = context.getFactory();
        this.bind('org.hyperledger.composer.system.IssueIdentity', this.issueIdentity);
        this.bind('org.hyperledger.composer.system.BindIdentity', this.bindIdentity);
        this.bind('org.hyperledger.composer.system.ActivateCurrentIdentity', this.activateCurrentIdentity);
        this.bind('org.hyperledger.composer.system.RevokeIdentity', this.revokeIdentity);
    }

    /**
     * Get the identity registry.
     * @return {Promise} A promise that will be resolved with an {@link Registry}
     * when complete, or rejected with an error.
     */
    getIdentityRegistry() {
        const method = 'getIdentityRegistry';
        LOG.entry(method);
        return this.registryManager.get('Asset', 'org.hyperledger.composer.system.Identity')
            .then((identityRegistry) => {
                LOG.exit(method, identityRegistry);
                return identityRegistry;
            });
    }


    /**
     * Find the identity in the identity registry that maps to the certificate that
     * was used to sign and submit the current transaction.
     * @return {Promise} A promise that will be resolved with a {@link Resource}
     * when complete, or rejected with an error.
     */
    getIdentity() {
        const method = 'getIdentity';
        LOG.entry(method);
        let identityRegistry, identifier, identityName;
        return this.getIdentityRegistry()
            .then((identityRegistry_) => {

                // Check to see if the identity exists.
                identityRegistry = identityRegistry_;
                identifier = this.identityService.getIdentifier();
                return identityRegistry.get(identifier)
                .catch(() => {
                    return null;
                });
            })
            .then((identity) => {

                // If it doesn't exist, then try again with the temporary identifier, which is hash(name, issuer).
                if (!identity) {
                    const sha256 = createHash('sha256');
                    const name = this.identityService.getName();
                    const issuer = this.identityService.getIssuer();
                    sha256.update(name, 'utf8');
                    sha256.update(issuer, 'utf8');
                    identifier = sha256.digest('hex');
                    return identityRegistry.get(identifier)
                    .catch(() => {
                        return null;
                    });
                } else {
                    return identity;
                }
            })
            .then((identity) => {

                // If it still doesn't exist, throw!
                if (!identity) {
                    identifier = this.identityService.getIdentifier();
                    identityName = this.identityService.getName();
                    const error = new Error(`The current identity, with the name '${identityName}' and the identifier '${identifier}', has not been registered`);
                    error.identityName = identityName;
                    LOG.error(method, error);
                    throw error;
                }

                // Return the identity.
                LOG.exit(method, identity);
                return identity;
            });
    }

    /**
     * Validate the specified identity to confirm that it is valid for use with the
     * business network. We validate that the identity is not revoked, pending activation,
     * or in an invalid state.
     * @param {Resource} identity The identity to validate.
     */
    validateIdentity(identity) {
        const method = 'validateIdentity';
        LOG.entry(method, identity);

        // Check for a revoked identity.
        if (identity.state === 'REVOKED') {
            const error = new Error(`The current identity, with the name '${identity.name}' and the identifier '${identity.getIdentifier()}', has been revoked`);
            LOG.error(method, error);
            throw error;
        }

        // Check for an issued or bound identity, in which case activation is required.
        if (identity.state === 'ISSUED' || identity.state === 'BOUND') {
            const error = new Error(`The current identity, with the name '${identity.name}' and the identifier '${identity.getIdentifier()}', must be activated (ACTIVATION_REQUIRED)`);
            error.activationRequired = true;
            LOG.error(method, error);
            throw error;
        }

        // Ensure that the identity is activated.
        if (identity.state !== 'ACTIVATED') {
            const error = new Error(`The current identity, with the name '${identity.name}' and the identifier '${identity.getIdentifier()}', is in an unknown state '${identity.state}'`);
            LOG.error(method, error);
            throw error;
        }

        LOG.exit(method);
    }

    /**
     * Find the participant for the specified identity.
     * @param {Resource} identity The identity to find the participant for.
     * @return {Promise} A promise that will be resolved with a {@link Resource}
     * when complete, or rejected with an error.
     */
    getParticipant(identity) {
        const method = 'getParticipant';
        LOG.entry(method);
        const participant = identity.participant;
        const participantFQT = participant.getFullyQualifiedType();
        return this.registryManager.get('Participant', participantFQT)
            .then((participantRegistry) => {
                return participantRegistry.get(participant.getIdentifier());
            })
            .then((participant) => {
                LOG.exit(method, participant);
                return participant;
            })
            .catch(() => {
                const error = new Error(`The current identity, with the name '${identity.name}' and the identifier '${identity.getIdentifier()}', is bound to a participant '${participant.toURI()}' that does not exist`);
                LOG.error(method, error);
                throw error;
            });
    }

    /**
     * Issue a new identity to a participant in the business network.
     * @param {Api} api The API to use.
     * @param {org.hyperledger.composer.system.IssueIdentity} transaction The transaction.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    issueIdentity(api, transaction) {
        const method = 'issueIdentity';
        LOG.entry(method, api, transaction);
        return this.getIdentityRegistry()
            .then((identityRegistry) => {

                // Create the temporary identifier, which is hash(name, issuer)
                const sha256 = createHash('sha256');
                const issuer = this.identityService.getIssuer();
                sha256.update(transaction.identityName, 'utf8');
                sha256.update(issuer, 'utf8');
                const identifier = sha256.digest('hex');

                // Create the new identity and add it to the identity registry.
                const identity = this.factory.newResource('org.hyperledger.composer.system', 'Identity', identifier);
                Object.assign(identity, {
                    name: transaction.identityName,
                    issuer,
                    certificate: '',
                    state: 'ISSUED',
                    participant: transaction.participant
                });
                return identityRegistry.add(identity, { convertResourcesToRelationships: true });

            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Bind an existing identity to a participant in the business network.
     * @param {Api} api The API to use.
     * @param {org.hyperledger.composer.system.BindIdentity} transaction The transaction.
     */
    async bindIdentity(api, transaction) {
        const method = 'bindIdentity';
        LOG.entry(method, api, transaction);

        // Parse the certificate into a byte array.
        const { participant, certificate } = transaction;
        const certificateObj = new Certificate(certificate);
        const identifier = certificateObj.getIdentifier();
        const name = certificateObj.getName();
        const issuer = certificateObj.getIssuer();

        // Create the new identity and add it to the identity registry.
        const identity = this.factory.newResource('org.hyperledger.composer.system', 'Identity', identifier);
        Object.assign(identity, {
            name,
            issuer,
            certificate,
            state: 'BOUND',
            participant
        });
        const identityRegistry = await this.getIdentityRegistry();
        await identityRegistry.add(identity, { convertResourcesToRelationships: true });

        LOG.exit(method);
    }

    /**
     * Activate the current identity in the business network.
     * @param {Api} api The API to use.
     * @param {org.hyperledger.composer.system.ActivateCurrentIdentity} transaction The transaction.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    activateCurrentIdentity(api, transaction) {
        const method = 'activateCurrentIdentity';
        LOG.entry(method, api, transaction);
        let identityRegistry;
        return this.getIdentityRegistry()
            .then((identityRegistry_) => {
                identityRegistry = identityRegistry_;
                return this.getIdentity();
            })
            .then((identity) => {

                // If the identity has been issued, we must delete it and then create a new one.
                if (identity.state === 'ISSUED') {
                    return this.activateIssuedIdentity(identityRegistry, identity);
                }

                // If the identity has been bound, then we can update it.
                if (identity.state === 'BOUND') {
                    return this.activateBoundIdentity(identityRegistry, identity);
                }

                // Shouldn't get here.
                throw new Error(`The current identity, with the name '${identity.name}' and the identifier '${identity.getIdentifier()}', cannot be activated because it is in an unknown state '${identity.state}'`);

            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Activate the specified identity (in the ISSUED state) in the business network.
     * @param {Registry} identityRegistry The identity registry.
     * @param {Resource} identity The identity to activate.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    activateIssuedIdentity(identityRegistry, identity) {
        const method = 'activateIssuedIdentity';
        LOG.entry(method, identityRegistry, identity);

        // Grab information from the certificate.
        const identifier = this.identityService.getIdentifier();
        const name = this.identityService.getName();
        const issuer = this.identityService.getIssuer();
        const certificate = this.identityService.getCertificate();

        // Validate the issuer to check it matches the issuer of the identity.
        if (identity.issuer !== issuer) {
            throw new Error(`The current identity, with the name '${identity.name}' and the identifier '${identity.getIdentifier()}', cannot be activated because the issuer is invalid`);
        }

        // Create the new identity.
        const newIdentity = this.factory.newResource('org.hyperledger.composer.system', 'Identity', identifier);
        Object.assign(newIdentity, {
            name,
            issuer,
            certificate,
            state: 'ACTIVATED',
            participant: identity.participant
        });

        // Remove the old identity and add the new identity into the identity registry.
        return identityRegistry.remove((identity))
            .then(() => {
                return identityRegistry.add(newIdentity);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Activate the specified identity (in the BOUND state) in the business network.
     * @param {Registry} identityRegistry The identity registry.
     * @param {Resource} identity The identity to activate.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    activateBoundIdentity(identityRegistry, identity) {
        const method = 'activateBoundIdentity';
        LOG.entry(method, identityRegistry, identity);

        // Grab information from the certificate.
        const name = this.identityService.getName();
        const issuer = this.identityService.getIssuer();

        // Update the identity and update it in the identity registry.
        Object.assign(identity, {
            name,
            issuer,
            state: 'ACTIVATED'
        });
        return identityRegistry.update(identity)
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Revoke an identity in the business network.
     * @param {Api} api The API to use.
     * @param {org.hyperledger.composer.system.RevokeIdentity} transaction The transaction.
     * @return {Promise} A promise that will be resolved when complete, or rejected
     * with an error.
     */
    revokeIdentity(api, transaction) {
        const method = 'revokeIdentity';
        LOG.entry(method, api, transaction);
        return this.getIdentityRegistry()
            .then((identityRegistry) => {

                // Ensure the identity is not already revoked.
                if (transaction.identity.state === 'REVOKED') {
                    throw new Error('The specified identity has already been revoked');
                }

                // Revoke the identity and update it in the identity registry.
                Object.assign(transaction.identity, {
                    state: 'REVOKED'
                });
                return identityRegistry.update(transaction.identity, { convertResourcesToRelationships: true });

            })
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = IdentityManager;
