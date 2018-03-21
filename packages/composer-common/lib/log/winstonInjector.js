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

const fs = require('fs-extra');
const winston = require('winston');
const sprintf = require('sprintf-js').sprintf;

/**
 * This the default core logger that is used for Hyperledger-Composer. This function
 * setups up the Winston logging for both file and console output.
 *
 * @param {Object} config JSON structure with specific configuration information
 * @param {Array} configElements JSON struction with the  DEBUG env variables for composer
 *
 * @returns {Object} object that is the logger to use
  */
exports.getLogger = function (config,configElements){

    let consoleLevel;
    let fileLevel;

    // if the length of the configured elements are 0 then put this into a default
    // only mode.
    if (configElements.debug.length === 0){
        consoleLevel=config.console.alwaysLevel;
        fileLevel=config.file.alwaysLevel;
    } else {
        fileLevel=config.file.enabledLevel;
        consoleLevel=config.console.enabledLevel;
    }

    // setup the formatter functions
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

    // process the file name and make sure the directory has been created
    let resolvedFilename = config.file.filename.replace(/PID/g, process.pid);

    // process the filename and get the timestampe replaced
    let d = new Date();
    let timestamp = sprintf('%d%02d%02d-%02d%02d%02d-%03d',d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate()+1,d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds());
    resolvedFilename = resolvedFilename.replace(/TIMESTAMP/g, timestamp);

    let dir = './composer-logs';
    fs.ensureDirSync(dir);

    // create the Winston logger with the two transports.
    let newWinstonLogger =  {
        transports: [
            new(winston.transports.Console)({
                name: 'info-file',
                timestamp: timestampFn,
                formatter: formatterFn ,
                level: consoleLevel
            }),
            new(winston.transports.File)({
                name:'debug-file',
                json:false,
                filename: dir+ '/' + resolvedFilename,
                timestamp: timestampFn,
                formatter: formatterFn ,
                level: fileLevel
            })

        ]
    };

    // add to the winnston system and return
    winston.loggers.add('Hyperledger-Composer',newWinstonLogger);
    return winston.loggers.get('Hyperledger-Composer');


};
