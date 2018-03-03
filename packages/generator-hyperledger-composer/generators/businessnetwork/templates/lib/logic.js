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
 * Write your transction processor functions here
 */

/**
 * Sample transaction
 * @param {<%= namespace%>.ChangeAssetValue} changeAssetValue
 * @transaction
 */
async function onChangeAssetValue(changeAssetValue) {
    let id = changeAssetValue.relatedAsset.assetId;
    let assetRegistry = await getAssetRegistry('<%= namespace%>.SampleAsset');
    let asset = await assetRegistry.get(id);
    asset.value = changeAssetValue.newValue;
    await assetRegistry.update(asset);
}
