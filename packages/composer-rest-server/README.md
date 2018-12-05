# Hyperledger Composer REST Server

Set up the Composer REST Server with this command

```
npm install composer-rest-server -g
```

## Overview
This is a simple application that prompts the user for details of a connection profile, Business Network Identifier, participant id and participant password.  The application then starts a loopback application which uses the Hyperledger Composer LoopBack Connector to connect to the Business Network, extract the models and then present a page containing the REST APIs that have been generated for the model.

Executing those APIs will then have a real effect on the business network to which the application is connected.

## Usage

```bash  
composer-rest-server
```

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.
