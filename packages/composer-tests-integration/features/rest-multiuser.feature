@rest @rest-multiuser
Feature: Rest steps

    Background:
        Given I have admin business cards available

    Scenario: Using the REST API, I cannot ping the network without logging in
        Given I have a multiple user REST API server for tutorial-network
        And I have cleared the cookie jar
        When I make a GET request to /api/system/ping
        Then The response code should be 401

    Scenario: Using the REST API, I can log in using my credentials
        When I make a POST request to /auth/ldap
            """
            {
              "username": "alice",
              "password": "al1ceRuleZ"
            }
            """
        Then The response code should be 200

    Scenario: Using the REST API, I cannot ping the network because I do not have a business network card in my wallet
        When I make a GET request to /api/system/ping
        Then The response code should be 500

    Scenario: Using the CLI, I can create a new participant called Alice
        When I run the following expected pass CLI command
            """
            composer participant add --card admin@tutorial-network -d '{"$class":"org.acme.biznet.Trader","tradeId":"alice@email.com","firstName":"Alice","lastName":"Aardvark"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue a business network card to the participant called Alice
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@tutorial-network -u alice1 -a org.acme.biznet.Trader#alice@email.com -f ./tmp/alice1@tutorial-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/alice1@tutorial-network.card |

    Scenario: Using the REST API, I can import a business network card into my wallet
        When I make a POST request with form data to /api/wallet/import
            | name | value                              |
            | card | ./tmp/alice1@tutorial-network.card |
        Then The response code should be 204

    Scenario: Using the REST API, I can ping the network after importing a business network card into my wallet
        When I make a GET request to /api/system/ping
        Then The response code should be 200
        And The response body should be JSON matching
            """
              {
                "version": _.isString,
                "participant": "org.acme.biznet.Trader#alice@email.com",
                "identity": _.isString
              }
            """

    Scenario: Using the REST API, I can log out
        When I make a GET request to /auth/logout
        Then The response code should be 200

    Scenario: Using the REST API, I cannot ping the network after logging out
        When I make a GET request to /api/system/ping
        Then The response code should be 401

    Scenario: Using the REST API, I can log in using a different set of credentials
        When I make a POST request to /auth/ldap
            """
            {
              "username": "bob",
              "password": "b0bIsB3tt3r"
            }
            """
        Then The response code should be 200

    Scenario: Using the REST API, I cannot ping the network because I do not have a business network card in my wallet
        When I make a GET request to /api/system/ping
        Then The response code should be 500

    Scenario: Using the CLI, I can create a new participant called Bob
        When I run the following expected pass CLI command
            """
            composer participant add --card admin@tutorial-network -d '{"$class":"org.acme.biznet.Trader","tradeId":"bob@email.com","firstName":"Bob","lastName":"Bobbington"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue a business network card to the participant called Bob
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@tutorial-network -u bob1 -a org.acme.biznet.Trader#bob@email.com -f ./tmp/bob1@tutorial-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/bob1@tutorial-network.card |

    Scenario: Using the REST API, I can import a business network card into my wallet
        When I make a POST request with form data to /api/wallet/import
            | name | value                              |
            | card | ./tmp/bob1@tutorial-network.card |
        Then The response code should be 204

    Scenario: Using the REST API, I can ping the network after importing a business network card into my wallet
        When I make a GET request to /api/system/ping
        Then The response code should be 200
        And The response body should be JSON matching
            """
              {
                "version": _.isString,
                "participant": "org.acme.biznet.Trader#bob@email.com",
                "identity": _.isString
              }
            """

    Scenario: Using the REST API, I can log out
        When I make a GET request to /auth/logout
        Then The response code should be 200

    Scenario: Using the REST API, I cannot ping the network after logging out
        When I make a GET request to /api/system/ping
        Then The response code should be 401

        Scenario: Using the REST API, I can log back in using my original set of credentials
        When I make a POST request to /auth/ldap
            """
            {
              "username": "alice",
              "password": "al1ceRuleZ"
            }
            """
        Then The response code should be 200

    Scenario: Using the REST API, I can ping the network as the business network card in my wallet has been persisted
        When I make a GET request to /api/system/ping
        Then The response code should be 200
        And The response body should be JSON matching
            """
              {
                "version": _.isString,
                "participant": "org.acme.biznet.Trader#alice@email.com",
                "identity": _.isString
              }
            """

    Scenario: Using the REST API, I can log out
        When I make a GET request to /auth/logout
        Then The response code should be 200

    Scenario: Using the REST API, I cannot ping the network after logging out
        When I make a GET request to /api/system/ping
        Then The response code should be 401

    Scenario: Finally, shutdown the REST server
        When I shutdown the REST server
