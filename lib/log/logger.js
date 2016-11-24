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
// const beautify = require('json-beautify');
// TODO: Will need to do improvement of the formatting with some module.
//
const sprintf = require('sprintf-js').sprintf;
// const config = require('config');
const Node = require('./node.js');

// Root node of the selection tree
let _root = null;
let _logger = {
    log: function () {

    }
};
let _clInstances = {};

/**
 * @description Class that provides the API to enable parts of the *Concerto*
 * library to diagnostic messages.
 *
 * The aim is to provide a system whereby
 *  - The *Concerto* library has a common API to call and formats the essential data
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
 * map down to the debug level.
 *
 * Examples of using each function are included for each API below.
 *
 * At the top of the class (or file if not object style).  issue.
 *
 * ```
 * const log = require('./log/logger.js').getLog(<CLASSNAME>);
 * log.info(.....)
 * ```
 *
 * @todo Confirm the format via iterative use
 * @todo Precrtiptive on how data is uploaded to logmet etc. ??
 *
 *
 * @see https://github.ibm.com/Blockchain-WW-Labs/Concerto/issues/16
 *
 * @private
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
 * @description Do the formatting of the data that *Concerto* wishes to have for all
 * logging systems. This method does basic formatting before passing to the
 * log method of the selected logger implementation.
 *
 * Internal method
 *
 * @private
 * @param {String} loglevel log loglevel
 * @param {String} method method name
 * @param {String} msg to log
 * @param {others} arguments parameters are treated as data points to be logged
 */
    intlog(loglevel,method,msg){
        // if(!this.include){return;}
        if (typeof arguments[3] ==='undefined'){
            _logger.log(loglevel,sprintf('%-25s:%-25s', this.className,method+'()'),msg);
        } else {
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
   * @description Log a message at the _debug_level
   *
   * @param {String} method calling method
   * @param {String} msg Text Message
   * @param {stuff} data Data to log
   *
   * @private
   */
    debug(method, msg, data) {
        this.intlog('debug',method,msg,data);
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
        this.intlog('warn',method,msg,data);
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
        this.intlog('info',method,msg,data);
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
        this.intlog('verbose',method,msg,data);
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
        this.intlog('error',method,msg,data);
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
        this.intlog('debug',method,'>',data);
    }

  /**
   * @description Logs the entry to a method at the _debug_ level
   * @param {String} method Method name
   * @param {objects} data Data to log
   *
   * @private
   */
    exit(method, data) {
        this.intlog('debug',method,'<',data);
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


     /** @descrption what is the debug environment variable set to
     *  @return {String} String of the DEBUG env variable
     */
    static getDebugEnv(){
        return process.env.DEBUG || this._envDebug || '';
    }

    /** get the configuration for the logging
     * @return {Object} with the config iformation     */
    static getLoggerConfig(){

        /* if (config.has('ConcertoConfig.debug')){
            return config.get('ConcertoConfig.debug');
        } else { */
        return {
            'logger': './winstonInjector.js',
            'config': {
                'console': {
                    'enabledLevel': 'info',
                    'alwaysLevel': 'none'

                },
                'file': {
                    'filename': './trace_PID.log',
                    'enabledLevel': 'silly',
                    'alwaysLevel': 'info'
                }
            }};
        /* } */

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

        // need to check the config to determine what exactly we need to be using here
        if(_logger === null) {
            let localConfig = this.getLoggerConfig();
            console.log(new Error().stack);
            // use the config package to get conifguration to see what we should be doing.

            let loggerToUse = localConfig.logger;
            let myLogger = require(loggerToUse);
            _logger = myLogger.getLogger(localConfig.config);

                // For reference a very basic fallback function to log to the console
                // _logger =  {
                //     log: function(){
                //         console.log('{\"concerto\":'+JSON.stringify(arguments)+'}');
                //     }
                // };

        }

        if (_root === null){
        // need to do the filtering to see if this shold be enabled or not
            let string = this.getDebugEnv();
            let details = string.split(/[\s,]+/);
            _root = new Node('root',false);

            const regex = /(-?)concerto:(.*)?/;
        // now we have an array of the elements that we might need to be enabled
        //
            for (let i=0; i< details.length;i++){
                let e = details[i];
                if (e === '*' || e ==='concerto:*'){
                    _root.include = true;
                }
            // determine if the element is for concerto or not
                let machResult = e.match(regex);
                if (machResult!==null){
                // got a result that we need to trace therefore setup the child node correctly

                    let newNode = new Node(machResult[2] ,(machResult[1]==='') );
                    _root.addChildNodeAtStart(newNode);

                }

            }

        }
        if(typeof _clInstances[classname] === 'undefined') {
            _clInstances[classname] = new Logger(classname);
        }

        // now we need to check if the name that has come in and should be traced
        let n = _root.findChild(classname);

        if ( typeof n ==='undefined'){
            _clInstances[classname].include = _root.isIncluded();
        } else {
            _clInstances[classname].include = n.isIncluded();
        }

        return _clInstances[classname];
    }

    /**
     * @description clean up the logger; required if anything is dynamically changed
     */
    static reset(){
        _root=null;
        _logger=null;
        _clInstances=[];
    }


}


module.exports = Logger;
