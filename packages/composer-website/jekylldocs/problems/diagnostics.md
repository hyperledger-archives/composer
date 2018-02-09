---
layout: default
title: Diagnosing Problems
category: tasks
sidebar: sidebars/accordion-toc0.md
excerpt: Diagnosing Problems
section: diagnostics
index-order: 900
---

# Overview

{{site.data.conrefs.composer_full}} uses the [Winston](https://github.com/winstonjs/winston) framework by default for producing log output. Configuration of this uses the Config framework.

>Please note: {{site.data.conrefs.composer_full}} is a framework - so your application will need to have it's own logging framework. Also, your application could also have configuration information to control {{site.data.conrefs.composer_full}}'s own logging.

For application level prodblem diagnosis, this information here will not be required. This is for finding out information to help diagnose problems with the 
{site.data.conrefs.composer_full}} itself.

# Diagnosing Composer Problems

There are two places or environments where logging takes place

- the one the application is running in
- the chain code container that executes the transaction functions.

Internally, {{site.data.conrefs.composer_full}} uses the  node.js logging package by default, with an initial level of log points and destinations set up.

## Overview

The framework will log information at these levels, as defined by Winston inline with the NPM defaults

- Error
- Warn
- Info
- Verbose
- Debug

The 'Silly' level doesn't get used.

Within in the code, log messages are written at a selection of these levels depending on the type of message. 

Application side there are two locations where these log messages are written. A text file contain the log messages, and stdout. Within the chaincode container, by default only stdout is used.

## Control of what is produced

To control both the location and the type of information that is produced a simple JSON based object configuration is used. The [Config] module is used to help assemble this JSON structure - therefore end user control can be done by environment variables and other formats that Config supports. 

Control can be broke into two parts

- What level log messages are produced at
- Where these messages are sent

### LogLevel

This is the most important and primary way logging is controlled. 


For example

```
{
    "gettingstarted": {
       "cardname": "admin@digitalproperty-network"
    },
    "ComposerConfig": {
        "debug": {
            "logger": "default",
            "config": {
                "console": {
                    "enabledLevel": "info",
                    "alwaysLevel": "none"
                },
                "file": {
                    "filename": "./trace_PID.log",
                    "enabledLevel": "silly",
                    "alwaysLevel": "info"
                }
            }
        }
    }
}
```
The first section is specific to the Getting Started application, the second `ComposerConfig` section is for the {{site.data.conrefs.composer_full}}.

- `logger` is used to refer the module that does actual logging. default is implying that this is the winston framework
- `config` is passed to the logger to control what it does.  So this section is specific to the logger in use.

## Enabling more (or less) information

The standard way of enabling node.js applications for debug is to use the `DEBUG` environment variable. So therefore

What to log is controlled by the DEBUG control string, as used by many node applications. This is a comma-separated list of components. A single * means everything, and a - sign infront of any component means do *not* log this.  {{site.data.conrefs.composer_full}} is a component. For example

```
DEBUG=express,composer,http
```

Would log all the {{site.data.conrefs.composer_full}} data, as well as whatever Express and HTTP wanted to do.

As this is a large amount of detail,  the syntax is extended to be

```
DEBUG=composer[tracelevel]:fqn/class/name
```

The [tracelevel] including the [ ] is optional and defaults to *error*;  the `fqn/class/name` is dependant on how the code is written and the name of the logger that it requests. 

Examples are

- `composer:*`  Everything at *error* level
- `composer[error]:*`  Everything at *error* level
- `composer[info]:*` Everything at *info* level
- `composer[info]:BusinessNetworkConnection`  Solely *BusinessNetworkConnection* at the *info* level
- `-composer:BusinessNetworkConnection,composer[error]:*`  Do not trace anything in the BusinessNetworkConnection class, but do trace anywhere else that has errors.  *the do not takes effect at all levels of trace*


>The values above are called the *debug control string*

### Controlling where the information goes to

#### Application side
The details of where the files are written are controlled as follows.

Default settings are:

- Console has *no* logging output (the exception being and errors encountered during log setup)
- File,  a set of three files, of 1Mb limited in size are written to
   - Location of this is in `~/.composer/logs`
   - A separate set of files is written on every calendar day.

Each of the console or file can be controlled. These are controlled using the [Config](https://www.npmjs.com/package/config) npm module used. Typically this is controlled by using a json file in a `config` directory in the current working directory. 

The structure should be (including an example of application use of the file) would look like

```
{
  "loadAssets": {
    "cardName": "admin@bsn-local"
  },
  "composer": {
    "log": {
      "debug": "composer[debug]:*",
      "console": {
        "maxLevel": "error"
      },
      "file": {
        "filename" : "./log.txt"
      }
    }
  }
}
```
This example does several things.
- Debug control string enables debug trace for everything.  Equivalent to the `DEBUG=composer[debug]:*`
- Enable logging to the console, at the maximum level of error (so just errors)
- And the log file should be in an unlimited file called `./log.txt` (by default the max log level is set to silly so as to get everything). However as the [debug] is present this pre-filters the log.


#### Shortcuts
The config file above, can be specified as a single environment variable on the command line.
```
NODE_CONFIG=' { .... JSON HERE  } '
```

For quick access for logging the following environment variables allow quick, coarse grained access

- `COMPOSER_LOGFILE` Filename to write the log file to
- `COMPOSER_LOGFILE_SIZE` maxsize property - the size per log file. Default = 10Mb
- `COMPOSER_LOGFILE_QTY` maxFiles property - the number of log files Default = 100
- `COMPOSER_LOG_CONSOLE` Max level to enable for the console, Default is none


## Examples

- `node app.js`  Logs at *error* to the ~/.composer/logs/log_date.txt
- `DEBUG=composer[info]:* node app.js` Logs at *info* to the ~/.composer/logs/log_date.txt
- `DEBUG=composer[debug]:* COMPOSR_LOGFILE=./log.txt node app.js` Logs everything at *debug* level to the cwd file called `log.txt`
- `COMPOSE_LOG_CONSOLE=error node app.js` Log to file and errors to the console

#### Chaincode Container
Within the container that is running the chaincode, and therefore the business network transaction functions the logging system is the same. 

The major differences are how this is controlled, and where the output is formatted to.

##### Format
As this is running within a container it is better to output the logs to stdout instead. This is then captured by docker or the container management system. 

To achieve this there is a runtime *LoggingService* that provides a configuration specifically for this purpose. The same framework is therefore used but with a specific configuration.  This is for the `composer-runtime-hlfv1` defined as being

```
    getDefaultCfg(){
        return {
            'logger': './winstonInjector.js',
            'debug': 'composer[error]:*',
            'console': {
                'maxLevel': 'silly'

            },
            'file': {
                'maxLevel': 'none'
            },
            'origin':'default-runtime-hlfv1',
        };
    }
```
This routes all log to the console, none to the file system. The default control string is all errors. 

##### Transaction Id
An important part of the runtime is the transaction id that is currently being used. This is essential to be able to link together all logs from client, runtime and Fabric. 

To achieve this, a *callback* mechanism is in place to permit the retrieval of data that only the runtime will know at the point in time the log call is made. 

This permits the output in the logs to include the transaction id. For example *88bae779* in this line
```
2018-01-16T12:56:58.987Z [88bae779] [INFO    ] @JS : IdentityManager         :<ResourceManager>()      Binding in the tx names and impl 
```

##### Control
The same essential control is available and is focused around provision of the 'debug control string'. Though within a container there need to be alternative ways to pass this in. Environment variables can be set for example in the docker-compose files. 

The 'setLogLevel' and 'getLogLevel' transactions, can be used to set/get the value of this debug string. The syntax of the string is the same, 

For example issuing the command to get the log level in a fresh setup...
```
$> composer network loglevel --card admin@bsn-local                                                                                                              
The current logging level is: composer[error]:*

Command succeeded
```

This can then be modified to say include all debug level log points from the TransactionHandler but still errors everywhere else
```
composer network loglevel --card admin@bsn-local -l "composer[debug]:TransactionHandler,composer[error]:*"  
The logging level was successfully changed to: composer[debug]:TransactionHandler,composer[error]:*

Command succeeded
```












