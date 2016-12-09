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


const Client = require('@ibm/ibm-concerto-client');
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

            let businessNetworkDefinitionOutput =
                {name: businessNetworkName
                ,identifier: businessNetworkDefinition.identifier
                ,description: businessNetworkDefinition.description
                ,models : Object.keys(businessNetworkDefinition.modelManager.modelFiles)
                ,scripts : Object.keys(businessNetworkDefinition.scriptManager.scripts)
                };

            console.log(Pretty.render(businessNetworkDefinitionOutput));

            return List.getMatchingRegistries(argv, businessNetworkConnection);
        })
        .then ((result) => {
            let registryOutput = {registries :[]};

            for (let i=0; i<result.length;i++){
                let entry =
                    {id: result[i].id
                    ,name: result[i].name
                    ,registryType: result[i].registryType
                    };
                registryOutput.registries.push(entry);
            }
            console.log(Pretty.render(registryOutput));
            return result[0].getAll();
        })
        .then ((result) => {
            let assets = result;
            console.log(Pretty.render(assets));
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
      * Get default profile name
      * @param {argv} argv program arguments
      * @param {businessNetworkConnectionargv} businessNetworkConnection program arguments
      * @return {Promise} promise with array of registries matching the requested registry
      */
    static getMatchingRegistries(argv, businessNetworkConnection) {

        if (argv.registry === undefined || argv.registry === '') {
            return businessNetworkConnection.getAllAssetRegistries();
        } else {
            return businessNetworkConnection.getAssetRegistry(argv.registry)
            .then ((result) => {
                return [result];
            });
        }
    }

}

module.exports = List;
