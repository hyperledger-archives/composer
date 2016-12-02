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

const AssetDeclaration = require('@ibm/ibm-concerto-common').AssetDeclaration;
const ParticipantDeclaration = require('@ibm/ibm-concerto-common').ParticipantDeclaration;
const Registry = require('./registry');

/**
 * A class for managing and persisting registries.
 * @class
 * @memberof module:ibm-concerto-runtime
 */
class RegistryManager {

    /**
     * Constructor.
     * @param {DataService} dataService The data service to use.
     * @param {Introspector} introspector The introspector to use.
     * @param {Serializer} serializer The serializer to use.
     */
    constructor(dataService, introspector, serializer) {
        this.dataService = dataService;
        this.introspector = introspector;
        this.serializer = serializer;
    }

    /**
     * Ensure that the default registries exist.
     * @returns {Promise} A promise that is resolved once all default registries
     * have been created, or rejected with an error.
     */
    createDefaults() {
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
                    return this.get('Asset', fqn)
                        .catch(() => {
                            return this.add('Asset', fqn, `Asset registry for ${fqn}`);
                        });
                }, Promise.resolve());
            })
            .then(() => {
                return participantDeclarations.reduce((result, participantDeclaration) => {
                    let fqn = participantDeclaration.getFullyQualifiedName();
                    return this.get('Participant', fqn)
                        .catch(() => {
                            return this.add('Participant', fqn, `Participant registry for ${fqn}`);
                        });
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
        return this.dataService.getCollection('$sysregistries')
            .then((sysregistries) => {
                return sysregistries.getAll();
            })
            .then((registries) => {
                registries = registries.filter((registry) => {
                    return registry.type === type;
                });
                return registries.reduce((prev, registry) => {
                    let collectionID = registry.type + ':' + registry.id;
                    return prev.then((result) => {
                        return this.dataService.getCollection(collectionID)
                            .then((dataCollection) => {
                                result.push(new Registry(dataCollection, this.serializer, registry.type, registry.id, registry.name));
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
        return this.dataService.getCollection('$sysregistries')
            .then((sysregistries) => {
                return sysregistries.get(collectionID);
            })
            .then((registry) => {
                return this.dataService.getCollection(collectionID)
                    .then((dataCollection) => {
                        return new Registry(dataCollection, this.serializer, registry.type, registry.id, registry.name);
                    });
            });
    }

    /**
     * Add a new registry with the specified type, ID, and name.
     * @param {string} type The type of the registry.
     * @param {string} id The ID of the registry.
     * @param {string} name The name of the registry.
     * @return {Promise} A promise that is resolved when complete, or rejected
     * with an error.
     */
    add(type, id, name) {
        let collectionID = type + ':' + id;
        return this.dataService.getCollection('$sysregistries')
            .then((sysregistries) => {
                return sysregistries.add(collectionID, {
                    type: type,
                    id: id,
                    name: name
                });
            })
            .then(() => {
                return this.dataService.createCollection(collectionID);
            })
            .then((dataCollection) => {
                return new Registry(dataCollection, this.serializer, type, id, name);
            });
    }

}

module.exports = RegistryManager;
