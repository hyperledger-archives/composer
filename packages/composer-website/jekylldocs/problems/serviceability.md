## Composer Logging

In production and development we need to be able to solve problems both as contributors and end-users.

It can be hard to say exactly what to be logged in terms of the data; especially when writing code initially. FOr this reason it is always suggested to try and use logging as much as possible. That way a practically usable level of detail will emerge.

The code has different levels of logging that can be enabled that are the standard NPM log levels of, Error, Warn, Info, Verbose, Debug, Silly are used. (Silly is used just to be log everything - we don't have any specific points at this level. Also a None level is used to signify nothing).

Individual methods are available on the `composer-common\Logger` class - along with `entry() exit()` for methods. Entry and Exit are logged at the debug level.

### When?

When to log and at what level and components are controlled by the *DEBUG* control string, as used by many node applications. This is a comma-separated list of components. A single * means everything, and a - sign infront of any component means do *not\* log this

```
DEBUG=<moduleA>,<moduleB>
```

The string 'composer' is used to indetify Hyperledger Composer. For example

```
DEBUG=express,composer,http
```

Would log all the composer log points, as well as whatever Express and HTTP wanted to do.

#### when exactly?

To filter this at the earliest point, the syntax is extended to be

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

### Where?

The details of where the files are written are controlled as follows.

Default settings are:

* Console has _no_ logging output (the exception being and errors encountered during log setup)
* File, a set of three files, of 1Mb limited in size are written to
  * Location of this is in `~/.composer/logs`
  * A separate set of files is written on every calendar day.

Each of the 'transports' console or file can be controlled. These are controlled using the npm 'config' module (https://www.npmjs.com/package/config). Typically this is controlled by using a json file in a `config` directory in the current working directory. But this can be overriden using standard config properties.

The structure should be (including an example of application use\_

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

* Debug control string enables debug trace for everything. Equivalent to the `DEBUG=composer[debug]:*`
* Enable logging to the console, at the maximum level of error (so just errors)
* And the log file should be in an unlimited file called `./log.txt` (by default the max log level is set to silly so as to get everything). However as the [debug] is present this pre-filters the log.

#### Shortcuts

The config file above, can be specified as a single environment varaible on the command line.

```
NODE_CONFIG=' { .... JSON HERE  } '
```

For quick access for logging the following environment variables allow quick, coarse grained access

* `COMPOSER_LOGFILE` Filename to write the log file to
* `COMPOSER_LOGFILE_SIZE` maxsize property - the size per log file. Default = 10Mb
* `COMPOSER_LOGFILE_QTY` maxFiles property - the number of log files Default = 100
* `COMPOSER_LOG_CONSOLE` Max level to enable for the console, Default is none

## Examples

* `node app.js` Logs at _error_ to the ~/.composer/logs/log_date.txt
* `DEBUG=composer[info]:* node app.js` Logs at _info_ to the ~/.composer/logs/log_date.txt
* `DEBUG=composer[debug]:* COMPOSR_LOGFILE=./log.txt node app.js` Logs everything at _debug_ level to the cwd file called `log.txt`
* `COMPOSE_LOG_CONSOLE=error node app.js` Log to file and errors to the console

## Controlling trace within the runtime process

Within the container that is running the chaincode, and therefore the business network transaction functions the logging system is the same.

The major differences are how this is controlled, and where the output is formatted to.

## Format

As this is running within a container it is better to output the logs to stdout instead. This is then captured by docker or the container management system.

To achieve this there is a runtime _LoggingService_ that provides a configuration specifically for this purpose. The same framework is therefore used but with a specific configuration. This is for the `composer-runtime-hlfv1` defined as being

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

### Transaction Id

An important part of the runtime is the transaction id that is currently being used. This is essential to be able to link together all logs from client, runtime and Fabric.

To achieve this, a _callback_ mechanism is in place to permit the retrieval of data that only the runtime will know at the point in time the log call is made.

This permits the output in the logs to include the transaction id. For example _88bae779_ in this line

```
2018-01-16T12:56:58.987Z [88bae779] [INFO    ] @JS : IdentityManager         :<ResourceManager>()      Binding in the tx names and impl
```

## Control

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
