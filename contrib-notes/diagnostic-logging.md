# Diagnostic logging
Hyperledger Composer has a functional logger that can be used for both informational and diagnostic log messages. It also permits customization for different logging 'back-ends'.

## Log points
Log points are added throughout the codebase, and should be very similar to other logging systems. The following APIs match to the standard log levels of *debug, verbose, info, warn, error*  Note that *silly* isn't being used.

```javascript
debug(method, msg, data);
verbose(method, msg, data);
info(method, msg, data);
warn(method, msg, data);
error(method, msg, data);
```

In addition, there are `entry` and `exit` APIs for use to indicate the entry and exit of functions - these are logged at the *debug* level.

```javascript
entry(method, data);
entry(method, data);
```

These methods are called on a `logger` object. To obtain one of these the following code at the top of the file should be used.

```javascript
\\ For the businessnetworkdefinition.js file in the composer-common module
const LOG = Logger.getLog('common/BusinessNetworkDefinition');
```

## Usage within the code.

Taking the `businessnetworkdefinition.js` file as an example, these are some real log statements:

```javascript
constructor(identifier, description, packageJson, readme) {
    const method = 'constructor';
    LOG.entry(method, identifier, description);

    // ----
    LOG.info(method, 'Created package.json' + JSON.stringify(packageJson));
    // ----
    LOG.debug(method, 'Found model file, loading it', file.name);
    // ----

    LOG.exit(method);
}
```

All the log APIs can take a variable number of data arguments for logging. Any *error* object is logged will have it's stack trace located.

## Enabling the logging

In commong with other node.js applications, the `DEBUG` environment variable is used. This takes a comma separated list of the modules that need to be logged.

Examples

 - `DEBUG=*`          Logs everything from everything (not just Hyperledger-Composer)
 - `DEBUG=composer:*` Logs everything from just Hyperledger-Composer
 - `DEBUG=*,!composer:*` Logs everything from everything with the exception of Hyperledger-Composer
 - `DEBUG=composer:common` Logs everything from the Hyperledger-Composer common module (the composer-common npm module)
 - `DEBUG=composer:client,composer:common` Logs everything from the Hyperledger-Composer common module (the composer-common npm module), and the client module
 - `DEBUG=composer:common:businessnetworkdefinition` Logs the businessnetworkdefinition ONLY

## Controlling the level and output

The structure of the Hyperledger-Composer log code is that it delegates the actually logging to a back-end service. This service can swapped by using configuration (see below) but by default uses the Winston library.

### Default configuration
There are two streams setups in the default configuration - one to write log events to a file, the other to the console.  

If log is not enabled for Hyperledger-Composer no events are sent to the Console but info events are sent to the file
If the log is enabled then info events are sent to the console and all level of events are sent to the file.

The file by default is written to a directory off the current working directory called `logs` with the name `trace_<processid>.log`

### Configuring the default logger

Configuration is handled by using the config package - a config file called default.json is unless the code has specified something else.
As an example - the default configuration of the logger would be represented in this file as

```
$ cat ./config/default.json
{



  "hyperledger-composer": {
	   "debug": {
       "logger": "./winstonInjector.js",
       "config": {
         'console': {
             'enabledLevel': 'info',
             'alwaysLevel': 'none'

         },
         'file': {

             'filename': 'trace_PID.log',
             'enabledLevel': 'silly',
             'alwaysLevel': 'info'
         }
          }
		}
	}

}
```
### Modifying the Winston logger
Here are two examples of how to change the back-end logger simply using Winston's changeable transport feature.

Two cloud hosted application log sites are *Loggly.com* and *Papertrailapp.com*

#### Logger class
Create a new js file, eg `winstonPapertrailInjector.js`

```javascript
'use strict';

const fs = require('fs-extra');
const winston = require('winston');
const sprintf = require('sprintf-js').sprintf;

//
// Requiring `winston-papertrail` will expose
// `winston.transports.Papertrail`
//
require('winston-papertrail').Papertrail;

/** The json structure that has been specified in the configuration
 * @private
 * @param {Object} config JSON structure with specific configuration information
 * @param {Array} configElements array with the  DEBUG env variables for composer
 *
 * @returns {Object} object that is the logger to use
  */
exports.getLogger = function (config,configElements){

    let consoleLevel;
    let logglyLevel;

    if (configElements.debug.length === 0){
        consoleLevel='error';
        logglyLevel='info';
    } else {
        papertrailLevel=config.papertrail.enabledLevel;
        consoleLevel=config.console.enabledLevel;
    }

    let formatterFn = function(options) {
       // Return string will be passed to logger.
        return sprintf('%s %-7s %-20s %s'
       ,options.timestamp()
       ,options.level.toUpperCase()
       ,options.message
       ,(JSON.stringify(options.meta,null,'') +'$')
      );

    };

    let timestampFn = function() {
        return new Date(Date.now()).toISOString();
    };

    // this is the key part to route to Papertrail - the host and port
    let newWinstonLogger =  {
        transports: [
            new(winston.transports.Papertrail)( {
                name:'papertrail',
                host: 'logs5.papertrailapp.com',
                port: '34662',
                timestamp: timestampFn,
                formatter: formatterFn ,
                level: papertrailLevel,
                json:true
            })

        ]
    };

    winston.loggers.add('Hyperledger-Composer',newWinstonLogger);
    return winston.loggers.get('Hyperledger-Composer');


};

```

and in a configuration file - where the logger is a reference to the code above.

```
{
  "hyperledger-composer": {
     "debug": {
       "logger": "/home/matthew/github/waste-notes/winstonPapertrailInjector.js",
       "config": {
          "console": {
            "enabledLevel": "info",
            "alwaysLevel": "none"
          },"papertrail": {
            "enabledLevel": "silly",
            "alwaysLevel": "info"
            }
          }
    }
  }
}
```
