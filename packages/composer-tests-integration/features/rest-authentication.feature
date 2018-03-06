@rest @rest-authentication
Feature: Rest steps

    Background:
        Given I have admin business cards available

    Scenario: Using the REST API, I cannot ping the network without logging in
        Given I have an authenticated REST API server for tutorial-network
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

    Scenario: Using the REST API, I can ping the network after logging in
        When I make a GET request to /api/system/ping
        Then The response code should be 200
        And The response body should be JSON matching
            """
              {
                "version": _.isString,
                "participant": "org.hyperledger.composer.system.NetworkAdmin#admin",
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
