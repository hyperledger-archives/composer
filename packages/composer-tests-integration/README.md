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

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the [LICENSE](LICENSE) file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.