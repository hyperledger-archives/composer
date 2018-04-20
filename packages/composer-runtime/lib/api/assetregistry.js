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

const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('AssetRegistry');

/**
 * The AssetRegistry is used to manage a set of assets stored on the Blockchain.
 *
 * Do not attempt to create an instance of this class.
 * You must use the {@link runtime-api#getAssetRegistry getAssetRegistry}
 * method instead.
 *
 * @class AssetRegistry
 * @summary An asset registry manages a set of assets.
 * @memberof module:composer-runtime
 * @public
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
         * return getAssetRegistry('org.example.Vehicle')
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
         * @method module:composer-runtime.AssetRegistry#getAll
         * @return {Promise} A promise. The promise is resolved with an array of
         * {@link common-Resource} instances representing all of the assets stored in this
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
         * return getAssetRegistry('org.example.Vehicle')
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
         * @method module:composer-runtime.AssetRegistry#get
         * @param {string} id The ID of the asset.
         * @return {Promise} A promise. The promise is resolved with a {@link common-Resource}
         * instance representing the specified asset in this asset registry. If the
         * specified asset does not exist, or the current user does not have access
         * to the specified asset, then the promise will be rejected with an error
         * that describes the problem.
         */
        this.get = function get(id) {
            return registry.get(id);
        };

        /**
         * Determines whether a specific asset exists in this asset registry.
         * @example
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.example.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Determine if the specific vehicle exists in the vehicle asset registry.
         *     return assetRegistry.exists('VEHICLE_1');
         *   })
         *   .then(function (exists) {
         *     // Process the the boolean result.
         *     console.log('Vehicle exists', exists);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.AssetRegistry#exists
         * @param {string} id The ID of the asset.
         * @return {Promise} A promise. The promise is resolved with a boolean which
         * is true if the specified asset exists in this asset registry, and false
         * if the specified participant does not exist.
         */
        this.exists = function exists(id) {
            return registry.exists(id);
        };

        /**
         * Add all of the specified assets to this asset registry.
         * @example
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.example.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Get the factory for creating new asset instances.
         *     var factory = getFactory();
         *     // Create the first vehicle.
         *     var vehicle1 = factory.newResource('org.example', 'Vehicle', 'VEHICLE_1');
         *     vehicle1.colour = 'BLUE';
         *     // Create the second vehicle.
         *     var vehicle2 = factory.newResource('org.example', 'Vehicle', 'VEHICLE_2');
         *     vehicle2.colour = 'GREEN';
         *     // Add the vehicles to the vehicle asset registry.
         *     return vehicleAssetRegistry.addAll([vehicle1, vehicle2]);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.AssetRegistry#addAll
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
         * return getAssetRegistry('org.example.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Get the factory for creating new asset instances.
         *     var factory = getFactory();
         *     // Create the vehicle.
         *     var vehicle = factory.newResource('org.example', 'Vehicle', 'VEHICLE_1');
         *     vehicle.colour = 'BLUE';
         *     // Add the vehicle to the vehicle asset registry.
         *     return vehicleAssetRegistry.add(vehicle);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.AssetRegistry#add
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
         * Update all of the specified assets in this asset registry.
         * @example
         * // The existing vehicles that have come from elsewhere.
         * var vehicle1;
         * var vehicle2;
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.example.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Get the factory for creating new asset instances.
         *     var factory = getFactory();
         *     // Modify the properties of the first vehicle.
         *     vehicle1.colour = 'PURPLE';
         *     // Modify the properties of the second vehicle.
         *     vehicle2.colour = 'ORANGE';
         *     // Update the vehicles in the vehicle asset registry.
         *     return vehicleAssetRegistry.updateAll([vehicle1, vehicle2]);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.AssetRegistry#updateAll
         * @param {Resource[]} assets The assets to update in this asset registry.
         * @return {Promise} A promise. The promise is resolved when all of the
         * assets have been updated in this asset registry. If the assets cannot be
         * updated in this asset registry, or if the assets do not exist in the
         * asset registry, then the promise will be rejected with an error that
         * describes the problem.
         */
        this.updateAll = function updateAll(assets) {
            return registry.updateAll(assets, { convertResourcesToRelationships: true });
        };

        /**
         * Update the specified asset in this asset registry.
         * @example
         * // The existing vehicle that has come from elsewhere.
         * var vehicle;
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.example.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Get the factory for creating new asset instances.
         *     var factory = getFactory();
         *     // Modify the properties of the vehicle.
         *     vehicle.colour = 'PURPLE';
         *     // Update the vehicle in the vehicle asset registry.
         *     return vehicleAssetRegistry.update(vehicle);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.AssetRegistry#update
         * @param {Resource} asset The asset to update in this asset registry.
         * @return {Promise} A promise. The promise is resolved when the asset
         * have been updated in this asset registry. If the asset cannot be
         * updated in this asset registry, or if the asset does not exist in the
         * asset registry, then the promise will be rejected with an error that
         * describes the problem.
         */
        this.update = function update(asset) {
            return registry.update(asset, { convertResourcesToRelationships: true });
        };

        /**
         * Remove all of the specified assets from this asset registry.
         * @example
         * // The existing vehicles that have come from elsewhere.
         * var vehicle1;
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.example.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Get the factory for creating new asset instances.
         *     var factory = getFactory();
         *     // Remove the vehicles from the vehicle asset registry. Note that
         *     // one vehicle is specified as a vehicle instance, and the other
         *     // vehicle is specified by the ID of the vehicle.
         *     return vehicleAssetRegistry.removeAll([vehicle1, 'VEHICLE_2']);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.AssetRegistry#removeAll
         * @param {string[]|Resource[]} assets The assets, or the IDs of the assets,
         * to remove from this asset registry.
         * @return {Promise} A promise. The promise is resolved when all of the
         * assets have been removed from this asset registry. If the assets cannot be
         * removed from this asset registry, or if the assets do not exist in the
         * asset registry, then the promise will be rejected with an error that
         * describes the problem.
         */
        this.removeAll = function removeAll(assets) {
            return registry.removeAll(assets);
        };

        /**
         * Remove the specified asset from this asset registry.
         * @example
         * // The existing vehicle that has come from elsewhere.
         * var vehicle;
         * // Get the vehicle asset registry.
         * return getAssetRegistry('org.example.Vehicle')
         *   .then(function (vehicleAssetRegistry) {
         *     // Get the factory for creating new asset instances.
         *     var factory = getFactory();
         *     // Remove the vehicle from the vehicle asset registry.
         *     return vehicleAssetRegistry.remove(vehicle);
         *   })
         *   .catch(function (error) {
         *     // Add optional error handling here.
         *   });
         * @public
         * @method module:composer-runtime.AssetRegistry#remove
         * @param {string|Resource} asset The asset, or ID of the asset, to remove
         * from this asset registry.
         * @return {Promise} A promise. The promise is resolved when the asset
         * has been removed from this asset registry. If the asset cannot be
         * removed from this asset registry, or if the asset does not exist in the
         * asset registry, then the promise will be rejected with an error that
         * describes the problem.
         */
        this.remove = function remove(asset) {
            return registry.remove(asset);
        };

        Object.freeze(this);
        LOG.exit(method);
    }

}

module.exports = AssetRegistry;