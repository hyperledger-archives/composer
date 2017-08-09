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



const Pretty = require('prettyjson');

const DEFAULT_PROFILE_NAME = 'defaultProfile';
const cmdUtil = require('../../utils/cmdutils');

const ora = require('ora');



/**
 * <p>
 * Composer network list command
 * </p>
 * <p><a href="diagrams/List.svg"><img src="diagrams/list.svg" style="width:100%;"/></a></p>
 * @private
 */
class List {

  /**
    * Command process for network list command
    * @param {string} argv argument list from composer command
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
        let spinner;

        return (() => {
            spinner = ora('List business network '+businessNetworkName);

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
            spinner.start();
            enrollId = argv.enrollId;
            enrollSecret = argv.enrollSecret;
            businessNetworkConnection = cmdUtil.createBusinessNetworkConnection();
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
            let registrySet = [];
            if(result.constructor.name === 'Array'){
                registrySet = result;
            }
            else{
                result.assets.forEach((assetRegistry) => {
                    registrySet.push(assetRegistry);
                });
                result.participants.forEach((participantRegistry) => {
                    registrySet.push(participantRegistry);
                });
            }

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
                        if (assetSet.length===0){
                            delete listOutput.registries[registry.id].assets;
                        }
                    });

                });
            }, Promise.resolve());
        })
        .then ((result) => {
            spinner.succeed();
            console.log(Pretty.render(listOutput,{
                keysColor: 'blue',
                dashColor: 'blue',
                stringColor: 'white'
            }));
        })
        .then ((result) => {
            return businessNetworkConnection.disconnect();
        })
        .catch(error => {
            if (spinner) {
                spinner.fail();
            }
            console.log(List.getError(error));
        });
    }

    /**
     * Get message from an error object if one is given
     * @param {Error|String} error Error to be examined
     * @return {String} error message
     */
    static getError(error) {
        return error.message ? error.message : error;
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
            let registriesToReturn = {};
            return businessNetworkConnection.getAllAssetRegistries()
            .then((assetRegstries) => {
                registriesToReturn.assets = assetRegstries;
                return businessNetworkConnection.getAllParticipantRegistries();
            })
            .then((participantRegistries) => {
                registriesToReturn.participants = participantRegistries;
                return registriesToReturn;
            });
        } else {
            return businessNetworkConnection.assetRegistryExists(argv.registry)
            .then ((exists) => {
                if (exists === true) {
                    return businessNetworkConnection.getAssetRegistry(argv.registry)
                    .then ((result) => {
                        return [result];
                    });
                } else {
                    return businessNetworkConnection.participantRegistryExists(argv.registry)
                    .then((exists) => {
                        if(exists === true){
                            return businessNetworkConnection.getParticipantRegistry(argv.registry)
                            .then((result) => {
                                return [result];
                            });
                        }
                        else{
                            throw new Error('Registry '+argv.registry+' does not exist');
                        }
                    });
                }
            });
        }
    }

    /**
      * Get required assets from a specific registry
      * @param {Registry} registry to search for assets
      * @param {argv} argv program arguments
      * @param {BusinessNetworkConnection} businessNetworkConnection program arguments
      * @return {Promise} promise with array of registries matching the requested registry
      */
    static getMatchingAssets(registry, argv, businessNetworkConnection) {
        if (!argv.asset) {
            return registry.getAll();
        } else {
            return registry.get(argv.asset)
            .then ((asset) => {
                if (asset) {
                    return [asset];
                } else {
                    throw new Error('Asset '+registry.id+' does not exist');
                }
            });
        }
    }
}

module.exports = List;
