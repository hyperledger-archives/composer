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

/* eslint-disable no-unused-vars*/
/* eslint-disable no-undef*/
/* eslint-disable func-names*/
/* eslint-disable no-var*/

/**
 * Sample transaction processor function.
 * @param {org.acme.sample.SampleTransaction} sampleTransaction - the transaction to be processed
 * @transaction
 * @return {Promise} a promise to the results of transaction processing
 */
function onSampleTransaction(sampleTransaction) {
    sampleTransaction.asset.value = sampleTransaction.newValue;

    return getAssetRegistry('org.acme.sample.SampleAsset')
      .then(function (assetRegistry) {
          return assetRegistry.update(sampleTransaction.asset);
      });
}

/**
 * Handle a POST transaction, calling OpenWhisk
 * @param {org.acme.sample.PostTransaction} postTransaction - the transaction to be processed
 * @transaction
 * @return {Promise} a promise that resolves when transaction processing is complete
 */
function handlePost(postTransaction) {
    var url = 'https://composer-node-red.mybluemix.net/compute';

    return post( url, postTransaction)
      .then(function (result) {
        // alert(JSON.stringify(result));
          postTransaction.asset.value = 'Count is ' + result.body.sum;
          return getAssetRegistry('org.acme.sample.SampleAsset')
          .then(function (assetRegistry) {
              return assetRegistry.update(postTransaction.asset);
          });
      });
}

/**
 * Create an asset
 * @param {org.acme.sample.CreateAsset} createAsseTransaction - the transaction to be processed
 * @return {Promise} a promise that resolves when transaction processing is complete
 * @transaction
 */
function createAsset(createAsseTransaction) {
    return getAssetRegistry('org.acme.sample.SampleAsset')
          .then(function (assetRegistry) {
              print( '**** creating asset ' + createAsseTransaction.assetId );
              var asset = getFactory().newResource('org.acme.sample', 'SampleAsset', createAsseTransaction.assetId);
              asset.value = 'Initialized';
              return assetRegistry.add(asset);
          });
}
