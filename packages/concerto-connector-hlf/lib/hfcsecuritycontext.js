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

const SecurityContext = require('@ibm/concerto-common').SecurityContext;

/**
 * Class representing a logged in Hyperledger Fabric user.
 * @protected
 */
class HFCSecurityContext extends SecurityContext {

    /**
     * Constructor.
     * @param {Connection} connection The owning connection.
     */
    constructor(connection) {
        super(connection);
        this.user = null;
        this.enrolledMember = null;
        this.chaincodeID = null;
        this.eventHub = null;
    }

    /**
     * Get the current username.
     * @return {string} The username
     */
    getUser() {
        return this.user;
    }

    /**
     * Set the current username.
     * @param {string} user The username
     */
    setUser(user) {
        this.user = user;
    }

    /**
     * Get the enrolled member.
     * @return {hfc.Member} The enrolled member.
     */
    getEnrolledMember() {
        return this.enrolledMember;
    }

    /**
     * Set the enrolled member.
     * @param {hfc.Member} enrolledMember - The enrolled member.
     */
    setEnrolledMember(enrolledMember) {
        this.enrolledMember = enrolledMember;
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

    /**
     * Get the event hub.
     * @return {hfc.EventHub} The event hub.
     */
    getEventHub() {
        return this.eventHub;
    }

    /**
     * Set the event hub.
     * @param {hfc.EventHub} eventHub - The event hub.
     */
    setEventHub(eventHub) {
        this.eventHub = eventHub;
    }

}

module.exports = HFCSecurityContext;
