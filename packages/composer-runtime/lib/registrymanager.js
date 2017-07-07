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
    'Asset': 'org.hyperledger.composer.system.AssetRegistry',
    'Participant': 'org.hyperledger.composer.system.ParticipantRegistry',
    'Transaction': 'org.hyperledger.composer.system.TransactionRegistry',
    'Identity': 'org.hyperledger.composer.system.IdentityRegistry'
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
     */
    constructor(dataService, introspector, serializer, accessController, sysregistries) {
        super();
        this.dataService = dataService;
        this.introspector = introspector;
        this.serializer = serializer;
        this.accessController = accessController;
        this.sysregistries = sysregistries;
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
            }).then(() => {
                // FUTURE:
                // let file = ['namespace org.composer.runtime', 'import org.hyperledger.composer.system.AssetRegistry'];

                // let runtimeModel = assetDeclarations.reduce((result, assetDeclaration) => {
                //     let fqn = assetDeclaration.getName();
                //     if (!assetDeclaration.isSystemType()) {
                //         result.push('asset ' + fqn + 'Registry extends AssetRegistry {}');
                //     }

                //     return result;
                // }, file);
                // LOG.debug('createDefaults', runtimeModel.join('\n'));
                // // console.log(runtimeModel.join('\n'));
                // this.introspector.getModelManager().addModelFile(runtimeModel.join('\n'));
                return;
            });
    }

    /**
     * Get all of the registries.
     * @param {string} type The type of the registry.
     * @return {Promise} A promise that is resolved with an array of {@link Registry}
     * objects when complete, or rejected with an error.
     */
    getAll(type) {
        return this.sysregistries.getAll()
            .then((registries) => {
                registries = registries.filter((registry) => {
                    return registry.type === type;
                });
                return registries.reduce((prev, registry) => {
                    let collectionID = registry.type + ':' + registry.id;

                    let regType = TYPE_MAP[registry.type];
                    let r = {
                        '$class': regType,
                        'registryID': registry.id,
                        'type': type, 'id': registry.id
                    };

                    let resource = this.serializer.fromJSON(r);

                    return this.accessController.check(resource, 'READ').then(() => {

                        return prev;
                    })


                        .then((result) => {
                            return this.dataService.getCollection(collectionID)
                                .then((dataCollection) => {
                                    result.push(this.createRegistry(dataCollection, this.serializer, this.accessController, registry.type, registry.id, registry.name));
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

        let regType = TYPE_MAP[type];
        let r = {
            '$class': regType,
            'registryID': id,
            'type': type, 'id': id
        };

        let resource = this.serializer.fromJSON(r);

        return this.accessController.check(resource, 'READ').then(() => {
            return this.sysregistries.get(collectionID);
        })
            .then((registry) => {
                return this.dataService.getCollection(collectionID)
                    .then((dataCollection) => {
                        return this.createRegistry(dataCollection, this.serializer, this.accessController, registry.type, registry.id, registry.name);
                    });
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

        let regType = TYPE_MAP[type];
        let r = {
            '$class': regType,
            'registryID': id,
            'type': type, 'id': id
        };

        let resource = this.serializer.fromJSON(r);

        return this.accessController.check(resource, 'READ')
            .then(() => {
                return this.sysregistries.exists(collectionID);
            })
            .then((exists) => {
                return exists;
            });
    }

    /**
     * An event signalling that a registry has been added.
     * @event RegistryManager#registryadded
     * @protected
     * @type {object}
     * @param {Registry} registry The registry.
     * @param {string} registryType The type of the registry.
     * @param {string} registryID The ID of the registry.
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

        // TODO: map the regsitry to the correct type here
        let regType = TYPE_MAP[type];
        let r = {
            '$class': regType,
            'registryID': id,
            'type': type, 'id': id, 'name': name
        };

        LOG.debug('add', 'Creating new registry ', r.type, r.name, r.id);
        let resource = this.serializer.fromJSON(r);

        return this.accessController.check(resource, 'CREATE')
            .then(() => {
                this.sysregistries.add(collectionID, { type: type, id: id, name: name }, force);
            })
            .then(() => {
                return this.dataService.createCollection(collectionID, force);
            })
            .then((dataCollection) => {
                let result = this.createRegistry(dataCollection, this.serializer, this.accessController, type, id, name);
                this.emit('registryadded', {
                    registry: result,
                    registryType: type,
                    registryID: id,
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
