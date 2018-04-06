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
     * Initialise the logging service for the incoming request.
     * This will need to stub for the request so it saves the stub for later use.
     *
     *
     * @param {Object} stub node chaincode stub
     */
    async initLogging(stub) {
        this.stub = stub;

        let logCFG = await this.getLoggerCfg();
        Logger.setLoggerCfg(logCFG, true);

        Logger.setCallBack(function(logLevel) {
            const timestamp = new Date().toISOString();
            const shortTxId = stub.getTxID().substring(0, 8);
            return `${timestamp} [${shortTxId}] ${logLevel.toUpperCase().padEnd(8)} `;
        });

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
            let defCfg = this.getDefaultCfg();
            return defCfg;
        } else {
            let json = JSON.parse(result.toString());
            if( json.origin && json.origin==='default-logger-module'){
                json = this.getDefaultCfg();
            }
            return json;
        }
    }

    /**
     * @return {Object} the default cfg
     */
    getDefaultCfg(){

        let envVariable = process.env.CORE_CHAINCODE_LOGGING_LEVEL;
        let debugString = this.mapFabricDebug(envVariable);

        return {
            'file': {
                'maxLevel': 'none'
            },
            'console': {
                'maxLevel': 'silly'
            },
            'debug' : debugString,
            'logger': './consolelogger.js',
            'origin':'default-runtime-hlfv1'
        };
    }

    /**
     * Produce a valid and clean debug string
     * Takes away rubbish, and only permits valid values.
     * If a Fabic setting is found (see regex below) that is used in preference
     *
     * @param {String} string input value to process
     * @return {String} clean string that can be used for setting up logging.
     */
    mapCfg(string){
        let DEFAULT = 'composer[error]:*';
        // first split it up into elements based on ,
        let details = string.split(/[\s,]+/);

        // possible composer debug string
        let debugString = [];
        const fabricRegex=/^(NOTICE)|(WARNING)|(ERROR)|(CRITICAL)|(INFO)|(DEBUG)$/gi;
        const composerRegex=/(-?)composer\[?(info|warn|debug|error|verbose)?\]?:([\w\/\*]*)/;
        // loop over each
        for (let i=0; i< details.length;i++){
            // valid matches are either
            let e = details[i].trim();
            if (e === '*'){
                return DEFAULT;
            }
            if (e.match(composerRegex)){
                debugString.push(e);
            }else if (e.match(fabricRegex)){
                return this.mapFabricDebug(e);
            }
        }

        // final check - if NOTHING has turned up, then again go with the default
        if (debugString.length===0){
            return DEFAULT;
        } else {
            return debugString.join(',');
        }

    }

    /**
     * Need to map the high level fabric debug settings to a more fine grained composer level
     * For reference the NPM levels, and Composers
     * {
          error: 0,
          warn: 1,
          info: 2,
          verbose: 3,
          debug: 4,
          silly: 5
        }
     * @param {String} fabriclevel incomiong fabric level
     * @return {String} parsed fabric level string to composer.
     */
    mapFabricDebug(fabriclevel){
        let level;
        let debugString;

        if (!fabriclevel){
            level ='';
        } else {
            level = fabriclevel.toLowerCase().trim();
        }

        switch (level){
        case 'critical':
            debugString='composer[error]:*';
            break;
        case 'error':
            debugString='composer[error]:*';
            break;
        case 'warning':
            debugString='composer[warning]:*';
            break;
        case 'notice':
            debugString='composer[info]:*';
            break;
        case 'info':
            debugString='composer[verbose]:*';
            break;
        case 'debug':
            debugString='composer[debug]:*';
            break;
        default:
            debugString='composer[error]:*';
            break;
        }
        return debugString;
    }
}

module.exports = NodeLoggingService;
