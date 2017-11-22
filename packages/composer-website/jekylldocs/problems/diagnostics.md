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

The 'Silly' level doesn't get used.

## Locations of information

By default, there are two locations for data:

- One is a text file that is the location `${CurrentWorkingDir}/logs/trace_<processid>.trc`

- The other is `stdout`. By default, `stdout` will only show any data logged with a level of 'error' and the file will show any data logged with 'info' or above (i.e. info, warn and error).

## Control of what is produced

The Config module is used to locate information to control how the logs are produced.

For example

```
{
  "gettingstarted": {
       "participantId" : "WebAppAdmin",
       "participantPwd" :"DJY27pEnl16d",
       "businessNetworkIdentifier" : "digitalproperty-network",
       "connectionProfile" :"defaultProfile"
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

## Enabling more information

The standard way of enabling node.js applications for debug is to use the `DEBUG` environment variable. So therefore

```
DEBUG=composer:* node myApplication.js
```

Will enabled more tracing - this then will use the levels marked as `enabledLevel` in the configuration above.

# How to find out which chaincode container has the deployed network?

Each Business Network is deployed to it's own Chaincode container.  In the case of errors say with a transaction function, it can be helpful to look at the logs from that container and see what has happened.

To identify which Docker container has the deployed network run the following command:

    docker ps

The Docker container name should include the name of the deployed network.
