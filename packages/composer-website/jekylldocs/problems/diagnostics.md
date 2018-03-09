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

For application level problem diagnosis, it is unlikely that you will need to be very familar with all of the information here. However a basic understanding and ability to enable the default levels of logging will be useful. 

# Diagnosing Issues

There are two places or environments where logging takes place

- the one the application is running in
- the chain code container that executes the transaction functions.

## Overview

The framework will log information at these levels, as defined by Winston inline with the NPM defaults

- Error
- Warn
- Info
- Verbose
- Debug

The code has different levels of logging that can be enabled that are the standard NPM log levels of, Error, Warn, Info, Verbose, Debug, Silly are used. (Silly is used just to be log everything - we don't have any specific points at this level. Also a None level is used to signify nothing).

Within in the code, log messages are written at a selection of these levels depending on the type of message.  Entry and Exit to functions in the code are logged specifically at the Debug level. 

Application side there are two locations where these log messages are written. A text file contain the log messages, and stdout. Within the chaincode container, by default only stdout is used.

## Control of what is produced

To control both the location and the type of information that is produced a simple JSON based object configuration is used. The [Config] module is used to help assemble this JSON structure - therefore end user control can be done by environment variables and other formats that Config supports. 

> Short cut environment variables are provided to make working with this JSON structure easy!

With that structure, control can be broke into two parts

- What level log messages are produced at
- Where these messages are sent

### What is produced?

What to log and at what level and components are controlled by the *DEBUG* control string, as used by many node applications. This is a comma-separated list of components. A single * means everything, and a - sign infront of any component means do *not\* log this

```
DEBUG=<moduleA>,<moduleB>
```

The string 'composer' is used to indetify Hyperledger Composer. For example

```
DEBUG=express,composer,http
```

Would log all the composer log points, as well as whatever Express and HTTP wanted to do.
To specifically control the Composer information a string can accept further detail.

```
DEBUG=composer[tracelevel]:fqn/class/name
```

The [tracelevel] including the [ ] is optional and defaults to _error_; the `fqn/class/name` is dependant on how the code is written and the name of the logger that it requests. (subject for more work later)

Examples are

* `composer:*` Everything at _error_ level
* `composer[error]:*` Everything at _error_ level
* `composer[info]:*` Everything at _info_ level
* `composer[info]:BusinessNetworkConnection` Solely _BusinessNetworkConnection_ at the _info_ level
* `-composer:BusinessNetworkConnection,composer[error]:*` Do not trace anything in the BusinessNetworkConnection class, but do trace anywhere else that has errors. _the do not takes effect at all levels of trace_

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
## Component Profiles

Using the debug string for another other than broad logging, requires a knowledge of what file/class to trace. If you want to take logging from say ACLs, then 
this there is the concept of 'profiles'. For example for ACLs, you can enable trace with

```
DEBUG=composer[debug]:acls
```

The syntax is the same, but internally 'acls' is expanded to a debug string specifically for ACLs. 













