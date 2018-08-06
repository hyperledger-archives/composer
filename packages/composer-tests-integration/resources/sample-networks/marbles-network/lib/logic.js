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
 * Trade a marble to a new player
 * @param  {org.hyperledger_composer.marbles.TradeMarble} tradeMarble - the trade marble transaction
 * @transaction
 */
async function tradeMarble(tradeMarble) {
    tradeMarble.marble.owner = tradeMarble.newOwner;
    const assetRegistry = await getAssetRegistry('org.hyperledger_composer.marbles.Marble');
    await assetRegistry.update(tradeMarble.marble);
}

/**
 * Trade a marble to a new player and produce a receipt
 * @param  {org.hyperledger_composer.marbles.TradeMarbleWithReceipt} tradeMarble - the trade marble transaction
 * @returns {org.hyperledger_composer.marbles.TradeReceipt} receipt
 * @transaction
 */
async function tradeMarbleWithReceipt(tradeMarble) {
    const marble = tradeMarble.marble;
    const oldOwner = marble.owner;
    const newOwner = tradeMarble.newOwner;
    marble.owner = newOwner;
    const assetRegistry = await getAssetRegistry('org.hyperledger_composer.marbles.Marble');
    await assetRegistry.update(marble);
    const receipt = getFactory().newConcept('org.hyperledger_composer.marbles', 'TradeReceipt');
    Object.assign(receipt, { marble, oldOwner, newOwner });
    return receipt;
}

/**
 * Get all marbles from all business networks
 * @param  {org.hyperledger_composer.marbles.GetAllMarbles} transaction The transaction.
 * @return {org.hyperledger_composer.marbles.Marble[]} All marbles.
 * @transaction
 */
async function getAllMarbles(transaction) {
    const allMarbles = [];
    const assetRegistry = await getAssetRegistry('org.hyperledger_composer.marbles.Marble');
    const marbles = await assetRegistry.getAll();
    for (const marble of marbles) {
        allMarbles.push(marble);
    }
    const businessNetworkNames = [/* 'marbles-network-1', */ 'marbles-network-2', 'marbles-network-3', 'marbles-network-4'];
    for (const businessNetworkName of businessNetworkNames) {
        const response = await getNativeAPI().invokeChaincode(businessNetworkName, ['getAllResourcesInRegistry', 'Asset', 'org.hyperledger_composer.marbles.Marble'], 'composerchannel');
        const jsonString = response.payload.toString('utf8');
        const json = JSON.parse(jsonString);
        for (const item of json) {
            allMarbles.push(getSerializer().fromJSON(item));
        }
    }
    return allMarbles;
}
