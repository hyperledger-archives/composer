'use strict';

/**
 * Handle the sample transaction.
 * @param {systest.identities.TestGetCurrentParticipant} transaction The transaction
 * @transaction
 */
function onTestGetCurrentParticipant(transaction) {
    if (getCurrentParticipant().getFullyQualifiedIdentifier() !== 'systest.identities.SampleParticipant#bob@uk.ibm.com') {
        throw new Error('wrong participant');
    }
}

/**
 * Handle the sample transaction.
 * @param {systest.identities.TestGetCurrentIdentity} transaction The transaction
 * @transaction
 */
function onTestGetCurrentIdentity(transaction) {
    const identity = getCurrentIdentity();
    if (identity.participant.getFullyQualifiedIdentifier() !== 'systest.identities.SampleParticipant#bob@uk.ibm.com') {
        throw new Error('wrong identity');
    }
}