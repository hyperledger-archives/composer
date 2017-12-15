Feature: Rest steps

    Scenario: Using the REST API, I can ping the network
        Given I have a REST API server for tutorial-network
        When I make a GET request to /api/system/ping
        Then The response code should be 200
        And The response body should be JSON matching
            """
              {
                "version": _.isString,
                "participant": "org.hyperledger.composer.system.NetworkAdmin#admin"
              }
            """

    Scenario: Using the REST API, I get the list of Traders
        Given I have a REST API server for tutorial-network
        When I make a GET request to /api/Trader
        Then The response code should be 200
        And The response body should be JSON matching
            """
            []
            """

    Scenario: Using the REST API, I can create a Trader
        When I make a POST request to /api/Trader
            """
            {
                "$class": "org.acme.biznet.Trader",
                "tradeId": "TRADER1",
                "firstName": "Jenny",
                "lastName": "Jones"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
            """
            {
                "$class": "org.acme.biznet.Trader",
                "tradeId": "TRADER1",
                "firstName": "Jenny",
                "lastName": "Jones"
            }
            """

    Scenario: Using the REST API, I can create another Trader
        When I make a POST request to /api/Trader
            """
            {
              "$class": "org.acme.biznet.Trader",
              "tradeId": "TRADER2",
              "firstName": "Amy",
              "lastName": "Williams"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
            """
            {
              "$class": "org.acme.biznet.Trader",
              "tradeId": "TRADER2",
              "firstName": "Amy",
              "lastName": "Williams"
            }
            """

    Scenario: Using the REST API, I get the new list of Traders
        When I make a GET request to /api/Trader
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
              {
                "$class": "org.acme.biznet.Trader",
                "tradeId": "TRADER1",
                "firstName": "Jenny",
                "lastName": "Jones"
              },
              {
                "$class": "org.acme.biznet.Trader",
                "tradeId": "TRADER2",
                "firstName": "Amy",
                "lastName": "Williams"
              }
            ]
            """


    Scenario: Using the REST API, I can create a Commodity
        When I make a POST request to /api/Commodity
            """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "ABC",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 72.297,
              "owner": "resource:org.acme.biznet.Trader#TRADER1"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
           """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "ABC",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 72.297,
              "owner": "resource:org.acme.biznet.Trader#TRADER1"
            }
            """

    Scenario: Using the REST API, I can trade a Commodity
        When I make a POST request to /api/Trade
            """
              {
                "$class": "org.acme.biznet.Trade",
                "commodity": "resource:org.acme.biznet.Commodity#ABC",
                "newOwner": "resource:org.acme.biznet.Trader#TRADER2"
              }
            """
        Then The response code should be 200
        And The response body should be JSON matching
           """
             {
               "$class": "org.acme.biznet.Trade",
               "commodity": "resource:org.acme.biznet.Commodity#ABC",
               "newOwner": "resource:org.acme.biznet.Trader#TRADER2",
               "transactionId": _.isString
             }
           """

    Scenario: Using the REST API, I can get the traded Commodity details
        When I make a GET request to /api/Commodity/ABC
        Then The response code should be 200
        And The response body should be JSON matching
           """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "ABC",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 72.297,
              "owner": "resource:org.acme.biznet.Trader#TRADER2"
            }
            """

    Scenario: Using the REST API, I delete TRADER1
        When I make a DELETE request to /api/Trader/TRADER1
        Then The response code should be 204


    Scenario: Using the REST API, I delete TRADER2
        When I make a DELETE request to /api/Trader/TRADER2
        Then The response code should be 204


    Scenario: Using the REST API, I get the empty list of Traders
        When I make a GET request to /api/Trader
        Then The response code should be 200
        And The response body should be JSON matching
            """
            []
            """

    Scenario: Finally, shutdown the REST server
        When I shutdown the REST server
