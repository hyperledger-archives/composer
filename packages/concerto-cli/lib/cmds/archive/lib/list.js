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

const Admin = require('@ibm/concerto-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const fs = require('fs');

/**
 * <p>
 * Concerto List Archive command
 * </p>
 *
 * @private
 */
class ListBNA {

  /**
    * Command process for deploy command
    * @param {string} argv argument list from concerto command

    * @return {Promise} promise when command complete
    */
    static handler(argv) {

        console.log('Listing Business Network Archive from '+argv.archiveFile);
        let readFile = fs.readFileSync(argv.archiveFile);
        return BusinessNetworkDefinition.fromArchive(readFile).then((businessNetwork) => {
            console.log('Identifier:'+businessNetwork.getIdentifier());
            console.log('Name:'+businessNetwork.getName());
            console.log('Version:'+businessNetwork.getVersion());

            // console.log(businessNetwork.modelManager.modelFiles);
            return;

        });
    }

}

module.exports = ListBNA;
