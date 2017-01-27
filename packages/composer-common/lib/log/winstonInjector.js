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

// let exports = module.exports = {};c
const fs = require('fs-extra');
const winston = require('winston');
const sprintf = require('sprintf-js').sprintf;

/** The json structure that has been specified in the configuration
 * @private
 * @param {Object} config JSON structure with specific configuration information
 * @param {Array} configElements array with the  DEBUG env variables for concerto
 *
 * @returns {Object} object that is the logger to use
  */
exports.getLogger = function (config,configElements){

    let consoleLevel;
    let fileLevel;

    if (configElements.length === 0){
        consoleLevel='error';
        fileLevel='info';
    } else {
        fileLevel=config.file.enabledLevel;
        consoleLevel=config.console.enabledLevel;
    }

    let formatterFn = function(options) {

       // Return string will be passed to logger.
        return sprintf('%s %-7s %-20s %s'
       ,options.timestamp()
       ,options.level.toUpperCase()
       ,options.message
       ,(JSON.stringify(options.meta,null,'') +'$')
      //  ,(undefined !== options.message ? options.message : '')
      //  ,(options.meta && Object.keys(options.meta).length ? JSON.stringify(options.meta,null,'') : '') +'$'
      );

    };

    let timestampFn = function() {
        return new Date(Date.now()).toISOString();
    };

    // process the file name
    let resolvedFilename = config.file.filename.replace(/PID/g, process.pid);
    let dir = './logs';
    fs.ensureDirSync(dir);

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

    winston.loggers.add('IBM-Concerto',newWinstonLogger);
    // console.log('returning winston logger',JSON.stringify(winston.loggers.get('IBM-Concerto'),' '));
    return winston.loggers.get('IBM-Concerto');


};
