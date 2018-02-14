# Composer-Integration-Tests
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
 - General CLI commands (cli.feature)
 - REST server (rest.feature)
 - Queries against a REST server (queries.feature)
 - The business network generator (generator-busnet.feature)

Usefull information:
 - The `check stdout` is based upon the last command run within the framework
 - It is possible to save an alias from the stdout to substitute back later in a future command (grep cli.feature for `alias`)
 - The REST server tests establish a series of background processes that are accessed via a `tasks` object

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



