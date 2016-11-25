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

const Admin = require('@ibm/ibm-concerto-admin').Admin;
const Concerto = require('@ibm/ibm-concerto-client').Concerto;
const net = require('net');
const Util = require('@ibm/ibm-concerto-common').Util;

let admin;
let client;

/**
 * A class containing test utilities for use in Concerto system tests.
 *
 * @private
 */
class TestUtil {

    /**
     * Check to see if running under Karma.
     * @return {boolean} True if running under Karma, false if not.
     */
    static isKarma() {
        return global.window && global.window.__karma__;
    }

    /**
     * Wait for the specified hostname to start listening on the specified port.
     * @param {string} hostname - the hostname.
     * @param {integer} port - the port.
     * @return {Promise} - a promise that will be resolved when the specified
     * hostname to start listening on the specified port.
     */
    static waitForPort(hostname, port) {
        let waitTime = 30;
        if (process.env.CONCERTO_PORT_WAIT_SECS) {
            waitTime = parseInt(process.env.CONCERTO_PORT_WAIT_SECS);
            console.log('CONCERTO_PORT_WAIT_SECS set, using: ', waitTime);
        }
        return new Promise(function (resolve, reject) {
            let testConnect = function (count) {
                let s = new net.Socket();
                s.on('error', function (error) {
                    if (count > waitTime) {
                        console.error('Port has not started, giving up waiting');
                        return reject(error);
                    } else {
                        console.log('Port has not started, waiting 1 second ...');
                        setTimeout(function () {
                            testConnect(count + 1);
                        }, 1000);
                    }
                });
                s.on('connect', function () {
                    console.log('Port has started');
                    s.end();
                    return resolve();
                });
                console.log('Testing if port ' + port + ' on host ' + hostname + ' has started ...');
                s.connect(port, hostname);
            };
            testConnect(0);
        });
    }

    /**
     * Wait for the peer on the specified hostname and port to start listening
     * on the specified port.
     * @return {Promise} - a promise that will be resolved when the peer has
     * started listening on the specified port.
     */
    static waitForPorts() {
        if (TestUtil.isKarma()) {
            return Promise.resolve();
        }
        return TestUtil.waitForPort('vp0', 7051)
            .then(() => {
                return TestUtil.waitForPort('vp0', 7053);
            })
            .then(() => {
                return TestUtil.waitForPort('membersrvc', 7054);
            });
    }

    /**
     * Create a new Concerto object, connect, and deploy the chain-code.
     * @return {Promise} - a promise that wil be resolved with a configured and
     * connected instance of Concerto.
     */
    static setUp() {
        return TestUtil.waitForPorts()
            .then(function () {
                admin = new Admin();
                let adminOptions;
                if (TestUtil.isKarma()) {
                    adminOptions = {
                        type: 'web'
                    };
                } else {
                    adminOptions = {
                        type: 'hlf',
                        keyValStore: '/tmp/keyValStore',
                        membershipServicesURL: 'grpc://membersrvc:7054',
                        peerURL: 'grpc://vp0:7051',
                        eventHubURL: 'grpc://vp0:7053'
                    };
                }
                if (process.env.CONCERTO_DEPLOY_WAIT_SECS) {
                    adminOptions.deployWaitTime = parseInt(process.env.CONCERTO_DEPLOY_WAIT_SECS);
                    console.log('CONCERTO_DEPLOY_WAIT_SECS set, using: ', adminOptions.deployWaitTime);
                }
                if (process.env.CONCERTO_INVOKE_WAIT_SECS) {
                    adminOptions.invokeWaitTime = parseInt(process.env.CONCERTO_INVOKE_WAIT_SECS);
                    console.log('CONCERTO_INVOKE_WAIT_SECS set, using: ', adminOptions.invokeWaitTime);
                }
                console.log('Calling Admin.createConnectionProfile() ...');
                return admin.createConnectionProfile('testprofile', adminOptions);
            })
            .then(function () {
                console.log('Called Admin.createConnectionProfile()');
                console.log('Calling Admin.connect() ...');
                return admin.connect('testprofile', 'WebAppAdmin', 'DJY27pEnl16d');
            })
            .then(function () {
                console.log('Called Admin.connect()');
                console.log('');
                return Promise.resolve();
            });
    }

    /**
     * Disconnect the Concerto object.
     * @return {Promise} - a promise that wil be resolved with a configured and
     * connected instance of Concerto.
     */
    static tearDown() {
        if (!admin) {
            throw new Error('Must call setUp successfully before calling tearDown');
        }
        console.log('Calling Concerto.disconnect() ...');
        return admin.disconnect()
            .then(function () {
                console.log('Called Concerto.disconnect()');
            });
    }

    /**
     * Get a configured and connected instance of Admin.
     * @return {Admin} - a configured and connected instance of Admin.
     */
    static getAdmin() {
        if (!admin) {
            throw new Error('Must call setUp successfully before calling getAdmin');
        }
        return admin;
    }

    /**
     * Get a configured and connected instance of Concerto.
     * @param {string} network - the identifier of the network to connect to.
     * @return {Promise} - a promise that will be resolved with a configured and
     * connected instance of {@link Concerto}.
     */
    static getClient(network) {
        client = new Concerto();
        console.log('Calling Client.connect() ...');
        return client.connect('testprofile', network, 'WebAppAdmin', 'DJY27pEnl16d')
            .then(() => {
                return client;
            });
    }

    /**
     * Reset the business network to its initial state.
     * @return {Promise} - a promise that will be resolved when complete.
     */
    static resetBusinessNetwork() {
        if (!client) {
            return Promise.resolve();
        }
        // TODO: hack hack hack, this should be in the admin API.
        let securityContext = client.securityContext;
        if (!securityContext) {
            return Promise.resolve();
        }
        return Util.invokeChainCode(client.securityContext, 'resetBusinessNetwork', []);
    }

}

module.exports = TestUtil;
