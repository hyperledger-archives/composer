---
layout: default
title: Diagnosing Problems
category: tasks
sidebar: sidebars/accordion-toc0.md
excerpt: Diagnosing Problems
section: diagnostics
index-order: 900
---

# Diagnosing Problems

Composer uses the Winston logging module by default - and will use the Config module to look for any configuration information. If none is found, then a set of defaults will be used.

The config module does write out a warning, if there are no configuration files set. Eg. `WARNING: No configurations found in configuration directory`. This can be suppressed with an environment variable if you are happy with the defaults and don't wish to use config in your application. See more information [here](https://github.com/lorenwest/node-config/wiki/Environment-Variables#suppress_no_config_warning).


# Diagnosing Problems

If something should ever go wrong with an application, what should you do about getting diagnostics?

Let's look at the `digitalproperty-app` sample, and use that to explain how to get diagnostics out of the framework.

>Please note: This is a framework - so your application will need to have it's own logging framework. Also, your application could also have configuration information to control {{site.data.conrefs.composer_full}}'s own logging.

There are two containers that are relevant to logging;

- the one the application is running in, and
- the chain code container that executes the transaction functions.

## Application

Internally, {{site.data.conrefs.composer_full}} uses the [Winston](https://github.com/winstonjs/winston) node.js logging package by default, with an initial level of log points and destinations set up.

## Default Configuration

The framework will log information at these levels.

- Error
- Warn
- Info
- Verbose
- Debug

In the {{site.data.conrefs.composer_full}} source code, `Entry` and `Exit` logs are produced at the beginning and end of a function. These logs are reported at the **Debug** level for problem diagnosis.

In an application environment, logs can be found either in a text file, or in stdout. In the chaincode container, only stdout is used.


## Control of what is produced

To control both the location and the type of information that is produced a simple JSON based object configuration is used. The [Config] module is used to help assemble this JSON structure - therefore end user control can be done by environment variables and other formats that Config supports.

> Short cut environment variables are provided to make working with this JSON structure easy!

With that structure, control can be broke into two parts

- What level log messages are produced at
- Where these messages are sent

### What is produced?

Logging content, and when logs are displayed is controlled by the **DEBUG** control string, in the same way as many other node applications. The **DEBUG** string is a comma separated list of components, a `*` indicates that everything from the component will be logged, a `-` indicates that nothing will be logged. Care should be taken when using `-` to specify nothing will be logged, as it affects **all** logging levels, not only the default logging level. The **DEBUG** string takes the following format:

```
DEBUG=<moduleA>,<moduleB>
```

When including {{site.data.conrefs.composer_full}}, the string `composer` is used. For more specific logging control, the **DEBUG** string can accept further detail in the following format:

```
DEBUG=composer[tracelevel]:fqn/class/name
```

In the preceding example, [tracelevel] indicates the logging level to specify, and defaults to **error**; `fqn/class/name` is dependant on how the source code and name of the logger that it requests.

The following are examples of **debug control strings**:

* `composer:*` Everything at _error_ level
* `composer[error]:*` Everything at _error_ level
* `composer[info]:*` Everything at _info_ level
* `composer[info]:BusinessNetworkConnection` Solely _BusinessNetworkConnection_ at the _info_ level
* `-composer:BusinessNetworkConnection,composer[error]:*` Do not trace anything in the BusinessNetworkConnection class, but do trace anywhere else that has errors.


### Log output location

The details of where the files are written are controlled as follows.

Default settings are:

- Console has *no* logging output (the exception being and errors encountered during log setup)
- File,  a set of three files, of 1Mb limited in size are written to
   - Location of this is in `~/.composer/logs`
   - A separate set of files is written on every calendar day.

Each of the console or file can be controlled. These are controlled using the [Config](https://www.npmjs.com/package/config) npm module used. Typically this is controlled by using a json file in a `config` directory in the current working directory.

The structure should use the following format:

```
{
  "loadAssets": {
    "cardName": "admin@example-network"
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
```

This example does several things.

- The debug control string enables debug trace for everything.  Equivalent to the `DEBUG=composer[debug]:*`
- It enables logging to the console, at the maximum level of error (so just errors)
- And the log file should be in an unlimited file called `./log.txt` (by default the max log level is set to silly so as to get everything). However as the [debug] is present this pre-filters the log.


#### Shortcuts

The preceding config file can be specified as a single environment variable on the command line.

```
NODE_CONFIG=' { .... JSON HERE  } '
```

- `logger` is used to refer the module that does actual logging. default is implying that this is the winston framework
- `config` is passed to the logger to control what it does.  So this section is specific to the logger in use.

## Enabling more information

The standard way of enabling node.js applications for debug is to use the `DEBUG` environment variable. So therefore

## Examples

- `node app.js`  Logs at *error* to the ~/.composer/logs/log_date.txt
- `DEBUG=composer[info]:* node app.js` Logs at *info* to the ~/.composer/logs/log_date.txt
- `DEBUG=composer[debug]:* COMPOSER_LOGFILE=./log.txt node app.js` Logs everything at *debug* level to the cwd file called `log.txt`
- `COMPOSER_LOG_CONSOLE=error node app.js` Log to file and errors to the console

#### Chaincode Container

Within the container that is running chaincode, and therefore the business network transaction functions the logging system is the same. However, logging control and log output location differ.

##### Output location

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

For example issuing the command to get the log level in a fresh setup:

```
composer network loglevel --card admin@bsn-local                                                                                                              
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
