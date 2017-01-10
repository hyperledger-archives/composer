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


const Client = require('@ibm/concerto-client');
const Pretty = require('prettyjson');
const BusinessNetworkConnection = Client.BusinessNetworkConnection;
const DEFAULT_PROFILE_NAME = 'defaultProfile';
const cmdUtil = require('../../utils/cmdutils');

/**
 * <p>
 * Concerto network list command
 * </p>
 * <p><a href="diagrams/List.svg"><img src="diagrams/list.svg" style="width:100%;"/></a></p>
 * @private
 */
class List {

  /**
    * Command process for network list command
    * @param {string} argv argument list from concerto command
    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        let businessNetworkConnection;
        let enrollId;
        let enrollSecret;
        let connectionProfileName = List.getDefaultProfileName(argv);
        let businessNetworkName = argv.businessNetworkName;
        let businessNetworkDefinition;
        let listOutput;

        return (() => {

            console.log ('List business network '+businessNetworkName);
            if (!argv.enrollSecret) {
                return cmdUtil.prompt({
                    name: 'enrollmentSecret',
                    description: 'What is the enrollment secret of the user?',
                    required: true,
                    hidden: true,
                    replace: '*'
                })
                .then((result) => {
                    argv.enrollSecret = result;
                });
            } else {
                return Promise.resolve();
            }
        })()
        .then (() => {
            enrollId = argv.enrollId;
            enrollSecret = argv.enrollSecret;
            businessNetworkConnection = new BusinessNetworkConnection();
            return businessNetworkConnection.connect(connectionProfileName, businessNetworkName, enrollId, enrollSecret);

        })
        .then ((result) => {
            businessNetworkDefinition = result;

            listOutput =
            {name: businessNetworkName
            ,identifier: businessNetworkDefinition.identifier
            ,description: businessNetworkDefinition.description
            ,models : Object.keys(businessNetworkDefinition.modelManager.modelFiles)
            ,scripts : Object.keys(businessNetworkDefinition.scriptManager.scripts)
            ,registries : {}
            };

            return List.getMatchingRegistries(argv, businessNetworkConnection);
        })
        .then ((result) => {
            let serializer = businessNetworkDefinition.getSerializer();
            let registrySet = result;

            return registrySet.reduce((result, registry) => {
                return result.then(() => {
                    let entry =
                        {id: registry.id
                        ,name: registry.name
                        ,registryType: registry.registryType
                        ,assets : {}
                        };
                    listOutput.registries[registry.id] = entry;

                    return List.getMatchingAssets(registry, argv, businessNetworkConnection)
                    .then ((result) => {
                        let assetSet = result;
                        for (let j=0; j<assetSet.length;j++) {
                            let outputJSON = serializer.toJSON(assetSet[j]);
                            listOutput.registries[registry.id].assets[assetSet[j].getIdentifier()] = outputJSON;
                        }
                    });

                });
            }, Promise.resolve());
        })
        .then ((result) => {
            console.log(Pretty.render(listOutput));
        })
        .then ((result) => {
            return businessNetworkConnection.disconnect();
        });
    }

    /**
      * Get default profile name
      * @param {argv} argv program arguments
      * @return {String} defaultConnection profile name
      */
    static getDefaultProfileName(argv) {
        return argv.connectionProfileName || DEFAULT_PROFILE_NAME;
    }

    /**
      * Get required registries
      * @param {argv} argv program arguments
      * @param {businessNetworkConnectionargv} businessNetworkConnection program arguments
      * @return {Promise} promise with array of registries matching the requested registry
      */
    static getMatchingRegistries(argv, businessNetworkConnection) {

        let getAllRegistries;
        if (argv.registry !== undefined && argv.registry !== '') {
            getAllRegistries = false;
        } else {
            getAllRegistries = true;
        }

        if (getAllRegistries) {
            return businessNetworkConnection.getAllAssetRegistries();
        } else {
            return businessNetworkConnection.existsAssetRegistry(argv.registry)
            .then ((exists) => {
                if (exists === true) {
                    return businessNetworkConnection.getAssetRegistry(argv.registry)
                    .then ((result) => {
                        return [result];
                    });
                } else {
                    throw new Error('Registry '+argv.registry+' does not exist');
                }
            });
        }
    }

    /**
      * Get required assets from a specific registry
      * @param {registry} registry to search for assets
      * @param {argv} argv program arguments
      * @param {businessNetworkConnectionargv} businessNetworkConnection program arguments
      * @return {Promise} promise with array of registries matching the requested registry
      */
    static getMatchingAssets(registry, argv, businessNetworkConnection) {
        if (argv.asset === undefined) {
            return Promise.resolve([]);
        } else if (argv.asset === '') {
            return registry.getAll();
        } else {
            return registry.exists(argv.asset)
            .then ((exists) => {
                if (exists === true) {
                    return registry.get(argv.asset)
                    .then ((asset) => {
                        return [asset];
                    });
                } else {
                    throw new Error('Asset '+argv.asset+' does not exist');
                }
            });
        }
    }
}

module.exports = List;
