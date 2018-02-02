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
