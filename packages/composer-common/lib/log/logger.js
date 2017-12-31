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

const Tree = require('./tree.js');

// Root node of the selection tree
let _tree = null;

// Core logger that is in use (user configurable)
let _logger = null;

// Set of instances of this logger class that acts as a proxy to the core logger
let _clInstances = {};

// Settins for log levels
const LOG_LEVEL_ALL = 6;
const LOG_LEVEL_DEBUG = 5;
const LOG_LEVEL_VERBOSE = 4;
const LOG_LEVEL_INFO = 3;
const LOG_LEVEL_WARN = 2;
const LOG_LEVEL_ERROR = 1;
const LOG_LEVEL_NONE = 0;

// Mapping between strings and log levels.
const _logLevelAsString = {
    all: LOG_LEVEL_ALL,
    debug: LOG_LEVEL_DEBUG,
    verbose: LOG_LEVEL_VERBOSE,
    info: LOG_LEVEL_INFO,
    warn: LOG_LEVEL_WARN,
    error: LOG_LEVEL_ERROR,
    none: LOG_LEVEL_NONE
};

// Current log level
let _logLevel = LOG_LEVEL_ALL;

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
     * Set the new log level.
     * @param {string} logLevel The new log level.
     */
    static setLogLevel(logLevel) {
        const newLogLevel = _logLevelAsString[logLevel.toLowerCase()];
        if (newLogLevel === undefined) {
            throw new Error(`Unrecognized log level ${logLevel}`);
        }
        _logLevel = newLogLevel;
    }

    /**
     * Constructor *THIS SHOULD ONLY BE CALLED INTERNALLY*
     * @param {String} name  Classname or other filename for this logger
     * @private
     *
     */
    constructor(name) {
        this.className = name;
        this.str25 = Array(25).join(' ');
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
     * Internal method
     *
     * @private
     * @param {String} logLevel log loglevel
     * @param {String} method method name
     * @param {String} msg to log
     * @param {others} arguments parameters are treated as data points to be logged
     */
    intlog(logLevel,method,msg){
      // first we need to make sure that we have logger setup
        this._intLogFirst.apply(this,arguments);
    }

    /**
     * @description Main internal logging method
     * Required fn here is to form up the arguments into a suitable string, and
     * process any errors to capture the stack trace.  The core logger is then CALLED
     *
     * The assumption is that this logger has a method called `log`. with this prototype
     * `log(String loglevel, String codeunit, String message, Array[optional] data)`
     *
     * @param {String} loglevel log loglevel
     * @param {String} method method name
     * @param {String} msg to log
     */
    _intLogMain(loglevel,method,msg){
        if (typeof arguments[3] ==='undefined'){
            // this is the case where there are no additional arguments; data for example
            _logger.log(loglevel,this.padRight(this.str25,this.className)+':'+this.padRight(this.str25,method+'()'),msg);
        } else {
            // loop over the arguments - if any are Errors make sure that the stack trace is captured
            let args = [];
            for(let i = 3; i < arguments.length; i++) {
                if (arguments[i] instanceof Error){
                    let str = '{'+arguments[i].name + '}'+ arguments[i].message+' '+ arguments[i].stack;
                    args.push(  {'stack' : str.match(/[^\r\n]+/g)});
                }else {
                    args.push(arguments[i]);
                }
            }

            _logger.log(loglevel,this.padRight(this.str25,this.className)+':'+this.padRight(this.str25,method+'()'),msg, args);
        }

    }

    /**
     * @description initial internal log function that sets up the logger to use.
     * Then it calls the normal internal log method (and modifies the original
     * function definition)
     *
     * @param {String} logLevel log loglevel
     * @param {String} method method name
     * @param {String} msg to log
     */
    _intLogFirst(logLevel,method,msg){

       // call the setup logger to make sure that things are setup
       // this is done now to be as late as possible
        Logger._setupLog(this);

         //reroute the ingLog method to the main implementation
         // and call
        this.intLog = this._intLogMain;
        // this._intLogMain.apply(this,arguments);
        this._intLogMain.apply(this,arguments);
    }

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
        if (_logLevel < LOG_LEVEL_DEBUG) {
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
        if (_logLevel < LOG_LEVEL_WARN) {
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
        if (_logLevel < LOG_LEVEL_INFO) {
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
        if (_logLevel < LOG_LEVEL_VERBOSE) {
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
     * @description Log a message at the _error_ level
     *
     * @param {String} method calling method
     * @param {String} msg Text Message
     * @param {stuff} data Data to log at an error level
     *
     * @private
     */
    error(method, msg,data) {
        if (_logLevel < LOG_LEVEL_ERROR) {
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
        if (_logLevel < LOG_LEVEL_DEBUG) {
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
        if (_logLevel < LOG_LEVEL_DEBUG) {
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
     * Get the selection tree.
     * @return {Tree} The selection tree.
     */
    static getSelectionTree() {
        return _tree;
    }

    /**
     * Set the selection tree.
     * @param {Tree} tree The selection tree.
     */
    static setSelectionTree(tree) {
        _tree = tree;
    }

    /**
     * Get the functional logger.
     * @return {Object} The functional logger.
     */
    static getFunctionalLogger() {
        return _logger;
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
     * @description what is the debug environment variable set to
     * Note that the _envDebug property of this object is for debugging the debugging log
     * and emergency use ONLY
     *
     *  @return {String} String of the DEBUG env variable
     *
     */
    static getDebugEnv(){
        return process.env.DEBUG || Logger._envDebug || '';
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
     * @return {Object} with the config information
     *
     */
    static getLoggerConfig(){
        try {
            // This weird code is needed to trick browserify.
            process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
            const mod = 'config';
            const req = require;
            const config = req(mod);
            if (config.has('composer.debug')){
                return config.get('composer.debug');
            }
        } catch (e) {
            // We don't care if we can't find the config module, it won't be
            // there when the code is running inside a browser/chaincode.
        }

        return {
            'logger': './winstonInjector.js',
            'config': {
                'console': {
                    'enabledLevel': 'info',
                    'alwaysLevel': 'none'

                },
                'file': {

                    'filename': 'trace_TIMESTAMP.log',
                    'enabledLevel': 'debug',
                    'alwaysLevel': 'error'
                }
            }};

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
        if(typeof _clInstances[classname] === 'undefined') {
            _clInstances[classname] = new Logger(classname);
            _clInstances[classname].log = Logger._intLogFirst;
        }
        return _clInstances[classname];
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

        let configElements = [];

        // Parse the logger configuration if it hasn't been done already.
        if (_tree === null){
            _tree = Logger._parseLoggerConfig(configElements);
        }

        // Load the logger if it hasn't been done already.
        if(_logger === null) {
            _logger = Logger._loadLogger(configElements);
        }

        // now we need to check if the name that has come in and should be traced
        composerLogger.include = _tree.getInclusion(composerLogger.className);

        return ;
    }

    /**
     * Parse the logger configuration.
     * @param {string[]} configElements The configuration elements for the logger.
     * @return {Tree} The configuration tree.
     * @private
     */
    static _parseLoggerConfig(configElements) {
        // need to do the filtering to see if this should be enabled or not
        let string = Logger.getDebugEnv();
        let details = string.split(/[\s,]+/);
        let tree = new Tree();
        const regex = /(-?)composer:(.*)?/;

        // now we have an array of the elements that we might need to be enabled
        //
        for (let i=0; i< details.length;i++){
            let e = details[i];
            if (e === '*' || e ==='composer:*'){
                tree.setRootInclusion();
            }
            // determine if the element is for composer or not
            let machResult = e.match(regex);
            if (machResult!==null){
                // got a result that we need to trace therefore setup the child node correctly
                tree.addNode(machResult[2] ,(machResult[1]==='') );

                // make a note of the debug settings that permit the config elements
                configElements.push(machResult[2]);
            }
        }
        return tree;
    }

    /**
     * Load the logger module specified in the logger configuration, and get a logger.
     * @param {string[]} configElements The configuration elements for the logger.
     * @return {Logger} The logger.
     * @private
     */
    static _loadLogger(configElements) {
        let localConfig = Logger.getLoggerConfig();

        // use the config package to get configuration to see what we should be doing.
        // and pass the rest of the data to the logger indicated along with the
        // array of the data that might have been passed on the DEBUG variable.
        let loggerToUse = localConfig.logger;
        let myLogger;
        try {
            myLogger = require(loggerToUse);
        } catch (e) {
            // Print the error to the console and just use the null logger instead.
            console.error(`Failed to load logger module ${loggerToUse}: ${e.message}`);
            myLogger = {
                getLogger: () => {
                    return {
                        log: () => { }
                    };
                }
            };
        }

        // primary used to determine what has been enabled to allow the logger to
        // go into a default mode.. NOT MEANT TO BE USED FOR FILTERING.
        return myLogger.getLogger(localConfig.config,{ 'debug' : configElements } );
    }

    /**
     * @description clean up the logger; required if anything is dynamically changed
     */
    static reset(){
        _tree=null;
        _logger=null;
        _clInstances={};
        _logLevel = LOG_LEVEL_ALL;
    }

}


module.exports = Logger;
