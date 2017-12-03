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
const fs = require('fs');

const Logger = require('composer-common').Logger;
const LOG = Logger.getLog('Composer');

//TODO: Good idea to have ? stops the chaincode container from abending.
process.on('unhandledRejection', (...args) => {
    console.log(args);
});

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

    _createEngine() {
        return new Engine(this.container);
    }

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
        let {fcn: fcn, params: params} = stub.getFunctionAndParameters();
        if (process.env.COMPOSER_DEV_MODE) {
            let archiveFileContents = fs.readFileSync(params[0]);
            params[0] = archiveFileContents.toString('base64');
        }

        let engine = this._createEngine();
        let nodeContext = this._createContext(engine, stub);
        try {
            await this.container.initLogging(stub);
            await engine.init(nodeContext, fcn, params);
            LOG.exit(method);
            return shim.success();
        }
        catch(err) {
            LOG.error(method, err);
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

        let engine = this._createEngine();
        let nodeContext = this._createContext(engine, stub);
        try {
            await this.container.initLogging(stub);
            let payload = await engine.invoke(nodeContext, fcn, params);
            if (payload !== null && payload !== undefined) {
                LOG.exit(method, payload);
                return shim.success(Buffer.from(JSON.stringify(payload)));
            }
            LOG.exit(method);
            return shim.success();
        }
        catch(err) {
            LOG.error(method, err);
            return shim.error(err);
        }
    }
}

module.exports = Composer;
