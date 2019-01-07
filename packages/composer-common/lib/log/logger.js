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
const composerUtil = require('../util');
const path = require('path');
const Tree = require('./tree.js');
const Identifiable = require('../model/identifiable');
const Typed = require('../model/typed');

// Note, sprintf is being used here solely to help format the filename of the log file.
// It is inefficient to use it for general formatting as part of logging.
const sprintf = require('sprintf-js').sprintf;

// Current configuration
let _config;

// Core logger that is in use
let _logger;

// Set of instances of this logger class that acts as a proxy to the core logger
let _clInstances = {};

// the default control string - log from everthing but only at the error level
let _envDebug = 'composer[warn]:*';

// callback to use to get additional information
let _callback;

// Settings for log levels
// These are based on the NPM log levels
// NPM log levels are
//{
//  error: 0,
//  warn: 1,
//  info: 2,
//  verbose: 3,
//  debug: 4,
//  silly: 5
//}
const LOG_LEVEL_SILLY = 5;
const LOG_LEVEL_DEBUG = 4;
const LOG_LEVEL_VERBOSE = 3;
const LOG_LEVEL_INFO = 2;
const LOG_LEVEL_WARN = 1;
const LOG_LEVEL_ERROR = 0;
const LOG_LEVEL_NONE = -1;

// Mapping between strings and log levels.
const _logLevelAsString = {
    silly: LOG_LEVEL_SILLY,
    debug: LOG_LEVEL_DEBUG,
    verbose: LOG_LEVEL_VERBOSE,
    info: LOG_LEVEL_INFO,
    warn: LOG_LEVEL_WARN,
    error: LOG_LEVEL_ERROR,
    none: LOG_LEVEL_NONE
};

// If  composer[debug]:acls is provided, the debug level of trace will be used for specified string.
const PROFILES = {
    'acls' : ['composer[#]:AccessController'],
    'hlfv1': ['composer[#]:HLFConnectionManager','composer[#]:HLFConnection',
        'composer[#]:HLFQueryHandler', 'composer[#]:HLFTxEventHandler']
};

/**
 * @description Class that provides the API to enable parts of the *Composer*
 * library to diagnostic messages.
 *
 * The aim is to provide a system whereby
 *  - The *Composer* library has a common API to call and formats the essential data
 *    its way
 *  - It's own control of what level of data points are currently being collected
 *    and for what module/class level
 *  - Provide a default console and/or file basic log if user's application doesn't have
 *    any preference
 *  - Provide hook in which application can provide an injected dependency to route
 *    tracing to its own Logger
 *
 * # Log Levels
 * Standard log levels are in use. In order these are
 *  - silly, debug, verbose, info, warn, error
 * In addition, there are functions that record method entry and method exit. these
 * map down to the debug level. [Silly level isn't being used]
 *
 * Examples of using each function are included for each API below.
 *
 * At the top of the class (or file if not object style) issue.
 *
 * ```
 * const log = require('./log/logger.js').getLog(<CLASSNAME>);
 * log.info(.....)
 * ```
 * The classname is in a fully qualified format eg common/BusinessNetworkDefinition or
 * cli/archiveCreate.
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class Logger {

    /**
     * Constructor *THIS SHOULD ONLY BE CALLED INTERNALLY*
     * Sets up an array of 25 spaces to help with speedy padding
     *
     * @param {String} name  Classname for this logger
     * @private
     */
    constructor(name) {
        this.className = name;
        // 26 due to the way this actually works...
        this.str25 = Array(26).join(' ');

        // Set a buffer length limit
        this._maxLength = 100;
    }

    /**
     * Pad a string
     * @param {String} pad padding
     * @param {String} str string
     * @return {String} padded string
     */
    padRight(pad, str) {
        return (str + pad).slice(0, pad.length);
    }

    /**
     *
     * @description Do the formatting of the data that *Composer* wishes to have for all
     * logging systems. This method does basic formatting before passing to the
     * log method of the selected logger implementation.
     *
     * Required fn here is to form up the arguments into a suitable string, and
     * process any errors to capture the stack trace.  The core logger is then CALLED
     *
     * The assumption is that this logger has a method called `log`. with this prototype
     * `log(String logLevel, String codeunit, String message, Array[optional] data)`
     *
     *
     * @private
     * @param {String} logLevel log logLevel
     * @param {String} method method name
     * @param {String} msg to log
     * @param {others} arguments parameters are treated as data points to be logged
     */
    intlog(logLevel,method,msg){
        let callbackData;

        // if callback has been registered get the data.
        callbackData = '';
        if(_callback){
            callbackData = _callback(logLevel) || '';
        }

        if (typeof arguments[3] ==='undefined'){
            // this is the case where there are no additional arguments; data for example
            _logger.log(logLevel,callbackData+':'+this.padRight(this.str25,this.className)+':'+this.padRight(this.str25,method+'()'),msg);
        } else {
            // loop over the arguments - if any are Errors make sure that the stack trace is captured
            let args = [];
            for(let i = 3; i < arguments.length; i++) {
                if (arguments[i] instanceof Error){
                    let str = '{'+arguments[i].name + '}'+ arguments[i].message+' '+ arguments[i].stack;
                    args.push(  {'stack' : str.match(/[^\r\n]+/g)});
                } else if (arguments[i] instanceof Identifiable){
                    args.push(arguments[i].getFullyQualifiedIdentifier());
                } else if (arguments[i] instanceof Typed){
                    args.push(arguments[i].getFullyQualifiedType());
                } else if (Buffer.isBuffer(arguments[i])){
                    // Check if the full length is greater than permitted + the append string
                    let appendString = '... truncated from original length of ' + arguments[i].length;
                    if(arguments[i].length>(this._maxLength + appendString.length)){
                        let truncated  = arguments[i].slice(0, this._maxLength).toString();
                        truncated += appendString;
                        args.push(truncated);
                    } else {
                        args.push(arguments[i].toString());
                    }
                } else {
                    args.push(arguments[i]);
                }
            }

            // use the local version of padding rather than sprintf etc for speed
            const preamble = callbackData + ':' + this.padRight(this.str25,this.className) + ':' + this.padRight(this.str25,method+'()');

            try {
                _logger.log(logLevel, preamble, msg, args);
            } catch(error) {
                // an error can be thrown if for example using the winsonInjector logger and an argument is
                // an InvalidRelationship where attempts to get object defined properties (which the winstonInjector does)
                // throws an error.
                let safeArgs = args.map(arg => arg.toString());
                _logger.log(logLevel, preamble, msg, safeArgs);
            }
        }

    }

    // Individual log methods follow for specific cases

    /**
     * @description Log a message at the _debug_level
     *
     * @param {String} method calling method
     * @param {String} msg Text Message
     * @param {stuff} data Data to log
     *
     * @private
     */
    debug(method, msg, data) {
        if (!(this.include && this.logLevel >= LOG_LEVEL_DEBUG)) {
            return;
        }
        const length = arguments.length;
        const args = new Array(length);
        for (let i = 0; i < length; i++) {
            args[i] = arguments[i];
        }
        args.unshift('debug');
        this.intlog.apply(this, args);
    }

    /**
     * @description Log a message at the _warn_ level
     *
     * @param {String} method calling method
     * @param {String} msg Text Message
     * @param {stuff} data Data to log at warn level
     *
     * @private
     */
    warn(method, msg, data) {
        if (!(this.include && this.logLevel >= LOG_LEVEL_WARN)) {
            return;
        }
        const length = arguments.length;
        const args = new Array(length);
        for (let i = 0; i < length; i++) {
            args[i] = arguments[i];
        }
        args.unshift('warn');
        this.intlog.apply(this, args);
    }

    /**
     * @description Log a message at the  _info_ level
     *
     * @param {String} method calling method
     * @param {String} msg Text Message
     * @param {stuff} data Data to log at an info level
     *
     * @private
     */
    info(method, msg, data) {
        if (!(this.include && this.logLevel >= LOG_LEVEL_INFO)) {
            return;
        }
        const length = arguments.length;
        const args = new Array(length);
        for (let i = 0; i < length; i++) {
            args[i] = arguments[i];
        }
        args.unshift('info');
        this.intlog.apply(this, args);
    }

    /**
     * @description Log a message at the _verbose_ level
     *
     * @param {String} method calling method
     * @param {String} msg Text Message
     * @param {stuff} data Data to log at a verbose level
     *
     * @private
     */
    verbose(method,msg, data) {
        if (!(this.include && this.logLevel >= LOG_LEVEL_VERBOSE)) {
            return;
        }
        const length = arguments.length;
        const args = new Array(length);
        for (let i = 0; i < length; i++) {
            args[i] = arguments[i];
        }
        args.unshift('verbose');
        this.intlog.apply(this, args);
    }

    /**
     * @description Log a performance message at the _verbose_ level
     *
     * @param {String} method calling method
     * @param {String} msg Text Message
     * @param {TransactionID} txId The node-sdk transaction id or null if no txid
     * @param {Date} startTime Date object representing the start of the timed block
     *
     * @private
     */
    perf(method, msg, txId, startTime) {
        if (!(this.include && this.logLevel >= LOG_LEVEL_VERBOSE)) {
            return;
        }
        const timeTaken = (Date.now() - startTime).toFixed(2);
        if (txId && txId.getTransactionID) {
            this.intlog('verbose', method, `[${txId.getTransactionID().substring(0, 8)}] ${msg} ${timeTaken}ms`);
        } else if (txId && txId.length > 0) {
            this.intlog('verbose', method, `[${txId.substring(0, 8)}] ${msg} ${timeTaken}ms`);
        } else {
            this.intlog('verbose', method, `[NO TXID ] ${msg} ${timeTaken}ms`);
        }
    }

    /**
     * @description Log a message at the _error_ level
     *
     * @param {String} method calling method
     * @param {String} msg Text Message
     * @param {stuff} data Data to log at an error level
     *
     * @private
     */
    error(method, msg,data) {
        if (!(this.include && this.logLevel >= LOG_LEVEL_ERROR)) {
            return;
        }
        const length = arguments.length;
        const args = new Array(length);
        for (let i = 0; i < length; i++) {
            args[i] = arguments[i];
        }
        args.unshift('error');
        this.intlog.apply(this, args);
    }

    /**
     * @description Logs the entry to a method at the _debug_ level
     *
     * @param {String} method Text Message.
     * @param {stuff} data Data to log at an info level
     *
     * @private
     */
    entry(method, data) {
        if (!(this.include && this.logLevel >= LOG_LEVEL_DEBUG)) {
            return;
        }
        const length = arguments.length;
        const args = new Array(length);
        for (let i = 0; i < length; i++) {
            args[i] = arguments[i];
        }
        args.shift();
        args.unshift('debug', method, '>');
        this.intlog.apply(this, args);
    }

    /**
     * @description Logs the entry to a method at the _debug_ level
     * @param {String} method Method name
     * @param {objects} data Data to log
     *
     * @private
     */
    exit(method, data) {
        if(!(this.include && this.logLevel >= LOG_LEVEL_DEBUG)) {
            return;
        }
        const length = arguments.length;
        const args = new Array(length);
        for (let i = 0; i < length; i++) {
            args[i] = arguments[i];
        }
        args.shift();
        args.unshift('debug', method, '<');
        this.intlog.apply(this, args);
    }
    /**
     * @description Method to call passing an instance of an object that has the
     * method definition
     *
     * log(level,msg,data...)
     *
     * @param {Object} newlogger sets a new log processor to the one of your choice
     *
     * @private
     */
    static setFunctionalLogger(newlogger){
        _logger = newlogger;
    }
    /**
     * Get the selection tree. This is a tree based structure to help determine what should and should not be included in the log files.
     *
     * @return {Tree} The selection tree.
     */
    static getSelectionTree() {
        return _config.tree;
    }

    /**
     * Add a default set of JSON formated LoggerConfig - programatically.
     * Overrides any user setting
     *
     * @param {Object} loggerCfg Object that has the config
     * @param {boolean} [force] If true, force a refresh of the configuration, default is false
     * @return {Object} the log configuration that is now inforce
     */
    static setLoggerCfg(loggerCfg,force=false){
        _config = Logger.processLoggerConfig(loggerCfg);
        _logger = Logger._loadLogger(_config);

        if(force){
            Object.keys(_clInstances).forEach(function(key) {
                Logger._setupLog(_clInstances[key]);
            });
        }
        return _config;
    }

    /**
     * flush out the standard composer log file and exit. This is only of use to CLI
     * applications which will log to the file system.
     * @param {*} err the exit value
     */
    static flushLogFileAndExit(err) {
        const fileTransport = _logger && _logger.transports ? _logger.transports['debug-file'] : null;
        if (fileTransport && fileTransport._stream) {
            fileTransport.on('flush', () => {
                process.exit(err);
            });
            // calling close on the logger sometimes hung the cli
            // flush could fail if there was no stream, but appears to be more reliable.
            fileTransport.flush();
        } else {
            process.exit(err);
        }

    }

    /**
     * return the log configuration that is in force, note that this method just returns the information
     * it does create, modify or delete it
     *
     * @return {Object} config data
     */
    static getLoggerCfg(){
        return _config;
    }

    /**
     * @description Get the configuration for the logging.
     * This uses the config module to look for a configuration block under the
     * composer.debug property.
     *
     * The 'logger' property is required to specify the core logger to use. By
     * default this is the 'winstonInjector' that creates and returns a Winston backed
     * console and file logger.
     *
     * The 'config' property is required - but the contents of this property are passed
     * as is to the class defined in the logger property.
     *
     * Order of precedence: (most significant to least significant)
     *   - Internal API call to setLoggerConfig()
     *   - User specified via the Config module
     *   - defaults
     *
     * @param {Object} localConfig 'starter' configuration information
     * @param {boolean} replace true if this should merge the start config and anything calculate over the top of the exist config
     * @return {Object} with the config information
     *
     */
    static processLoggerConfig(localConfig,replace=false){


        localConfig = localConfig || { 'origin': 'default-logger-module' };

        // load the config from config module - this can completely change the behaviour
        try {
            // This weird code is needed to trick browserify.
            process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
            const mod = 'config';
            const req = require;
            const config = req(mod);

            if (config.has('composer.log.logger') && !localConfig.logger){
                localConfig.logger = config.get('composer.log.logger');
            }
            if (config.has('composer.log.file') && !localConfig.file){
                localConfig.file = config.get('composer.log.file');
            }
            if (config.has('composer.log.debug') && !localConfig.debug){
                localConfig.debug = config.get('composer.log.debug');
            }
            if (config.has('composer.log.console') && !localConfig.console){
                localConfig.console = config.get('composer.log.console');
            }
        } catch (e) {
            // We don't care if we can't find the config module, it won't be
            // there when the code is running inside a browser/chaincode.
        }

        // For each part of the potential configuration apply a set of defaults
        if (!localConfig.logger){
            localConfig.logger = './winstonInjector.js' ;
        }

        // if the file section is not there, create a default
        if (!localConfig.file) {
            // process filename

            // see if there is a env variable for fast override
            let defaultFilename =  path.join(composerUtil.homeDirectory(), '.composer', 'logs', 'trace_DATESTAMP.log');
            let resolvedFilename = process.env.COMPOSER_LOGFILE || defaultFilename;
            let maxsize = process.env.COMPOSER_LOGFILE_SIZE || 10000000; //10Mb
            let maxfiles = process.env.COMPOSER_LOGFILE_QTY || 100;

            let d = new Date();
            let timestamp = sprintf('%d%02d%02d-%02d%02d%02d-%03d',d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds());
            let datestamp = sprintf('%d%02d%02d',d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());
            resolvedFilename = resolvedFilename.replace(/DATESTAMP/g, datestamp);
            resolvedFilename = resolvedFilename.replace(/TIMESTAMP/g, timestamp);
            resolvedFilename = resolvedFilename.replace(/PID/g, process.pid);

            localConfig.file =   {
                'filename': resolvedFilename,
                'maxLevel': 'silly',
                'maxsize' : maxsize,
                'maxfiles': maxfiles
            };

        }

        // if no debug ctrl variable
        if (!localConfig.debug){
            localConfig.debug = (process.env.DEBUG || _envDebug );
        }

        // if no console setting
        if (!localConfig.console){
            let consoleLevel = process.env.COMPOSER_LOG_CONSOLE || 'none';
            localConfig.console={
                'maxLevel': consoleLevel.toLowerCase()
            };
        }

        // This is an important method for parsing the control string and getting the details of what should be logged
        // This creates the tree that permits the efficient determination of what should be logger
        localConfig.tree = Logger._parseLoggerConfig(localConfig);

        // it can be useful at this point to output the config being returned.
        // see the debug_debug() fn in this class for an example on how to do it
        return localConfig;
    }

    /**
     * @description Get the logger instance to be used for this class or file.
     *
     * @param {String} classname The classname (or filename if not a class) to get the logger for
     * @return {ComposerLog} instance of a composerLog to use
     *
     * @private
     */
    static getLog(classname) {

        // see if there is a cached version of this logger for the classname, otherwise create and setup
        let composerLogger = _clInstances[classname];
        if(!composerLogger) {
            composerLogger = new Logger(classname);
            Logger._setupLog(composerLogger);
            _clInstances[classname] = composerLogger;
        }
        return composerLogger;
    }

    /**
     * @description gets the configuration that has been passed in to this node.js runtime
     * to control the tracing. This will update the composerLogger instance that
     * is passed in to match the settings
     *
     * @param {Logger} composerLogger the instance of the Logger class to update
     * @private
     */
    static _setupLog(composerLogger){

        // get the config from it's respective locations
        if (!_config){
            _config = Logger.processLoggerConfig();
        }

        // Load the logger if it hasn't been done already.
        if(!_logger) {
            _logger = Logger._loadLogger(_config);
        }

        // now we need to check if the name that has come in and should be traced
        // this is prefiltering and log level setup
        let node = Logger.getSelectionTree().getNode(composerLogger.className);
        composerLogger.include = node.isIncluded();
        composerLogger.logLevel = node.getLogLevel();
    }

    /**
     * Parse the logger configuration - sole purpose is to produce the selection tree that permits
     * the easy determination of what should and shouldn't be logged.
     *
     * @param {object} localConfig The configuration elements for the logger.
     * @return {Tree} The configuration tree.
     * @private
     */
    static _parseLoggerConfig(localConfig) {
        // need to do the filtering to see if this should be enabled or not
        let string = localConfig.debug;
        let details = string.split(/[\s,]+/);
        let tree = new Tree(false,4);

        // regex to process the debug control string
        const regex = /(-?)composer\[?(info|warn|debug|error|verbose)?\]?:([\w\/\*]*)/;

        // now we have an array of the elements that we might need to be enabled
        for (let i=0; i< details.length;i++){
            let e = details[i];
            if (e === '*'){
                tree.setRootInclusion();
                tree.setRootLevel(_logLevelAsString.info);
                break;
            }
            // determine if the element is for composer or not
            let machResult = e.match(regex);
            if (machResult!==null){
                let include = (machResult[1]==='');
                let logLevel = machResult[2];
                if (!logLevel) {
                    logLevel= 'info';
                }
                let className = machResult[3];

                // got a result that we need to trace therefore setup the child node correctly
                if (className === '*'){
                    tree.setRootInclusion();
                    tree.setRootLevel(_logLevelAsString[logLevel]);
                    break;
                }else {
                    tree.addNode(className, _logLevelAsString[logLevel], include);
                }

                // we need to support the ability to use 'profiles'. for example
                // composer:acls
                // that would then expand to include  composer[debug]:acls,composer[debug]:someotherclass
                // this has also added acls as a class node, so it is possible to specifically get a logger for acls reasons

                let additionalElements = PROFILES[className];
                if (additionalElements){
                    additionalElements.forEach((e)=>{
                        // if the string has a # in it replace with the user specified level
                        details.push( e.replace(/#/g,logLevel));
                    });
                }

            }
        }
        return tree;
    }

    /**
     * Load the logger module specified in the logger configuration, and get a logger.
     * @param {Object} localConfig The configuration elements for the logger.
     * @return {Logger} The logger.
     * @private
     */
    static _loadLogger(localConfig) {

        // attempts to load the specified logger module implementation. if not then put out an error
        const loggerToUse = localConfig.logger;
        let myLogger;
        try {
            const req = require;
            myLogger = req(loggerToUse);
        } catch (e) {
             // Print the error to the console and just use the null logger instead.
             // eslint-disable-next-line no-console
            console.error(`Failed to load logger module ${loggerToUse}: ${e.message}`);
            myLogger = {
                getLogger: () => {
                    return {
                        log: () => { }
                    };
                }
            };
        }

        // get the instance of the logger to use - passing the localConfig for reference (eg filenames)
        return myLogger.getLogger(localConfig);

        // For reference, hard coding just to get the Winston logger is as follows
        // return WinstonInjector.getLogger(localConfig);
    }

    /**
     * This is a simple callback function, to permit additional data to be inserted into the logged output
     *
     * @param {Function} fn function to be called to get information
     */
    static setCallBack(fn){
        _callback=fn;
    }

    /**
     * Get the function set as a callback
     * @return {Function} function set as the callback
     */
    static getCallBack(){
        return _callback;
    }

    /**
     * Resets the logger - for test and emergency use only
     */
    static __reset(){
        _config=null;
        _logger=null;
        _envDebug = 'composer[error]:*';
        _clInstances = {};

    }

    /**
     * Sets up the config for the cli appls
     */
    static setCLIDefaults(){
        let envVariable = process.env.DEBUG;
        if (!envVariable){
            envVariable = 'composer[info]:*';
        }
        Logger.setLoggerCfg({
            'console': {
                'maxLevel': 'silly'
            },
            'debug' : envVariable
        },true);
    }

    /**
     * Invokes all the levels of log, to be used when attempting to help with diagnostics
     *
     * @param {Logger} logger instance to call
     */
    static invokeAllLevels(logger){
        logger.debug('TestAll','Debug level message');
        logger.entry('TestAll','Entry level message');
        logger.exit('TestAll','Exit level message');
        logger.verbose('TestAll','Verbose level message');
        logger.info('TestAll','Info level message');
        logger.warn('TestAll','Warn level message');
        logger.error('TestAll','Error level message');
    }

}


module.exports = Logger;
