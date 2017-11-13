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

const AssetDeclaration = require('composer-common').AssetDeclaration;
const EventEmitter = require('events');
const Logger = require('composer-common').Logger;
const ParticipantDeclaration = require('composer-common').ParticipantDeclaration;
const TransactionDeclaration = require('composer-common').TransactionDeclaration;
const Registry = require('./registry');

const LOG = Logger.getLog('RegistryManager');

// Do not add additional types to these constants. All system types are assets.
const TYPE_MAP = {
    Asset : 'AssetRegistry',
    Participant : 'ParticipantRegistry',
    Transaction : 'TransactionRegistry',
    Network : 'Network'
};

// This is a list of non-abstract system types that we do not want registries created for.
const VIRTUAL_TYPES = [
    'Network'
];

/**
 * A class for managing and persisting registries.
 * @protected
 */
class RegistryManager extends EventEmitter {

    /**
     * Constructor.
     * @param {DataService} dataService The data service to use.
     * @param {Introspector} introspector The introspector to use.
     * @param {Serializer} serializer The serializer to use.
     * @param {AccessController} accessController The access controller to use.
     * @param {DataCollection} sysregistries The system registries collection to use.
     * @param {Factory} factory The factory to create new resources
     */
    constructor(dataService, introspector, serializer, accessController, sysregistries, factory) {
        super();
        this.dataService = dataService;
        this.introspector = introspector;
        this.serializer = serializer;
        this.accessController = accessController;
        this.sysregistries = sysregistries;
        this.factory = factory;

        this.sysregistryCache = {};
    }

    /**
     * Create a new registry instance and subscribe to its events.
     * @private
     * @param {DataCollection} dataCollection The data collection.
     * @param {Serializer} serializer The serializer.
     * @param {AccessController} accessController The access controller.
     * @param {string} type The type.
     * @param {string} id The ID.
     * @param {string} name The name.
     * @param {boolean} system True if the registry is for a system type, false otherwise.
     * @return {Registry} The new registry instance.
     */
    createRegistry(dataCollection, serializer, accessController, type, id, name, system) {
        let registry = new Registry(dataCollection, serializer, accessController, type, id, name, system);
        ['resourceadded', 'resourceupdated', 'resourceremoved'].forEach((event) => {
            registry.on(event, (data) => {
                this.emit(event, data);
            });
        });
        return registry;
    }

    /**
     * Create the default regsitries
     * @param {Boolean} force if set to true, will add without checking for existence#
     * @returns {Promise} A promise that is resolved once all default registries
     * have been created, or rejected with an error.
     */
    createDefaults(force) {
        return this.createSystemDefaults(force).then(() => {
            return this.createNetworkDefaults(force);
        });
    }

    /**
     * Ensure that the default *network* registries exist.
     * @param {boolean} force if set to true, will add without checking for existence
     * @returns {Promise} A promise that is resolved once all default registries
     * have been created, or rejected with an error.
     */
    createNetworkDefaults(force) {
        const method = 'createNetworkDefaults';
        LOG.entry(method, force);

        return this.introspector.getClassDeclarations()
            .filter((classDeclaration) => {
                return !classDeclaration.isAbstract();
            })
            .filter((classDeclaration) => {
                return (classDeclaration instanceof AssetDeclaration) || (classDeclaration instanceof ParticipantDeclaration) || (classDeclaration instanceof TransactionDeclaration);
            })
            .filter((classDeclaration) => {
                return !(classDeclaration.isSystemType());
            })
            .reduce((promise, classDeclaration) => {
                return promise.then(() => {
                    const type = classDeclaration.getSystemType();
                    const fqn = classDeclaration.getFullyQualifiedName();
                    LOG.debug(method, 'Creating registry', type, fqn);
                    if (force) {
                        return this.add(type, fqn, `${type} registry for ${fqn}`, true);
                    } else {
                        return this.ensure(type, fqn, `${type} registry for ${fqn}`);
                    }
                }).then((result) => {
                    // we need to cache these as the network registries will cause entries to appear here
                    this.sysregistryCache[result.type + ':' + result.id] = result;
                });
            }, Promise.resolve())
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Ensure that the default *system* registries exist.
     * @param {boolean} force if set to true, will add without checking for existence
     * @returns {Promise} A promise that is resolved once all default registries
     * have been created, or rejected with an error.
     */
    createSystemDefaults(force) {
        const method = 'createSystemDefaults';
        LOG.entry(method, force);
        this.dirty = true;
        return this.introspector.getClassDeclarations()
            .filter((classDeclaration) => {
                return !classDeclaration.isAbstract();
            })
            .filter((classDeclaration) => {
                return (classDeclaration instanceof AssetDeclaration) || (classDeclaration instanceof ParticipantDeclaration) || (classDeclaration instanceof TransactionDeclaration);
            })
            .filter((classDeclaration) => {
                return (classDeclaration.isSystemType() && !(VIRTUAL_TYPES.indexOf(classDeclaration.getName()) > -1));
            })
            .reduce((promise, classDeclaration) => {
                return promise.then(() => {
                    const type = classDeclaration.getSystemType();
                    const fqn = classDeclaration.getFullyQualifiedName();
                    const systemType = classDeclaration.isSystemType();
                    // console.log('Creating System registry', type, fqn, systemType);
                    LOG.debug(method, 'Creating registry', type, fqn, systemType);
                    if (force) {
                        return this.add(type, fqn, `${type} registry for ${fqn}`, true, systemType);
                    } else {
                        return this.ensure(type, fqn, `${type} registry for ${fqn}`, systemType);
                    }
                }).then((result) => {
                    // we need to cache these as the network registries will cause entries to appear here
                    this.sysregistryCache[result.type + ':' + result.id] = result;
                });
            }, Promise.resolve())
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Get all of the registries.
     * @param {string} type The type of the registry.
     * @param {boolean} includeSystem true if system registries should be included (optional, default is false)
     * @return {Promise} A promise that is resolved with an array of {@link Registry}
     * objects when complete, or rejected with an error.
     */
    getAll(type, includeSystem) {
        const method = 'getAll';
        includeSystem = includeSystem || false;
        LOG.entry(method, type);
        return this.sysregistries.getAll()
            .then((registries) => {
                registries = registries.filter((registry) => {
                    return registry.type === type;
                });
                LOG.debug(method, 'Filtered registries down to', registries.length);
                return registries.reduce((prev, registry) => {
                    return prev.then((result) => {

                        return this.get(registry.type, registry.registryId)
                            .then((r) => {
                                LOG.debug(method, 'reducing', r.name);
                                result.push(r);
                                return result;
                            })
                            .catch(() => {
                                LOG.debug(method, 'not worried about access failure');
                                return result;
                            });

                    });
                }, Promise.resolve([]));
            })
            .then((registries) => {
                if (!includeSystem) {
                    registries = registries.filter((registry) => {
                        return !registry.system;
                    });
                }

                LOG.exit(method, registries);
                return registries;
            });
    }

    /**
     * Get a registry with the specified type, and ID.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @return {Promise} A promise that is resolved with a {@link Registry}
     * objects when complete, or rejected with an error.
     */
    get(type, id) {
        let collectionID = type + ':' + id;
        let resource;
        let simpledata;
        LOG.entry('get', collectionID);

        // During business network start/update, new registries may be created. Unfortunately we can't directly
        // read them, so we look them up in the registry cache instead.
        let registry = this.sysregistryCache[collectionID];
        if (registry) {
            return Promise.resolve(registry);
        }

        // go to the sysregistries datacollection and get the 'resource' for the registry we are interested in
        return this.sysregistries.get(collectionID)
            .then((result) => {
                simpledata = result;
                // do we have permission to be looking at this??
                resource = this.serializer.fromJSON(result);
                return this.accessController.check(resource, 'READ');
            })
            .then(() => {
                // if we got here then, we the accessController.check was OK, get the dataCollection with the actual information
                // for the require registry
                return this.dataService.getCollection(collectionID);
            })
            .then((dataCollection) => {
                // and form up the actual registry object
                // TODO: Does this really need to take the the 3 parametrs type,registryId and name??
                // TODO: this really doens't seem right
                return this.createRegistry(dataCollection, this.serializer, this.accessController, simpledata.type, simpledata.registryId, simpledata.name, simpledata.system);
            });
    }

    /**
     * Determine whether a registry with the specified type and ID exists.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @return {Promise} A promise that is resolved with a boolean indicating
     * whether the registry exists.
     */
    exists(type, id) {
        let collectionID = type + ':' + id;
        let resource;

        // form this up into a resource and check if we are able to read this.
        let litmusResource = this.factory.newResource('org.hyperledger.composer.system', TYPE_MAP[type], id);
        return this.accessController.check(litmusResource, 'READ')
            .then(() => {
                return this.sysregistries.exists(collectionID);
            })
            .then((result) => {
                if (result) {
                    // yes we can see this type of registry - in theory
                    return this.sysregistries.get(collectionID)
                        .then((result) => {
                            // do we REALLY have permission to be looking at this??
                            resource = this.serializer.fromJSON(result);
                            return this.accessController.check(resource, 'READ');
                        })
                        .then(() => {
                            // well we got here! so the resource is there and we can really really access it
                            return true;

                        });
                } else {
                    // the registry doesn't exist
                    return false;
                }
            });

    }

    /**
     * An event signalling that a registry has been added.
     * @event RegistryManager#registryadded
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {string} registryType The type of the registry.
     * @param {string} registryId The ID of the registry.
     * @param {string} registryName The name of the registry.
     */

    /**
     * Add a new registry with the specified type, ID, and name.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @param {string} name The name of the registry.
     * @param {boolean} force True to force the creation of the collection without checking.
     * @param {boolean} system True if the registry is for a system type, false otherwise.
     * @return {Promise} A promise that is resolved when complete, or rejected
     * with an error.
     */
    add(type, id, name, force, system) {
        let collectionID = type + ':' + id;

        // form this up into a resource and check if we are able to create this.
        let resource = this.factory.newResource('org.hyperledger.composer.system', TYPE_MAP[type], id);
        resource.name = name;
        resource.type = type;
        resource.system = !!system;

        return this.accessController.check(resource, 'CREATE')
            .then(() => {
                // yes we can create an instance of this type; now add that to the sysregistries collection
                // Note we haven't checked if we have update permission on the sysregristries collection
                // but that is going a bit far really...resource.type+':org.hyperledger.composer.system.'+resource.type+'Registry'
                return this.sysregistries.add(collectionID, this.serializer.toJSON(resource), force);

            }).then(() => {
                if (!resource.system) {
                    let srid = 'Asset:org.hyperledger.composer.system.' + resource.type + 'Registry';
                    let registry = this.sysregistryCache[srid];
                    if (!registry) {
                        return this.get('Asset', 'org.hyperledger.composer.system.' + resource.type + 'Registry')
                            .then((result) => {
                                return result.add(resource);
                            });
                    } else {
                        return registry.add(resource, {forceAdd : force});
                    }
                } else {
                    return;
                }
            })
            .then((result) => {
                // create the collection that will hold the actual data in this registry
                return this.dataService.createCollection(collectionID, force);
            })
            .then((dataCollection) => {
                // and create the registry instance to be used
                let result = this.createRegistry(dataCollection, this.serializer, this.accessController, type, id, name);

                // event emitting
                // TODO: not checked event emission privaledge.
                this.emit('registryadded', {
                    registry : result,
                    registryType : type,
                    registryId : id,
                    registryName : name
                });
                return result;
            });
    }

    /**
     * Check to see if the specified registry exists, and create it if it does not.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @param {string} name The name of the registry.
     * @param {boolean} system True if the registry is for a system type, false otherwise.
     * @return {Promise} A promise that is resolved when complete, or rejected
     * with an error.
     */
    ensure(type, id, name, system) {
        const method = 'ensure';
        LOG.entry(method, type, id, name, system);
        return this.get(type, id)
            .catch((error) => {
                LOG.debug(method, 'The registry does not exist, creating');
                return this.add(type, id, name, false, system);
            })
            .then((registry) => {
                LOG.exit(method, registry);
                return registry;
            });
    }

    /**
     * Clear the contents of the specified registry.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @return {Promise} A promise that is resolved when complete, or rejected
     * with an error.
     */
    clear(type, id) {
        const method = 'clear';
        LOG.entry(method, type, id);
        let collectionID = type + ':' + id;
        return this.dataService.deleteCollection(collectionID)
            .then(() => {
                LOG.exit(method);
            });
    }

    /**
     * Remove the specified registry.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @return {Promise} A promise that is resolved when complete, or rejected
     * with an error.
     */
    remove(type, id) {
        const method = 'remove';
        LOG.entry(method, type, id);
        let collectionID = type + ':' + id;
        return this.clear(type, id)
            .then(() => {
                let srid = 'Asset:org.hyperledger.composer.system.' + type + 'Registry';
                let registry = this.sysregistryCache[srid];
                if (!registry) {
                    return this.get('Asset', 'org.hyperledger.composer.system.' + type + 'Registry');
                }
                return registry;
            })
            .then((registry) => {
                return registry.remove(id);
            })
            .then(() => {
                return this.sysregistries.remove(collectionID);
            })
            .then(() => {
                LOG.exit(method);
            });
    }

}

module.exports = RegistryManager;
