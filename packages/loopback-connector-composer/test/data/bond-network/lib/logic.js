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