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
 * Sample transaction processor function.
 */
function onSampleTransaction(sampleTransaction) {
    var oldValue = sampleTransaction.asset.value;
    sampleTransaction.asset.value = sampleTransaction.newValue;
    return getAssetRegistry('org.acme.sample.SampleAsset')
        .then(function (assetRegistry) {
            return assetRegistry.update(sampleTransaction.asset);
        })
        .then(function () {
            var event = getFactory().newEvent('org.acme.sample', 'SampleEvent');
            event.assetId = sampleTransaction.asset.assetId;
            event.oldValue = oldValue;
            event.newValue = sampleTransaction.newValue;
            emit(event);
        });
}
