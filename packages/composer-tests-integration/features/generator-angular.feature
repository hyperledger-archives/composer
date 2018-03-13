@generator-angular
Feature: Angular Application Generator

    Background:
        Given I have admin business cards available
        And I have deployed the business network tutorial-network

    Scenario: Using the Composer generator, I can generate an Angular web application AND REST Server
        When I run the following expected pass CLI command
            | command | yo hyperledger-composer:angular |
            | --liveNetwork | true |
            | --appName | my-angular-app |
            | --appDescription | a description for my angular network |
            | --authorName | Kai Usher |
            | --authorEmail | kai@congaverse.com |
            | --license | Apache-2.0 |
            | --cardName | admin@tutorial-network |
            | --apiServer | generate |
            | --apiPort | 3000 |
            | --apiNamespace | never |
        Then I have the following files
            | ../my-angular-app/src/assets |

    Scenario: I can run the generated e2e spec and it passes
        When I run the following expected pass CLI command
            """
            npm run e2e --prefix ./my-angular-app
            """
        Then The stdout information should include text matching /SUCCESS/