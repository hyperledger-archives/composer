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
const Registry = require('./registry');

const LOG = Logger.getLog('RegistryManager');
const TYPE_MAP = {
    'Asset': 'AssetRegistry',
    'Participant': 'ParticipantRegistry',
    'Transaction': 'TransactionRegistry',
    'Network': 'Network'
};


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
    constructor(dataService, introspector, serializer, accessController, sysregistries,factory) {
        super();
        this.dataService = dataService;
        this.introspector = introspector;
        this.serializer = serializer;
        this.accessController = accessController;
        this.sysregistries = sysregistries;
        this.factory = factory;
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
     * @return {Registry} The new registry instance.
     */
    createRegistry(dataCollection, serializer, accessController, type, id, name) {
        let registry = new Registry(dataCollection, serializer, accessController, type, id, name);
        ['resourceadded', 'resourceupdated', 'resourceremoved'].forEach((event) => {
            registry.on(event, (data) => {
                this.emit(event, data);
            });
        });
        return registry;
    }

    /**
     * Ensure that the default registries exist.
     * @param {boolean} force if set to true, will add without checking for existence
     * @returns {Promise} A promise that is resolved once all default registries
     * have been created, or rejected with an error.
     */
    createDefaults(force) {
        let assetDeclarations = this.introspector.getClassDeclarations().filter((classDeclaration) => {
            if (classDeclaration.isAbstract()) {
                return false;
            }
            return (classDeclaration instanceof AssetDeclaration);
        });
        let participantDeclarations = this.introspector.getClassDeclarations().filter((classDeclaration) => {
            if (classDeclaration.isAbstract()) {
                return false;
            }
            return (classDeclaration instanceof ParticipantDeclaration);
        });
        return Promise.resolve()
            .then(() => {
                return assetDeclarations.reduce((result, assetDeclaration) => {
                    let fqn = assetDeclaration.getFullyQualifiedName();

                    if (!assetDeclaration.isSystemType()) {
                        if (force) {
                            return this.add('Asset', fqn, `Asset registry for ${fqn}`, true);
                        } else {
                            return this.ensure('Asset', fqn, `Asset registry for ${fqn}`);
                        }
                    }
                }, Promise.resolve());
            })
            .then(() => {
                return participantDeclarations.reduce((result, participantDeclaration) => {
                    let fqn = participantDeclaration.getFullyQualifiedName();
                    if (!participantDeclaration.isSystemType()) {
                        if (force) {
                            return this.add('Participant', fqn, `Participant registry for ${fqn}`, true);
                        } else {
                            return this.ensure('Participant', fqn, `Participant registry for ${fqn}`);
                        }
                    }
                }, Promise.resolve());
            });
    }

    /**
     * Get all of the registries.
     * @param {string} type The type of the registry.
     * @return {Promise} A promise that is resolved with an array of {@link Registry}
     * objects when complete, or rejected with an error.
     */
    getAll(type) {
        const METHOD = 'getAll';
        LOG.entry(METHOD, type);
        return this.sysregistries.getAll()
            .then((registries) => {
                registries = registries.filter((registry) => {
                    return registry.type === type;
                });
                LOG.debug(METHOD, 'Filtered registries down to', registries.length);
                return registries.reduce((prev, registry) => {
                    return prev.then((result) => {

                        return this.get(registry.type, registry.registryId)
                            .then((r) => {
                                // console.log(r);
                                LOG.debug(METHOD, 'reducing', r.name);
                                result.push(r);
                                return result;
                            }).catch(() => {
                                LOG.debug(METHOD, 'not worried about access failure');
                                return result;
                            });

                    });
                }, Promise.resolve([]));
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
            }).then((dataCollection) => {
                // and form up the actual registry object
                // TODO: Does this really need to take the the 3 parametrs type,registryId and name??
                // TODO: this really doens't seem right
                return this.createRegistry(dataCollection, this.serializer, this.accessController, simpledata.type, simpledata.registryId, simpledata.name);
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

        // firstly form up a 'fake' object to test IF one did exist, would you in theory
        // be able to see it?
        // Structure of the JSON will be along these lines
        // let r = {
        //     '$class': regType,
        //     'registryId': id,
        //     'type': type
        // };

        let litmusResource = this.factory.newResource('org.hyperledger.composer.system',TYPE_MAP[type],id);
        // let litmusResource = this.serializer.fromJSON(r);
        return this.accessController.check(litmusResource, 'READ')
            .then(() => {
                // yes we can see this type of registry - in theory
                return this.sysregistries.get(collectionID);
            })
            .then((result) => {
                // do we REALLY have permission to be looking at this??
                resource = this.serializer.fromJSON(result);
                return this.accessController.check(resource, 'READ');
            }).then(() => {
                // well we got here! so the resource is there and we can really really access it
                return true;

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
     * @param {boolean} force true to force the creation of the collection without checking
     * @return {Promise} A promise that is resolved when complete, or rejected
     * with an error.
     */
    add(type, id, name, force) {
        let collectionID = type + ':' + id;

        // This map should be sufficient I hope!
        // This is the format of the resource
        // let r = {
        //     '$class': regType,
        //     'registryId': id,
        //     'type': type,
        //     'name': name
        // };

        // form this up into a resource and check if we are able to create this.
        let resource = this.factory.newResource('org.hyperledger.composer.system',TYPE_MAP[type],id);
        resource.name=name;
        resource.type=type;
        // let resource = this.serializer.fromJSON(r);
        return this.accessController.check(resource, 'CREATE')
            .then(() => {
                // yes we can create an instance of this type; now add that to the sysregistries collection
                // Note we haven't checked if we have update permission on the sysregristries collection
                // but that is going a bit far really...
                this.sysregistries.add(collectionID, this.serializer.toJSON(resource), force);
            })
            .then(() => {
                // create the collection that will hold the actual data in this registry
                return this.dataService.createCollection(collectionID, force);
            })
            .then((dataCollection) => {
                // and create the registry instance to be used
                let result = this.createRegistry(dataCollection, this.serializer, this.accessController, type, id, name);

                // event emitting
                // TODO: not checked event emission privaledge.
                this.emit('registryadded', {
                    registry: result,
                    registryType: type,
                    registryId: id,
                    registryName: name
                });
                return result;
            });
    }

    /**
     * Check to see if the specified registry exists, and create it if it does not.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @param {string} name The name of the registry.
     * @param {boolean} force true to force the creation of the collection without checking
     * @return {Promise} A promise that is resolved when complete, or rejected
     * with an error.
     */
    ensure(type, id, name) {
        const method = 'ensure';
        LOG.entry(method, type, id, name);
        return this.get(type, id)
            .catch((error) => {
                LOG.debug(method, 'The registry does not exist, creating');
                return this.add(type, id, name);
            })
            .then((registry) => {
                LOG.exit(method, registry);
                return registry;
            });
    }

}

module.exports = RegistryManager;
