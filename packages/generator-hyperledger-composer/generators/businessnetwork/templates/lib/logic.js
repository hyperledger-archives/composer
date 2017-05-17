'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Sample transaction
 * @param {<%= namespace%>.ChangeAssetValue} changeAssetValue
 * @transaction
 */
function onChangeAssetValue(changeAssetValue) {
    var assetRegistry;
    var id = changeAssetValue.relatedAsset.assetId;
    var value = changeAssetValue.relatedAsset.newValue;
    return getAssetRegistry('<%= namespace%>.Asset')
    .then(function(ar) {
        assetRegistry = ar;
        return assetRegistry.get(id)
    })
    .then(function(asset) {
        asset.value = changeAssetValue.newValue;
        return assetRegistry.update(asset);
    });
}