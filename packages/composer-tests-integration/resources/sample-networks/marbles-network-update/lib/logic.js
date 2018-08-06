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

/**
 * Trade a marble to a new player
 * @param  {org.hyperledger_composer.marbles.TradeMarble} tradeMarble - the trade marble transaction
 * @transaction
 */
async function tradeMarble(tradeMarble) {
    tradeMarble.marble.owner = tradeMarble.newOwner;
    const assetRegistry = await getAssetRegistry('org.hyperledger_composer.marbles.NewMarble');
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
    const assetRegistry = await getAssetRegistry('org.hyperledger_composer.marbles.NewMarble');
    await assetRegistry.update(marble);
    const receipt = getFactory().newConcept('org.hyperledger_composer.marbles', 'TradeReceipt');
    Object.assign(receipt, { marble, oldOwner, newOwner });
    return receipt;
}
