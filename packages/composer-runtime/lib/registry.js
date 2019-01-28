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

const EventEmitter = require('events');
const Resource = require('composer-common').Resource;

const baseDefaultOptions = {
    convertResourcesToRelationships: true,
    permitResourcesForRelationships: false,
    forceAdd: false
};

/**
 * A class for managing and persisting resources.
 * @protected
 */
class Registry extends EventEmitter {

    /**
     * Constructor.
     * @param {string} dataCollection The data collection to use.
     * @param {Serializer} serializer The serializer to use.
     * @param {AccessController} accessController The access controller to use.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @param {string} name The name of the registry.
     * @param {boolean} system True if the registry is for a system type, false otherwise.
     */
    constructor(dataCollection, serializer, accessController, type, id, name, system) {
        super();
        this.dataCollection = dataCollection;
        this.serializer = serializer;
        this.accessController = accessController;
        this.type = type;
        this.id = id;
        this.name = name;
        this.system = system;
        this.objectMap = new Map();
    }

    /**
     * Remove any internal properties to the specified JSON object before
     * reinflating it back into a resource.
     * @param {Object} json The JSON object.
     * @return {Object} The JSON object.
     */
    static removeInternalProperties(json) {
        if (!json || typeof json !== 'object' || Array.isArray(json)) {
            throw new Error('Can only add properties to JSON objects');
        }
        delete json.$registryType;
        delete json.$registryId;
        return json;
    }

    /**
     * Get all the resources in this registry.
     * @return {Promise} A promise that will be resolved with an array of {@link
     * Resource} objects when complete, or rejected with an error.
     */
    async getAll() {
        const objects = await this.dataCollection.getAll();
        const resources = [];
        for (let object of objects) {
            object = Registry.removeInternalProperties(object);
            try {
                const resource = this.serializer.fromJSON(object);
                await this.accessController.check(resource, 'READ');
                resources.push(resource);
                this.objectMap.set(resource.getIdentifier(), object);
            } catch (error) {
                // Ignore the error; we don't have access.
            }
        }
        return resources;
    }

    /**
     * Get the specified resource in this registry.
     * @param {string} id The ID of the resource.
     * @return {Promise} A promise that will be resolved with a {@link Resource}
     * object when complete, or rejected with an error.
     */
    async get(id) {
        if (this.objectMap.has(id)) {
            let object = this.objectMap.get(id);
            return this.serializer.fromJSON(object);
        } else {
            let object = await this.dataCollection.get(id);
            object = Registry.removeInternalProperties(object);
            try {
                const resource = this.serializer.fromJSON(object);
                await this.accessController.check(resource, 'READ');
                this.objectMap.set(id, object);
                return resource;
            } catch (error) {
                let e = new Error(`Object with ID '${id}' in collection with ID '${this.type}:${this.id}' does not exist; [cause=${error.message}]`);
                throw e;
            }
        }
    }

    /**
     * Determine whether the specified resource exists in this registry.
     * @param {string} id The ID of the resource.
     * @return {Promise} A promise that will be resolved with a boolean
     * indicating whether the asset exists.
     */
    async exists(id) {
        const exists = await this.dataCollection.exists(id);
        if (!exists) {
            return false;
        }

        if (this.objectMap.has(id)) {
            return true;
        } else {
            let object = await this.dataCollection.get(id);
            object = Registry.removeInternalProperties(object);
            try {
                const resource = this.serializer.fromJSON(object, {validate: false});
                await this.accessController.check(resource, 'READ');
                this.objectMap.set(id, object);
                return true;
            } catch (error) {
                return false;
            }
        }
    }

    /**
     * An event signalling that a resource has been added to this registry.
     * @event Registry#resourceadded
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {Resource} resource The resource.
     */

    /**
     * Add all of the specified resources to this registry.
     * @param {Resource[]} resources The resources to add to this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     *  @param {boolean} [options.forceAdd] Forces adding the object even if it present (default to false)
     */
    async addAll(resources, options = {}) {
        for (const resource of resources) {
            await this.add(resource, options);
        }
    }

    /**
     * Add the specified resource to this registry.
     * @param {Resource} resource The resource to add to this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     * @param {boolean} [options.forceAdd] Forces adding the object even if it present (default to false)
     * @param {boolean} [options.noTest] skips application of the testAdd method (default to false)
     */
    async add(resource, options = {}) {

        if (!options.noTest){
            const error = await this.testAdd(resource);
            if (error) {
                throw error;
            }
        }

        const id = resource.getIdentifier();
        options = Object.assign({}, baseDefaultOptions, options);
        let object = this.serializer.toJSON(resource, options);
        object = this.addInternalProperties(object);
        await this.dataCollection.add(id, object, options.forceAdd);
        this.emit('resourceadded', {
            registry: this,
            resource: resource
        });
    }

    /**
     * Tests to see if the the specified resource to this registry could be added to the registry
     * invokes the same ACL rules as really adding.
     *
     * @param {Resource} resource The resource to test adding to this registry.
     * @return {Promise} A promise that will be resolved with null if this resource could be added, or resolved with the
     * error that would have been thrown.
     */
    async testAdd(resource) {
        if (!(resource instanceof Resource)) {
            return new Error('Expected a Resource or Concept.');                }
        else if (this.type !== resource.getClassDeclaration().getSystemType()){
            return new Error('Cannot add type: ' + resource.getClassDeclaration().getSystemType() + ' to ' + this.type);
        }
        try {
            await this.accessController.check(resource, 'CREATE');
            return null;
        } catch (error) {
            return error;
        }
    }

     /**
     * An event signalling that a resource has been updated in this registry.
     * @event Registry#resourceupdated
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {Resource} oldResource The old version of the resource.
     * @param {Resource} newResource The new version of the resource.
     */

    /**
     * Update all of the specified resources in this registry.
     * @param {Resource[]} resources The resources to update in this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     */
    async updateAll(resources, options = {}) {
        for (const resource of resources) {
            await this.update(resource, options);
        }
    }

    /**
     * Update the specified resource in this registry.
     * @param {Resource} resource The resource to update in this registry.
     * @param {Object} [options] Options for processing the resources.
     * @param {boolean} [options.convertResourcesToRelationships] Permit resources
     * in the place of relationships, defaults to false.
     */
    async update(resource, options = {}) {
        if (!(resource instanceof Resource)) {
            throw new Error('Expected a Resource or Concept.');                }
        else if (this.type !== resource.getClassDeclaration().getSystemType()){
            throw new Error('Cannot update type: ' + resource.getClassDeclaration().getSystemType() + ' to ' + this.type);
        }
        const id = resource.getIdentifier();
        options = Object.assign({}, baseDefaultOptions, options);
        let object = this.serializer.toJSON(resource, options);
        object = this.addInternalProperties(object);

        let oldResource;
        if (this.objectMap.has(id)) {
            let oldObject = this.objectMap.get(id);
            oldResource = this.serializer.fromJSON(oldObject);
        } else {
            let oldObject = await this.dataCollection.get(id);
            oldResource = this.serializer.fromJSON(oldObject);
        }

        // We must perform access control checks on the old version of the resource!
        await this.accessController.check(oldResource, 'UPDATE');
        await this.dataCollection.update(id, object);

        // If is within objectMap cache, update may have changed the ability to READ item, so remove it
        if (this.objectMap.has(id)) {
            this.objectMap.delete(id);
        }

        this.emit('resourceupdated', {
            registry: this,
            oldResource: oldResource,
            newResource: resource
        });
    }

    /**
     * An event signalling that a resource has been removed from this registry.
     * @event Registry#resourceremoved
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {string} resourceID The ID of the resource.
     */

    /**
     * Remove all of the specified resources from this registry.
     * @param {string[]|Resource[]} resources The resources to remove from this registry.
     */
    async removeAll(resources) {
        for (const resource of resources) {
            await this.remove(resource);
        }
    }

    /**
     * Remove the specified resource from this registry.
     * @param {string|Resource} resource The resource to remove from this registry.
     */
    async remove(resource) {
        if (!(resource instanceof Resource)) {
            // If the resource is a string, then we need to retrieve
            // the resource using its ID from the registry. We need to
            // do this to figure out the type of the resource for
            // access control.
            if (this.objectMap.has(resource)) {
                let object = this.objectMap.get(resource);
                resource = this.serializer.fromJSON(object);
            } else {
                let object = await this.dataCollection.get(resource);
                object = Registry.removeInternalProperties(object);
                resource = this.serializer.fromJSON(object);
            }
        }
        const id = resource.getIdentifier();
        await this.accessController.check(resource, 'DELETE');
        await this.dataCollection.remove(id);

        // Remove from cache if present
        if (this.objectMap.has(id)) {
            this.objectMap.delete(id);
        }

        this.emit('resourceremoved', {
            registry: this,
            resourceID: id
        });
    }

    /**
     * Add any internal properties to the specified JSON object before
     * persisting it into a data collection.
     * @param {Object} json The JSON object.
     * @return {Object} The JSON object.
     */
    addInternalProperties(json) {
        if (!json || typeof json !== 'object' || Array.isArray(json)) {
            throw new Error('Can only add properties to JSON objects');
        }
        json.$registryType = this.type;
        json.$registryId = this.id;
        return json;
    }

    /**
     * Return an object suitable for serialization.
     * @return {Object} An object suitable for serialization.
     */
    toJSON() {
        return {
            type: this.type,
            id: this.id,
            name: this.name
        };
    }

}

module.exports = Registry;
