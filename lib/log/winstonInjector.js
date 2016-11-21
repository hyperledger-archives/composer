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

// let exports = module.exports = {};
const winston = require('winston');
const sprintf = require('sprintf-js').sprintf;
exports.getLogger = function (config){

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

    let newWinstonLogger =  /*new(winston.Logger)(*/{
        transports: [
            new(winston.transports.Console)({
                name: 'info-file',
                timestamp: timestampFn,
                formatter: formatterFn ,
                level: config.console,
                colorize: 'true'
            }),
            new(winston.transports.File)({
                name:'debug-file',
                json:false,
                filename: config.file.filename.replace(/PID/g, process.pid),
                timestamp: timestampFn,
                formatter: formatterFn ,
                level: config.file.level,
                colorize:'true'
            })

        ]
    };/*);
    */
    winston.loggers.add('IBM-Concerto',newWinstonLogger);

    return winston.loggers.get('IBM-Concerto');


};
