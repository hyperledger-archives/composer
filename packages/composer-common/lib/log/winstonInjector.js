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

const fs = require('fs');
const path = require('path');
const winston = require('winston');
const sprintf = require('sprintf-js').sprintf;
const mkdirp = require('mkdirp');

const PRODUCT_LABEL='Hyperledger-Composer';

/**
 * This the default core logger that is used for Hyperledger-Composer. This function
 * setups up the Winston logging for both file and console output.
 *
 * @param {Object} config JSON structure with specific configuration information
 *
 * @returns {Object} object that is the logger to use
  */
exports.getLogger = function (config){

    let consoleLevel = config.console.maxLevel;
    let fileLevel = config.file.maxLevel;
    let filename = config.file.filename;

    // setup the formatter functions
    // TODO remove the sprintf fn for something faster
    let formatterFn = function(options) {

       // Return string will be passed to logger.
        return sprintf('%s %-7s %-20s %s'
       ,options.timestamp()
       ,options.level.toUpperCase()
       ,options.message
       ,(JSON.stringify(options.meta,null,'') +'$')
      );

    };

    // setup the time stamp function
    let timestampFn = function() {
        return new Date(Date.now()).toISOString();
    };


    // create the transports
    let transports =[];
    let consoleOptions = {
        name: 'info-file',
        colorize: true,
        label: PRODUCT_LABEL,
        silent: (consoleLevel===null),
        level: consoleLevel
    };

    transports.push(
            new(winston.transports.Console)(consoleOptions)
        );

    if (filename){
        let dir = path.parse(filename).dir;
        if (!fs.existsSync(dir)){
            // try to create it
            mkdirp.sync(dir);
        }

        // take the additional configuration options
        let fileConfig = {
            name:'debug-file',
            json:false,
            filename: filename,
            timestamp: timestampFn,
            formatter: formatterFn,
            level: fileLevel,
            tailable: true,
            silent: (fileLevel==='none')
        };

        if(config.file.maxFiles){
            fileConfig.maxFiles = config.file.maxFiles;
        }
        if(config.file.maxsize){
            fileConfig.maxFiles = config.file.maxsize;
        }

        transports.push(
            new(winston.transports.File)(fileConfig));

    }


    if(winston.loggers.has(PRODUCT_LABEL)){
        let logger = winston.loggers.get(PRODUCT_LABEL);
        logger.clear();
        transports.forEach( (tr) =>{
            logger.add(tr,{},true);
        });
    } else {
    // create the Winston logger with the two transports.
        let newWinstonLogger =  {
            transports: transports
        };
        // add to the Winston system and return
        winston.loggers.add(PRODUCT_LABEL,newWinstonLogger);
    }

    return winston.loggers.get(PRODUCT_LABEL);


};
