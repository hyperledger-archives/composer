@cli @cli-generate
Feature: Cli generate steps

    Scenario: Using the CLI, I can issue the command to generate doc for my networks
        Given I have the following folders
            | ../resources/sample-networks/carauction-network |
        And I run the following expected pass CLI command
            """
            composer archive create -t dir -a ./tmp/carauction.bna -n ./resources/sample-networks/carauction-network
            """
        When I run the following expected pass CLI command
            """
            composer generator docs -a ./tmp/carauction.bna
            """
        Then The stdout information should include text matching /Command succeeded/