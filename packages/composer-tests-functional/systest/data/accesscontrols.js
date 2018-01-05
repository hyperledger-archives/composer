'use strict';

/**
 * Test that the specified asset is owned by the specified participant.
 * @param {Resource} asset The asset.
 * @param {Resource} participant The participant.
 * @return {boolean} True if yes, false if no.
 */
function testOwnership(asset, participant) {
    return asset.owner.getIdentifier() === participant.getIdentifier();
}

/**
 * Test that the specified participants are the same.
 * @param {Resource} participant1 The first participant.
 * @param {Resource} participant2 The second participant.
 * @return {boolean} True if yes, false if no.
 */
function participantsAreEqual(participant1, participant2) {
    return participant1.getIdentifier() === participant2.getIdentifier();
}

/**
 * Handle the sample transaction.
 * @param {systest.accesscontrols.SampleTransaction} transaction The transaction
 * @transaction
 */
function handleSampleTransaction(transaction) {
    if (getCurrentParticipant().getFullyQualifiedIdentifier() !== 'systest.identities.SampleParticipant#bob@uk.ibm.com') {
        throw new Error('wrong participant');
    }
}

/**
 * basic update transactions
 * @param {systest.accesscontrols.UpdateAssetValue} transaction The transaction
 * @transaction
 */
function update(transaction) {
    transaction.theAsset.theValue = transaction.newValue;

    return getAssetRegistry('systest.accesscontrols.txAsset')
        .then(function(registry){
            return registry.update(transaction.theAsset);
        });
}

/**
 * check answer
 * @param {systest.accesscontrols.MarkQuestion} transaction The transaction
 * @transaction
 */
function MarkQuestion(transaction) {
    console.log('...marking question now.....'+transaction.text);
    if (transaction.question.correctAnswer.text === transaction.text){
        // all good
    } else {
        throw new Error('uh-oh');
    }
}