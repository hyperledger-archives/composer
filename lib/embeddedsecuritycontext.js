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

const SecurityContext = require('@ibm/ibm-concerto-common').SecurityContext;

/**
 * A security context for the web connection.
 */
class EmbeddedSecurityContext extends SecurityContext {

    /**
     * Constructor.
     * @param {Connection} connection The owning connection.
     */
    constructor(connection) {
        super(connection);
        this.chaincodeID = null;
    }

    /**
     * Get the chaincode ID.
     * @return {string} The chaincode ID.
     */
    getChaincodeID() {
        return this.chaincodeID;
    }

    /**
     * Set the chaincode ID.
     * @param {string} chaincodeID - The chaincode ID.
     */
    setChaincodeID(chaincodeID) {
        this.chaincodeID = chaincodeID;
        // if (this.eventHub) {
            // TODO: this shouldn't be here, and needs moving into Concerto once
            // the "network connect" function has been integrated.
            // this.eventHub.registerChaincodeEvent(chaincodeID, '^concerto$', (chaincodeEvent) => {
            //     let events = JSON.parse(chaincodeEvent.payload.toString());
            //     events.forEach((event) => {
            //         let eventName = event.name.replace(/:.*/, '');
            //         this.concerto.emit(eventName, event.data);
            //     });
            // });
        // }
    }

}

module.exports = EmbeddedSecurityContext;
