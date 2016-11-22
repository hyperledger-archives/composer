/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

/*
'use strict';

/**
* Defines the business network on the Hyperledger fabric
* @param {String} enrollId userID
* @param {String} enrollSecret UserID secret
* @returns {Promise} promise when business network has been defined.
*/
/*
define(enrollId, enrollSecret) {

    let createNetwork = null;
    let businessNetworkName = null;
    let concerto = new Concerto();
    let securityContext;

    businessNetworkName = this.getName();

    return new Promise ((resolve, reject) => {
        //this.validate(this);
        if (!concerto.networkExists(businessNetworkName)) {
            createNetwork = true;
            resolve(concerto.create(businessNetworkName, this.getConnectOptions()));
        }  else {
            createNetwork = false;
            resolve(concerto.connect(businessNetworkName));
        }
    })
    .then (() => {
        return concerto.login(enrollId, enrollSecret);
    })
    // Then deploy the Concerto framework.
    .then((result) => {
        // Save the security context returned by login().
        securityContext = result;
        if (createNetwork === true) {
           // Deploy the Concerto framework.
            return concerto.deploy(securityContext);
        } else {
           // Just set the chaincode ID as framework is already deployed
            securityContext.setChaincodeID(concerto.getChaincodeId(businessNetworkName));
        }
    })
    // Concerto is now deployed and ready for use.
    // Now we need to load the Concerto models.
    .then(() => {
        let modelManager = concerto.getModelManager(securityContext);
        modelManager.clearModelFiles();
        modelManager.addModelFiles(this.getModels());

        // Update the models in the Blockchain.
        return concerto.updateModels(securityContext);

    })
    .catch((error) => {
        console.error(error);
    });

}
*/
