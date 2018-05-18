# Composer-Integration-Tests

Welcome to the Composer Integration test readme. Below are some notes on these tests, but before you go any further, here are some general contribution guide lines:
 - Each feature file must have its own tag
 - Each feature must be isolated from another (no relying on other test to create things for you!)
 - Each feature must runnable in isolation
 - If using a business network, each feature *must* use a different one
 - Break tests into different feature files when possible to ease maintainability
 
## Integration tests for Hyperledger Composer

To run the tests, make sure you've lerna bootstrapped and then run the script that starts the integration tests with 

```
./scripts/run-integration-tests.sh
```

Note that this leaves a load of docker containers hanging around afterwards which you can get rid of using the good old 

```
docker ps -aq | xargs docker kill
docker rm $(docker ps -aq)
```

As long as the script finishes, it should tidy up all the artifacts that are created during tests but if it fails then you 
may have to do a manual clean up.

## Features

We are testing the following:
 - General CLI commands (cli-X.feature)
 - REST server (rest.feature)
 - Queries against a REST server (queries.feature)
 - The business network generator (generator-busnet.feature)

Usefull information:
 - The `check stdout` is based upon the last command run within the framework. This means that if you run mulitple commands, you will only be able to check the stdout of the last command run.
 - It is possible to save an alias from the stdout to substitute back later in a future command (grep cli.feature for `alias`)
 - The REST server tests establish a series of background processes that are accessed via a `tasks` object
 - The CLI tests establish a series of busnets that are deployed ... be careful which you try to use each feature *must* use its own busnet to prevent cross contamination

## Manual testing
Cucumber features and individual scenarios can be run in isolation through the use of tags. Each feature file has a tag at the top; if you are adding new features, ensure that you have a tag for that feature file so that it can be run in isolation. Running a single scenario can be useful for debugging and can be achieved thorugh use of a tag above the sceanrio itself:

```
@testdeservespenguin
    Scenario: Using the CLI, I can run a composer fish command to create some fish
        When I run the following CLI command
            """
            composer fish
            """
        Then The stdout information should include text matching /your fish has been created/
```

Then you can modify the `test-inner` task in the `package.json` file to add your tag like this:

```
"test-inner": "cucumber-js --tags @testdeservespenguin",
```

The above will run the single scenario; to run the feature file in isolation, use the feature file tag.


## Testing tutorials
The file lib/tutorialsteps.js allows you to run tests that use data from the tutorials. This will use MDCodeExtractor to create an object for each of the tutorials specified in the codeBlocks object. This object will contain data from the code-block elements embedded in the tutorial. The MDCodeExtractor.extract function returns an object with the text in code-block elements at the position `object[type][subType][identifier]`.

Before writing a test that uses data from a tutorial you should add a `Given I am doing the <NAME_OF_TUTORIAL> tutorial`, where <NAME_OF_TUTORIAL> matches the object name for that tutorial in the codeBlocks object e.g. Given I am doing the developer tutorial. After this when you reference other parts of the tutorialsteps it will use data from that tutorial. 

You can set a folder for the tutorial commands to be run in by using `Given I have navigated to the folder:`. This will cause all tutorial commands thereafter (that aren't background commands) to be run inside that folder. The folder is set against the running location of the tests. Each time you update this folder you must provide the new location against the test running location e.g. if you set the location to be tutorial-network using:

```
Given I have navigated to the folder:
"""
tutorial-network
"""
```

and then set it again using: 

```
Given I have navigated to the folder:
"""
sub-directory
"""
```

you will end up in the folder `my/folders/where/the/tests/run/sub-directory`, to end up in `my/folders/where/the/tests/run/tutorial-network/sub-directory` you can use:

```
Given I have navigated to the sub folder:
"""
sub-directory
"""
```

The sub-folder command will only run when you have previously navigated to a folder.

### Accessing data in code blocks from cucumber tests
As stated above by using `Given I am doing the <NAME_OF_TUTORIAL> tutorial` you can declare which file you want to access the code-block elements from. The various commands made available by teststeps.js then allow you to access the code-block elements by their specified type and subTypes. When entering data in DataTables for these commands you can then specify that the field you entered is using data from a code-block by using `identifiedBy:<CODE_BLOCK_IDENTIFIER>`. If you do not put `identifiedBy:` in the field it will simply use the text entered for the cucumber step. The commands will select data from the tutorial's code-block elements in the format of type.subType.identifier.

Example: 

```
Given I am doing the developer tutorial
When I run the cli command from the tutorial:
    | command | identifiedBy:network-install |
```

 The command used here hardcodes the type to be `commands`, the subType is specified in the feature file here as `cli` and then the identifier is set in the table as `network-install`. Tables can have multiple rows using different `identifiedBy:` fields. If the code-block in the developer tutorial were as follows:

```
<code-block type="commands" sub-type="cli" identifier="network-start" >

    composer network start
    
</code-block>
```

then the feature written would be the same as:

```
Given I am doing the developer tutorial
When I run the cli command from the tutorial:
    | command | composer network start |
```

If you need to concatenate values in the tutorial with other values from the tutorial or hard-coded values place the value to be concatenated in the row below with a blank in the first column. For example:

```
Given I am doing the developer tutorial
When I run the cli command from the tutorial:
    | command | identifiedBy:network-install |
    | --card  | identifiedBy:card-user    |
    |         | @                         |
    |         | identifiedBy:network-name |
```

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.
