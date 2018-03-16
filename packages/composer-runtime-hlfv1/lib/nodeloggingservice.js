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

const LoggingService = require('composer-runtime').LoggingService;
const LOGLEVEL_KEY = 'ComposerLogCfg';
const Logger = require('composer-common').Logger;
/**
 * Base class representing the logging service provided by a {@link Container}.
 * @protected
 */
class NodeLoggingService extends LoggingService {

    /**
     * Constructor.
     */
    constructor() {
        super();
        this.stub = null;
    }



    /**
     *
     * @param {Object} stub node chaincode stub
     */
    async initLogging(stub) {
        this.stub = stub;

        let json = await this.getLoggerCfg();
        Logger.setLoggerCfg(json,true);
        Logger.setCallBack(function(){
            return stub.getTxID().substring(0, 8);
        });
        if( json.origin && json.origin==='default-logger-module'){
            await this.setLoggerCfg(this.getDefaultCfg());
        }

    }

    /**
     *
     * @param {Object} cfg to set
     */
    async setLoggerCfg(cfg) {
        await this.stub.putState(LOGLEVEL_KEY, Buffer.from(JSON.stringify(cfg)));
    }

    /**
     * Return the logger config... basically the usual default setting for debug
     * Console only. maxLevel needs to be high here as all the logs goto the stdout/stderr
     *
     * @returns {Object} configuration
     */
    async getLoggerCfg(){

        let result = await this.stub.getState(LOGLEVEL_KEY);
        if (result.length === 0) {
            let d = this.getDefaultCfg();
            await this.setLoggerCfg(d);
            return d;

        } else {
            let json = JSON.parse(result.toString());
            return json;
        }

    }

    /**
     * @returns {String} information to add
     */
    callback(){
        if (this.stub) {
            const shortTxId = this.stub.getTxID().substring(0, 8);
            return `[${shortTxId}]`;

        } else {
            return('Warning - No stub');

        }

    }

    /**
     * @return {Object} the default cfg
     */
    getDefaultCfg(){

        let envVariable = process.env.CORE_CHAINCODE_LOGGING_LEVEL;
        if (!envVariable){
            envVariable = 'composer[error]:*';
        }
        return {
            'file': {
                'maxLevel': 'none'
            },
            'console': {
                'maxLevel': 'silly'
            },
            'debug' : envVariable,
            'logger': './consolelogger.js',
            'origin':'default-runtime-hlfv1'
        };
    }
}

module.exports = NodeLoggingService;
