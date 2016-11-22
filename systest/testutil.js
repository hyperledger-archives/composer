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

const Concerto = require('@ibm/ibm-concerto-client').Concerto;
const net = require('net');
const Util = require('@ibm/ibm-concerto-common').Util;
const WebConnectionManager = require('@ibm/ibm-concerto-connector-web');

let concerto;
let securityContext;

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
                console.log('Calling Concerto.connect() ...');
                let concertoOptions = {
                    developmentMode: true
                };
                if (TestUtil.isKarma()) {
                    concertoOptions.connectionManager = new WebConnectionManager();
                }
                concerto = new Concerto(concertoOptions);
                let options = {
                    keyValStore: '/tmp/keyValStore',
                    membershipServicesURL: 'grpc://membersrvc:7054',
                    peerURL: 'grpc://vp0:7051',
                    eventHubURL: 'grpc://vp0:7053'
                };
                if (process.env.CONCERTO_DEPLOY_WAIT_SECS) {
                    options.deployWaitTime = parseInt(process.env.CONCERTO_DEPLOY_WAIT_SECS);
                    console.log('CONCERTO_DEPLOY_WAIT_SECS set, using: ', options.deployWaitTime);
                }
                if (process.env.CONCERTO_INVOKE_WAIT_SECS) {
                    options.invokeWaitTime = parseInt(process.env.CONCERTO_INVOKE_WAIT_SECS);
                    console.log('CONCERTO_INVOKE_WAIT_SECS set, using: ', options.invokeWaitTime);
                }
                return concerto.connect(options);
            })
            .then(function () {
                console.log('Called Concerto.connect()');
                console.log('Calling Concerto.login() ...');
                return concerto.login('WebAppAdmin', 'DJY27pEnl16d');
            })
            .then(function (result) {
                console.log('Called Concerto.login()');
                securityContext = result;
                console.log('Calling Concerto.deploy() ...');
                return concerto.deploy(securityContext);
            })
            .then(function () {
                console.log('Called Concerto.deploy()');
                console.log('');
                return Promise.resolve(concerto);
            });
    }

    /**
     * Disconnect the Concerto object.
     * @return {Promise} - a promise that wil be resolved with a configured and
     * connected instance of Concerto.
     */
    static tearDown() {
        if (!concerto) {
            throw new Error('Must call setUp successfully before calling tearDown');
        }
        console.log('Calling Concerto.disconnect() ...');
        return concerto.disconnect()
            .then(function () {
                console.log('Called Concerto.disconnect()');
            });
    }

    /**
     * Get a configured and connected instance of Concerto.
     * @return {Concerto} - a configured and connected instance of Concerto.
     */
    static getConcerto() {
        if (!concerto) {
            throw new Error('Must call setUp successfully before calling getConcerto');
        }
        return concerto;
    }

    /**
     * Get a logged in security context for interacting with Concerto.
     * @return {SecurityContext} - a logged in security context for interacting with Concerto.
     */
    static getSecurityContext() {
        if (!concerto || !securityContext) {
            throw new Error('Must call getConcerto successfully before calling getSecurityContext');
        }
        return securityContext;
    }

    /**
     * Invoke the chain-code to clear all of the world state so that any test
     * data is removed. Call in-between tests.
     * @return {Promise} - a promise that will be resolved once the chain-code
     * has been invoked.
     */
    static clearWorldState() {
        if (!concerto || !securityContext) {
            return Promise.reject(new Error('Must call getConcerto successfully before calling clearWorldState'));
        }
        return Util.invokeChainCode(securityContext, 'clearWorldState', []);
    }

}

module.exports = TestUtil;
