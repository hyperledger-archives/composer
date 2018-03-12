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

const shim = require('fabric-shim');
const NodeContext = require('./nodecontext');
const Engine = require('composer-runtime').Engine;
const NodeContainer = require('./nodecontainer');

const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('Composer');

/**
 * This is the composer chaincode that implements the
 * interface required by the chaincode shim.
 *
 *
 * @class Composer
 */
class Composer {

    /**
     * Creates an instance of Composer chaincode.
     */
    constructor() {
        const method = 'constructor';
        LOG.entry(method);
        this.container = new NodeContainer();
        LOG.exit(method);
    }

    /**
     * Create an instance of the Composer engine.
     * @private
     * @return {Engine} an instance of the Composer engine.
     */
    _createEngine() {
        return new Engine(this.container);
    }

    /**
     * Create an instance of the Composer context.
     * @private
     * @param {Engine} engine the Composer engine.
     * @param {any} stub the shim instance for this invocation
     * @return {NodeContext} an instance of the Composer context.
     */
    _createContext(engine, stub) {
        return new NodeContext(engine, stub);
    }

    /**
     * Init is called when chaincode is instantiated or updated.
     * This is implemented as per the shim interface requirements.
     *
     * @param {any} stub the shim instance for this invocation
     * @returns {promise} a promise that resolves with either a shim success status or shim error status
     */
    async Init(stub) {
        const method = 'Init';
        LOG.entry(method, stub);

        let t0 = process.hrtime();
        let {fcn: fcn, params: params} = stub.getFunctionAndParameters();
        let engine = this._createEngine();
        let nodeContext = this._createContext(engine, stub);
        try {
            await this.container.initLogging(stub);
            await engine.init(nodeContext, fcn, params);
            LOG.exit(method);
            LOG.debug('@PERF Composer.' + method + ' total duration for txnID [', stub.getTxID(), '] ', process.hrtime(t0)[0], '.', process.hrtime(t0)[1]);
            return shim.success();
        }
        catch(err) {
            LOG.error(method, err);
            LOG.debug('@PERF Composer.' + method + ' total duration for txnID [', stub.getTxID(), '] ', process.hrtime(t0)[0], '.', process.hrtime(t0)[1]);
            return shim.error(err);
        }
    }

    /**
     * Invoke is called when a request to be processed by the chaincode is required.
     * This is implemented as per the shim interface requirements.
     *
     * @param {any} stub the shim instance for this invocation
     * @returns {promise} a promise that resolves with either a shim success status or shim error status
     */
    async Invoke(stub) {
        const method = 'Invoke';
        LOG.entry(method, stub);

        let {fcn: fcn, params: params} = stub.getFunctionAndParameters();
        let t0 = process.hrtime();

        let engine = this._createEngine();
        let nodeContext = this._createContext(engine, stub);
        try {
            await this.container.initLogging(stub);
            let payload = await engine.invoke(nodeContext, fcn, params);
            if (payload !== null && payload !== undefined) {
                LOG.exit(method, payload);
                LOG.debug('@PERF Composer.' + method + ' total duration for txnID [', stub.getTxID(), '] ', process.hrtime(t0)[0], '.', process.hrtime(t0)[1]);
                return shim.success(Buffer.from(JSON.stringify(payload)));
            }
            LOG.exit(method);
            LOG.debug('@PERF Composer.' + method + ' total duration for txnID [', stub.getTxID(), '] ', process.hrtime(t0)[0], '.', process.hrtime(t0)[1]);
            return shim.success();
        }
        catch(err) {
            LOG.error(method, err);
            LOG.debug('@PERF Composer.' + method + ' total duration for txnID [', stub.getTxID(), '] ', process.hrtime(t0)[0], '.', process.hrtime(t0)[1]);
            return shim.error(err);
        }
    }
}

module.exports = Composer;
