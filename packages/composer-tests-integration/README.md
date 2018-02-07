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

## Manual testing

Sometimes you might want to run an individual test in which case you can use the tagging feature of cucumber like this.
First modify your `.feature` file to include a suitable tag.

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


