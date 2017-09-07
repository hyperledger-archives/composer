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

Each Business Network is deployed to it's own Chaincode container.  In the case of errors say with a transaction function, it can be helpful to look at the logs from that container and see what has happened. `docker logs <containerid>` will show the logs but you need to know the container id.

Firstly list the docker processes and look for the image name; this command will do this for you in one step

```bash
docker ps | cut -b 1-13,21-93
CONTAINER ID IMAGE                                                                    
f71e2a630d6a dev-vp0-9d0a2be10fc5b815bbca1f81c9abcb7072e33fc760342c5789c5bf9703c429c7
bb5db2ca4e6a hyperledger/fabric-peer                                                  
3ec0e41c4898 hyperledger/fabric-membersrvc     
```

The hex value after the dev-vp0 is the 'chaincodeid'. If you look in the connection profiles directory you'll see a simple JSON file that has the anem of the network mapped to the chaincode id. In this example we have two neworks listed.

```bash
cat ~/.composer-connection-profiles/defaultProfile/connection.json
{
    "type": "hlf",
    "membershipServicesURL": "grpc://localhost:7054",
    "peerURL": "grpc://localhost:7051",
    "eventHubURL": "grpc://localhost:7053",
    "keyValStore": "/home/matthew/.composer-credentials",
    "deployWaitTime": "300",
    "invokeWaitTime": "100",
    "networks": {
        "digitalproperty-network": "e3ec656109284b63d5b7b1925454c9904e6c9c82b2053ed190d2f199e0fb0dad",
        "carauction-network": "9d0a2be10fc5b815bbca1f81c9abcb7072e33fc760342c5789c5bf9703c429c7"
    }
};
```
By inspection, the ids match for the carauction-network therefore we know now which chaincode container is which.
-->
