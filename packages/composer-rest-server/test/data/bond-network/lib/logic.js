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

/*eslint-disable no-unused-vars*/
/*eslint-disable no-undef*/
/*eslint-disable no-var*/

/**
 * Publish a new bond
 * @param {org.acme.bond.PublishBond} publishBond - the publishBond transaction
 * @transaction
 * @return {Promise} a promise when completed
 */
function publish(publishBond) {

    return getAssetRegistry('org.acme.bond.BondAsset')
        .then(function (registry) {
            var factory = getFactory();
            // Create the bond asset.
            var bondAsset = factory.newResource('org.acme.bond', 'BondAsset', publishBond.ISINCode);
            bondAsset.bond = publishBond.bond;
            // Add the bond asset to the registry.
            return registry.add(bondAsset);
        });
}

/**
 * Publish a new bond and return the concept response
 * @param {org.acme.bond.PublishBondReturnConcept} publishBondReturnConcept - the publishBondReturnConcept transaction
 * @returns {org.acme.bond.PublishBondResponse} response - The concept defining the structure of the response.
 * @transaction
 */
async function publishBondReturnConcept(publishBondReturnConcept) {

    const factory = getFactory();

    const bondRegistry = await getAssetRegistry('org.acme.bond.BondAsset');
    // Create the bond asset.
    let bondAsset = factory.newResource('org.acme.bond', 'BondAsset', publishBondReturnConcept.ISINCode);
    bondAsset.bond = publishBondReturnConcept.bond;
    // Add the bond asset to the registry.
    await bondRegistry.add(bondAsset);

    // Build the concept response
    let response = factory.newConcept('org.acme.bond', 'PublishBondResponse');
    response.ISINCode = publishBondReturnConcept.ISINCode;
    response.bondIssuer = publishBondReturnConcept.bond.issuer;
    return response;
}

/**
 * Publish a new bond and return the array of concept as response
 * @param {org.acme.bond.PublishBondReturnConceptArray} publishBondReturnConceptArray - the publishBondReturnConcept transaction
 * @returns {org.acme.bond.PublishBondResponse} response - The concept defining the structure of the response.
 * @transaction
 */
async function publishBondReturnConceptArray(publishBondReturnConceptArray) {

    const factory = getFactory();

    const bondRegistry = await getAssetRegistry('org.acme.bond.BondAsset');
    // Create the bond asset.
    let bondAsset = factory.newResource('org.acme.bond', 'BondAsset', publishBondReturnConceptArray.ISINCode);
    bondAsset.bond = publishBondReturnConceptArray.bond;
    // Add the bond asset to the registry.
    await bondRegistry.add(bondAsset);

    let response = [];
    let allBonds = await bondRegistry.getAll();
    allBonds.forEach(bond => {
        let bondConcept = factory.newConcept('org.acme.bond', 'PublishBondResponse');
        bondConcept.ISINCode = bond.ISINCode;
        bondConcept.bondIssuer = bond.bond.issuer;
        response.push(bondConcept);
    });
    return response;
}

/**
 * Publish a new bond and return the ISINCode
 * @param {org.acme.bond.PublishBondReturnString} publishBondReturnString - the publishBondReturnString transaction
 * @returns {string} (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/string)
 * @transaction
 */
async function publishBondReturnString(publishBondReturnString) {

    const factory = getFactory();

    const bondRegistry = await getAssetRegistry('org.acme.bond.BondAsset');
    // Create the bond asset.
    let bondAsset = factory.newResource('org.acme.bond', 'BondAsset', publishBondReturnString.ISINCode);
    bondAsset.bond = publishBondReturnString.bond;
    // Add the bond asset to the registry.
    await bondRegistry.add(bondAsset);

    // Build the response
    return publishBondReturnString.ISINCode;
}

/**
 * Publish a new bond and return the ISINCode
 * @param {org.acme.bond.PublishBondReturnStringArray} publishBondReturnStringArray - the publishBondReturnStringArray transaction
 * @returns {string[]} (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/string)
 * @transaction
 */
async function publishBondReturnStringArray(publishBondReturnStringArray) {

    const factory = getFactory();

    const bondRegistry = await getAssetRegistry('org.acme.bond.BondAsset');
    // Create the bond asset.
    let bondAsset = factory.newResource('org.acme.bond', 'BondAsset', publishBondReturnStringArray.ISINCode);
    bondAsset.bond = publishBondReturnStringArray.bond;
    // Add the bond asset to the registry.
    await bondRegistry.add(bondAsset);

    // Build the response
    return [publishBondReturnStringArray.ISINCode];
}

/**
 * Publish a new bond and return the ISINCode
 * @param {org.acme.bond.ExistsBond} existsBond - the existsBond transaction
 * @returns {Boolean} - True if bond exists, False otherwise
 * @transaction
 */
async function existsBond(existsBond) {

    const factory = getFactory();

    const bondRegistry = await getAssetRegistry('org.acme.bond.BondAsset');

    // Get the bond from the bondRegistry
    let bondAsset = bondRegistry.get(existsBond.ISINCode);

    // Return true if bond exists
    return !!bondAsset;
}

/**
 * Publish a new bond
 * @param {org.acme.bond.EmitBondEvent} emitBondEvent - the publishBond transaction
 * @transaction
 */
function bondEventEmitter(emitBondEvent) {
    var factory = getFactory();
    var bondEvent = factory.newEvent('org.acme.bond', 'BondEvent');
    bondEvent.prop1 = 'foo';
    bondEvent.prop2 = 'bar';
    emit(bondEvent);
}

/**
 * Publish a new bond
 * @param {org.acme.bond.EmitMultipleBondEvents} emitMultipleBondEvents - the publishBond transaction
 * @transaction
 */
function multipleBondEventEmitter(emitMultipleBondEvents) {
    var factory = getFactory();
    var bondEvent = factory.newEvent('org.acme.bond', 'BondEvent');
    bondEvent.prop1 = 'foo';
    bondEvent.prop2 = 'bar';
    emit(bondEvent);
    bondEvent = factory.newEvent('org.acme.bond', 'BondEvent');
    bondEvent.prop1 = 'rah';
    bondEvent.prop2 = 'car';
    emit(bondEvent);
    bondEvent = factory.newEvent('org.acme.bond', 'BondEvent');
    bondEvent.prop1 = 'zoo';
    bondEvent.prop2 = 'moo';
    emit(bondEvent);
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/
