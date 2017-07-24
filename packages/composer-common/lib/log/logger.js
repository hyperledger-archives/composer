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

const sprintf = require('sprintf-js').sprintf;
const Tree = require('./tree.js');


// Root node of the selection tree
let _tree = null;

// Core logger that is in use (user configurable)
let _logger = null;

// Set of instances of this logger class that acts as a proxy to the core logger
let _clInstances = {};

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
 *  - Provide hook in which application can provide an injected dependancy to route
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
 * Comming Soon: Aliases
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class Logger {

  /**
   * Constructor *THIS SHOULD ONLY BE CALLED INTERNALLY*
   * @param {String} name  Classname or other filename for this logger
   * @private
   *
   */
    constructor(name) {
        this.className = name;
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
     * Required fn here is to form up the arguements into a suitable string, and
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
            // this is the case where there are no additional arguements; data for example
            _logger.log(loglevel,sprintf('%-25s:%-25s', this.className,method+'()'),msg);
        } else {
            // loop over the aguements - if any are Errors make sure that the stack trace is captured
            let args = [];
            for(let i = 3; i < arguments.length; i++) {
                if (arguments[i] instanceof Error){
                    args.push(  {'stack' : sprintf('{%s}%s %s',arguments[i].name,arguments[i].message,arguments[i].stack,null,' ').match(/[^\r\n]+/g)});
                }else {
                    args.push(arguments[i]);
                }
            }

            _logger.log(loglevel,sprintf('%-25s:%-25s', this.className,method+'()'),msg, args);
        }

    }

    /**
     * @description initial internal log function that setups the logger to use.
     * Then it calls the normal internal log method (and modifies the original
     * function defn)
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
        const args = Array.prototype.slice.call(arguments);
        args.unshift('debug',method,'#');
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
        const args = Array.prototype.slice.call(arguments);
        args.unshift('warn',method,'?');
        this.intlog.apply(this, args);
    }

  /**
   * @description Log a message at the  _info_ level
   *
   * @param {String} method calling method
   * @param {String} msg Text Message
   * @param {stuff} data Data to log at an info level
   *
   *  @private
   */
    info(method, msg, data) {
        const args = Array.prototype.slice.call(arguments);
        args.unshift('info',method,'I');
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
        const args = Array.prototype.slice.call(arguments);
        args.unshift('verbose',method,'V');
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
        const args = Array.prototype.slice.call(arguments);
        args.unshift('error',method,'!!');
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
        const args = Array.prototype.slice.call(arguments);
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
        const args = Array.prototype.slice.call(arguments);
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
      * @description what is the debug environment variable set to
     * Note that the _envDebug property of this object is for debugging the debugging log
     * and emergency use ONLY
     *
     *  @return {String} String of the DEBUG env variable
     *
     */
    static getDebugEnv(){
        return process.env.DEBUG || this._envDebug || '';
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
     * @return {Object} with the config iformation
     *
     **/
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
   * @return {ConcertoLog} instance of a concertoLog to use
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

    /** @description gets the configuration that has been passed in to this node.js runtime
     * to control the tracing. This will update the concertLogger instance that
     * is passed in to match the settings
     *
     * @param {Logger} concertoLogger the instance of the Logger class to update
     */
    static _setupLog(concertoLogger){

        let concertoConfigElements = [];

        if (_tree === null){
        // need to do the filtering to see if this shold be enabled or not
            let string = this.getDebugEnv();
            let details = string.split(/[\s,]+/);
            // _root = new Node('root',false);
            _tree = new Tree();

            const regex = /(-?)composer:(.*)?/;
        // now we have an array of the elements that we might need to be enabled
        //
            for (let i=0; i< details.length;i++){
                let e = details[i];
                if (e === '*' || e ==='composer:*'){
                    _tree.setRootInclusion();
                }
            // determine if the element is for concerto or not
                let machResult = e.match(regex);
                if (machResult!==null){
                   // got a result that we need to trace therefore setup the child node correctly
                    _tree.addNode(machResult[2] ,(machResult[1]==='') );

                    // make a note of the debug settings that permit the config elements
                    concertoConfigElements.push(machResult[2]);
                }
            }
        }


        // need to check the config to determine what exactly we need to be using here
        if(_logger === null) {
            let localConfig = this.getLoggerConfig();

            // use the config package to get conifguration to see what we should be doing.
            // and pass the restul fo the data to the logger indicated along with the
            // array of the data that might have been passed on the DBEUG variable.
            let loggerToUse = localConfig.logger;
            let myLogger = require(loggerToUse);

            // primary used to determine what has been abled to allow the logger to
            // go into a default mode.. NOT MEANT TO BE USED FOR FILTERTING.
            _logger = myLogger.getLogger(localConfig.config,{ 'debug' : concertoConfigElements } );

        }

        // now we need to check if the name that has come in and should be traced
        concertoLogger.include = _tree.getInclusion(concertoLogger.className);

        return ;
    }

    /**
     * @description clean up the logger; required if anything is dynamically changed
     */
    static reset(){
        _tree=null;
        _logger=null;
        _clInstances=[];
    }


}


module.exports = Logger;
