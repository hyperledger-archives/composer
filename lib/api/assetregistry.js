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

const Logger = require('@ibm/ibm-concerto-common').Logger;

const LOG = Logger.getLog('AssetRegistry');

/**
 * Do not attempt to create an instance of this class; you cannot directly create
 * a new instance of this class.<br>
 * You must use the {@link getAssetRegistry} method instead.
 *
 * @class AssetRegistry
 * @classdesc blah blah blah
 * @public
 */

/**
 * A class that represents an asset registry in the transaction processor API. The
 * transaction processor API should expose no internal properties or internal
 * methods which could be accessed or misused.
 * @private
 */
class AssetRegistry {

    /**
     * Constructor.
     * @param {Registry} registry The registry to use.
     * @private
     */
    constructor(registry) {
        const method = 'constructor';
        LOG.entry(method, registry);

        /**
         * Get a list of all of the existing assets in this asset registry.
         * @example
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.acme.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Get all of the vehicles in the vehicle asset registry.
         *     return assetRegistry.getAll();
         *   })
         *   .then(function (vehicles) {
         *     // Process the array of vehicle objects.
         *     vehicles.forEach(function (vehicle) {
         *       console.log(vehicle.vehicleId);
         *     });
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @return {Promise} A promise. The promise is resolved with an array of
         * {@link Resource} instances representing all of the assets stored in this
         * asset registry. If the asset registry does not exist, or the current
         * user does not have access to the asset registry, then the promise will
         * be rejected with an error that describes the problem.
         */
        this.getAll = function getAll() {
            return registry.getAll();
        };

        /**
         * Get the specified asset in this asset registry using the unique identifier
         * of the asset.
         * @example
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.acme.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Get the specific vehicle from the vehicle asset registry.
         *     return assetRegistry.get('VEHICLE_1');
         *   })
         *   .then(function (vehicle) {
         *     // Process the the vehicle object.
         *     console.log(vehicle.vehicleId);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @param {string} id The ID of the asset.
         * @return {Promise} A promise. The promise is resolved with a {@link Resource}
         * instance representing the specified asset in this asset registry. If the
         * specified asset does not exist, or the current user does not have access
         * to the specified asset, then the promise will be rejected with an error
         * that describes the problem.
         */
        this.get = function get(id) {
            return registry.get(id);
        };

        /**
         * Add all of the specified assets to this asset registry.
         * @example
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.acme.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Get the factory for creating new asset instances.
         *     var factory = getFactory();
         *     // Create the first vehicle.
         *     var vehicle1 = factory.newInstance('org.acme', 'Vehicle', 'VEHICLE_1');
         *     vehicle1.colour = 'BLUE';
         *     // Create the second vehicle.
         *     var vehicle2 = factory.newInstance('org.acme', 'Vehicle', 'VEHICLE_2');
         *     vehicle2.colour = 'GREEN';
         *     // Add the vehicles to the vehicle asset registry.
         *     return vehicleAssetRegistry.addAll([vehicle1, vehicle2]);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @param {Resource[]} assets The assets to add to this asset registry.
         * @return {Promise} A promise. The promise is resolved when all of the
         * assets have been added to this asset registry. If the assets cannot be
         * added to this asset registry, or if the assets already exist in the
         * asset registry, then the promise will be rejected with an error
         * that describes the problem.
         */
        this.addAll = function addAll(assets) {
            return registry.addAll(assets, { convertResourcesToRelationships: true });
        };

        /**
         * Add the specified asset to this asset registry.
         * @example
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.acme.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Get the factory for creating new asset instances.
         *     var factory = getFactory();
         *     // Create the vehicle.
         *     var vehicle = factory.newInstance('org.acme', 'Vehicle', 'VEHICLE_1');
         *     vehicle.colour = 'BLUE';
         *     // Add the vehicle to the vehicle asset registry.
         *     return vehicleAssetRegistry.add(vehicle);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @param {Resource} asset The assets to add to this asset registry.
         * @return {Promise} A promise. The promise is resolved when the asset has
         * been added to this asset registry. If the asset cannot be added to this
         * asset registry, or if the asset already exists in the asset registry,
         * then the promise will be rejected with an error that describes the problem.
         */
        this.add = function add(asset) {
            return registry.add(asset, { convertResourcesToRelationships: true });
        };

        /**
         * Update all of the specified resources in this registry.
         * @public
         * @param {Resource[]} resources The resources to update in this registry.
         * @return {Promise} A promise that will be resolved when complete, or rejected
         * with an error.
         */
        this.updateAll = function updateAll(resources) {
            return registry.updateAll(resources, { convertResourcesToRelationships: true });
        };

        /**
         * Update the specified resource in this registry.
         * @public
         * @param {Resource} resource The resource to update in this registry.
         * @return {Promise} A promise that will be resolved when complete, or rejected
         * with an error.
         */
        this.update = function update(resource) {
            return registry.update(resource, { convertResourcesToRelationships: true });
        };

        /**
         * Remove all of the specified resources from this registry.
         * @public
         * @param {string[]|Resource[]} resources The resources to remove from this registry.
         * @return {Promise} A promise that will be resolved when complete, or rejected
         * with an error.
         */
        this.removeAll = function removeAll(resources) {
            return registry.removeAll(resources);
        };

        /**
         * Remove the specified resource from this registry.
         * @public
         * @param {string|Resource} resource The resource to remove from this registry.
         * @return {Promise} A promise that will be resolved when complete, or rejected
         * with an error.
         */
        this.remove = function remove(resource) {
            return registry.remove(resource);
        };

        Object.freeze(this);
        LOG.exit(method);
    }

}

module.exports = AssetRegistry;
