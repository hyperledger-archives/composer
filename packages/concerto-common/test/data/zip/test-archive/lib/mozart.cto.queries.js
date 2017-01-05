/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
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
