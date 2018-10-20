# generator-hyperledger-composer
This is a Yeoman module for a set of Yeoman generators. These are used to create pro-forma templates for using with the Hyperledger Composer.
There are two current generators that can be used from the point of creating a model through to creating command line applications

The naming of this repository is following the Yeoman naming conventions.

We're going to assume that you've been through the Getting Started section and would like to now start to look at writing your own application to use {{site.data.conrefs.composer_full}}.

To help getting started with this, there's a [Yeoman](http://yeoman.io/) generator that creates a suitable directory structure and helps bring in the required model and network modules.

Note:

The Yo Angular application generator only supports simple, basic business network model definitions - it is a simple application generator. The generated application (including the web forms it produces) will not support more complex types or field expressions - eg. concepts do not work, and other more complex modeled types or expressions too - you should check errors upon generation, or when using the skeleton app (eg. internal errors posted in the Angular application), and check for exceptions/validation errors in the REST server logging where the REST server was started. Note that concepts (an abstract class in the modeling language) if defined, are ignored if present in your model file, so as to complete generation of the skeleton application. It applies whether you connect to an existing business network, or generate an Angular skeleton from a business network archive (BNA) file. Complex field definitions (concepts is an example) or expressions will not appear in the generated HTML forms, and won't do,  unless you choose to go on and customise the skeleton web application yourself.

Please note the same advisory applies to the CLI generator and generated app (ie `yo hyperledger-composer:cli` below )  - the simple node JS application will not show complex  types or field expressions in any sample asset listings, and again may show exceptions etc. etc.

## Yeoman

If you don't already have it, install Yeoman

```bash
npm install -g yo
```


If you wish to use the Angular 2 Application Generator, then you will need a few other globally installed packages

```bash
npm install -g typings

npm install -g bower

npm install -g @angular/cli
```


Then install the generator for it


```bash
npm install -g generator-hyperledger-composer
```


## Running the generator

```bash
yo hyperledger-composer
```

```
Welcome to the Hyperledger Composer Skeleton Application Generator
? Please select the type of Application: (Use arrow keys)
❯ CLI Application
  Angular 2 Application
  Skeleton Business Network
```

---

# What are the generator options?


# 1. Generating a CLI Application

This generator can be ran using ```yo hyperledger-composer:cli```

### What questions does this ask?

```
Welcome to the CLI skeleton app generator
? Your NPM library name: composer-sample-app
? Short description: Test Composer project
? Author name: Sophie Black
? Author email: sophie@email.com
? NPM Module name of the Business Network to connect to: digitalproperty-network


? Is the name in NPM registry the same as the Business Network Identifier?: Yes
? What is the Connection Profile to use? defaultProfile
? Enrollment id: WebAppAdmin
? Enrollment Secret: DJY27pEnl16d
configuring: composer-sample-app
   create config/default.json
   create Dockerfile
   create gulpfile.js
   create index.js
   create package.json
   create scripts/docker-compose.yml
   create scripts/setup.sh
   create scripts/teardown.sh
   create .gitignore
```

### What does this do?
Firstly it creates a standard npm module with the usual attributes of name, author, description.
Secondly it asks a set of {{site.data.conrefs.composer_full}} questions to help create the sample structure.

- NPM Module name:  What is the name of the business network you want to connect to - and is this the same as the modules NPM registry name
- Connection Profile:  This is the connection profile used to locate ip/ports etc of the running fabric
- The EnrollmentId/Secret: Are needed to create a connection to the fabric

### Testing this has worked
The `index.js` file is a very simple application that lists the asset registries that have been defined.

---

# 2. Generating an Angular 2 Application

This generator can be ran using ```yo hyperledger-composer:angular```.

The user has the ability to generate an application in two different ways:

1. Generating the application by connecting to a running business network

2. Generating the application with a business network archive file


## Generating the application by connecting to a running business network

```
Welcome to the Hyperledger Composer Angular 2 skeleton application generator

? Do you want to connect to a running Business Network? Yes
? What is the name of the application you wish to generate?: angular-app
? Description of the application: Skeleton Hyperledger Composer Angular2 project
? Author name: Sophie Black
? Author email: sophie@email.com
? What is the Business Network Identifier?: digitalproperty-network
? What is the Connection Profile to use? defaultProfile
? Enrollment id: WebAppAdmin
? Enrollment Secret: DJY27pEnl16d
? Do you want to generate a new REST API or connect to an existing REST API?: Generate a new REST API
? What port number should the generated REST server run on?: 3000
? Should namespaces be used in the generated REST API:  Always use namespaces
About to connect to a running business network

...
```

Firstly the generator will also a series of basic regarding the application name, author, description, etc.
Then it will ask the user to enter the details required to connect a running business network.
After the generator has stopped prompting the user to answer questions, it will then attempt to connect to the business network using the details provided.
If it successfully connects to the business network, the generator will then examine the assets, transactions and participants.
The generator will then create Angular components based upon the different modelled types.

- Business Network Identifier:  This is the name of the business network you want to connect to - and is this the same as the modules NPM registry name
- Business Network Archive File: This is a business network definition archived using the Composer-CLI
- Connection Profile:  This is the connection profile used to locate IP/ports etc of the running fabric
- The EnrollmentId/Secret: Are needed to create a connection to the fabric


### REST API Options

If generating an application with a business network archive file, it is only possible to connect to an existing REST API server which is running.

When generating an application it is possible to either:

1. Generate and bundle the application with a REST API server
2. Connect to an existing REST API server

This REST API server configuration can be edited in ``APP_DIR/src/app/configuration.ts``.


### Using the Application

The application can be started using ``npm start``.

The application can be tested using ``npm test``.


## Generating the application with a business network archive file

```
Welcome to the Angular2 skeleton app generator

? Do you want to connect to a running Business Network? No
? What is the name of the application you wish to generate?: angular-app
? Description of the application: Skeleton Hyperledger Composer Angular2 project
? Author name: Sophie Black
? Author email: sophie@email.com
? What is the name of the business network archive file? (Path from the current working directory): digitalPropertyNetwork.bna
? What is the address of the running REST server?: http://localhost
? What port number is the REST server running on?: 3000
? Are namespaces used in the generated REST API:  Namespaces are used


About to read a business network archive file
Reading file: digitalPropertyNetwork.bna    

...
```

Firstly the generator will also a series of basic regarding the application name, author, description, etc.
Then it will ask the user to enter the relative path to a business network archive file.
After the generator has stopped prompting the user to answer questions, it will then attempt to read the business network archive file provided.
If it successfully reads the file, the generator will then examine the assets, transactions and participants.
The generator will then create Angular components based upon the different modelled types.


### REST API Options

If generating an application with a business network archive file, it is only possible to connect to an existing REST API server which is running.

This REST API server configuration can be edited in ``APP_DIR/src/app/configuration.ts``.


### Using the Application

The application can be started using ``npm start``.

The application can be tested using ``npm test``.

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.
