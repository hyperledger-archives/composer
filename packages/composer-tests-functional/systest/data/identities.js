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