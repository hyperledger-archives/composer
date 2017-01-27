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


/**
 * Get the Animals, but do not resolve contained relationships
 * @query
 * @param {String} farmerId - the email of the farmer
 * @returns {Animal[]} - the animals that belong to the farmer
*/
function findAnimalsByOwnerId(farmerId) {
    return query('select a from Animal a where a.owner == :farmerId');
}

/**
 * Get the Animals, but and selectively resolve relationships
 * @query
 * @param {String} farmerId - the email of the farmer
 * @returns {Animal[]} - the animals that belong to the farmer
*/
function findAnimalsByOwnerIdWithDetails(farmerId) {
    return query('select resolve(a, a.location, a.owner) from Animal a where a.owner == :farmerId');
}

/**
 * Get the incoming animals for a farmer and do not resolve relationships
 * @query
 * @param {String} farmerId - the email of the farmer
 * @returns {Animal[]} - the animals that belong to the farmer
*/
function findIncomingAnimalsByFarmerId(farmerId) {
    return query('select b.incomingAnimals from Business b where b.owner == :farmerId');
}

/*eslint-enable no-unused-vars*/
/*eslint-enable no-undef*/
