# generator-composer
This is a Yeoman module for a set of Yeoman generators. These are used to create pro-forma templates for using with the Fabric Composer.
There are two current generators that can be used from the point of creating a model through to creating command line applications

The naming of this repository is following the Yeoman naming conventions.

# How do I use the generator to create an applications?
This is a quick recap of the official [Yeoman getting started](http://yeoman.io/learning/index.html) docs.

*Step 1:* Make sure that you have Yeoman installed globally

```
npm install -g yo
```

*Step 2:* Install 'angular-cli' globally

```
npm install -g angular-cli
```


*Step 3:* Install 'typings' globally

```
npm install -g typings
```


*Step 4:* Install 'bower' globally

```
npm install -g bower
```

# What are the generators I can use?

##> yo composer:app

### Description
This command generates a basic command line application which can deploy a business network and list all the asset registries.

### Limitations
- None

### Supported Examples
- DigitalProperty-Network


##> yo composer:angular

### Description
This command generates an Angular2 application which can connect to a business network and perform create, read, update and delete operations on assets.

### Limitations
- The generated application currently does not handle operations regarding participants and transactions
- The generator currently lacks certain customization and options
- Due to time restraints, the generator hasn't been tested with models which use arrays
- The generated application doesn't handle the resolution of object properties, but instead will list them as being an object type.

### Supported Examples
- CarAuction-Network
