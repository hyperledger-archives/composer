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

const url = 'http://%GATEWAY%/api';

/**
 * Handle a basic transaction.
 * @param {systest.transactions.http.Basic} tx The transaction.
 * @transaction
 */
async function handleBasic(tx) {

    // Try the shortcut method first.
    const data1 = await request[tx.method.toLowerCase()](`${url}/basic`);
    if (tx.method !== 'HEAD') {
        assert.equal(data1, `{"method":"${tx.method}"}`);
    }

    // Then try the normal method.
    const data2 = await request({ uri: `${url}/basic`, method: tx.method, json: true });
    if (tx.method !== 'HEAD') {
        assert.equal(data2.method, tx.method);
    }

}

/**
 * Handle an error transaction.
 * @param {systest.transactions.http.Error} tx The transaction.
 * @transaction
 */
async function handleError(tx) {
    try {
        await request({ uri: `${url}/error`, method: tx.method, json: true });
        throw new Error('should not get here');
    } catch (e) {
        if (tx.method !== 'HEAD') {
            assert.deepEqual(e.error, { method: tx.method, error: 'such error' });
        } else {
            assert.equal(e.statusCode, 500);
        }
    }
}

/**
 * Handle an asset in transaction by using the serializer.
 * @param {systest.transactions.http.AssetInWithSerializer} tx The transaction.
 * @transaction
 */
async function handleAssetInWithSerializer(tx) {
    const factory = getFactory();
    const asset = factory.newResource('systest.transactions.http', 'DummyAsset', '1234');
    asset.stringValue = 'hello world';
    asset.integerValue = 12345678;
    const serializer = getSerializer();
    const json = serializer.toJSON(asset);
    const data = await request({ uri: `${url}/assetin`, method: tx.method, json });
    assert.equal(data.method, tx.method);
}

/**
 * Handle an asset in transaction without using the serializer.
 * @param {systest.transactions.http.AssetInWithoutSerializer} tx The transaction.
 * @transaction
 */
async function handleAssetInWithoutSerializer(tx) {
    const factory = getFactory();
    const asset = factory.newResource('systest.transactions.http', 'DummyAsset', '1234');
    asset.stringValue = 'hello world';
    asset.integerValue = 12345678;
    const data = await request({ uri: `${url}/assetin`, method: tx.method, json: asset });
    assert.equal(data.method, tx.method);
}

/**
 * Handle an asset with a relationship in transaction without using the serializer.
 * @param {systest.transactions.http.AssetWithRelationshipInWithoutSerializer} tx The transaction.
 * @transaction
 */
async function handleAssetWithRelationshipInWithoutSerializer(tx) {
    const factory = getFactory();
    const participant = factory.newResource('systest.transactions.http', 'DummyParticipant', '1234');
    participant.stringValue = 'hello world';
    const participantRegistry = await getParticipantRegistry('systest.transactions.http.DummyParticipant');
    await participantRegistry.add(participant);
    const asset = factory.newResource('systest.transactions.http', 'DummyAsset', '1234');
    asset.stringValue = 'hello world';
    asset.integerValue = 12345678;
    asset.participant = factory.newRelationship('systest.transactions.http', 'DummyParticipant', '1234');
    const data = await request({ uri: `${url}/assetwithrelationshipin`, method: tx.method, json: asset });
    assert.equal(data.method, tx.method);
}

/**
 * Handle an asset with a resolved relationship in transaction without using the serializer.
 * @param {systest.transactions.http.AssetWithResolvedRelationshipInWithoutSerializer} tx The transaction.
 * @transaction
 */
async function handleAssetWithResolvedRelationshipInWithoutSerializer(tx) {
    const data = await request({ uri: `${url}/assetwithresolvedrelationshipin`, method: tx.method, json: tx.asset });
    assert.equal(data.method, tx.method);
}

/**
 * Handle an asset out transaction.
 * @param {systest.transactions.http.AssetOut} tx The transaction.
 * @transaction
 */
async function handleAssetOut(tx) {
    const data = await request({ uri: `${url}/assetout`, method: tx.method, json: true });
    assert.equal(data.method, tx.method);
    const serializer = getSerializer();
    const asset = serializer.fromJSON(data.asset);
    assert.equal(asset.assetId, '1234');
    assert.equal(asset.stringValue, 'hello world');
    assert.equal(asset.integerValue, 12345678);
}