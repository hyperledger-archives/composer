@rest
Feature: Rest steps

    Background:
        Given I have admin business cards available

    Scenario: Using the REST API, I can ping the network
        Given I have a REST API server for tutorial-network
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

    Scenario: Using the REST API, I can create yet another Trader
        When I make a POST request to /api/Trader
            """
            {
              "$class": "org.acme.biznet.Trader",
              "tradeId": "TRADER3",
              "firstName": "Kenneth",
              "lastName": "Williams"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
            """
            {
              "$class": "org.acme.biznet.Trader",
              "tradeId": "TRADER3",
              "firstName": "Kenneth",
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
              },
              {
                "$class": "org.acme.biznet.Trader",
                "tradeId": "TRADER3",
                "firstName": "Kenneth",
                "lastName": "Williams"
              }
            ]
            """

    Scenario: Using the REST API, I get a filtered list of Traders
        When I make a GET request to /api/Trader with filter {"where": {"lastName": "Williams"}}
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
              {
                "$class": "org.acme.biznet.Trader",
                "tradeId": "TRADER2",
                "firstName": "Amy",
                "lastName": "Williams"
              },
              {
                "$class": "org.acme.biznet.Trader",
                "tradeId": "TRADER3",
                "firstName": "Kenneth",
                "lastName": "Williams"
              }
            ]
            """

    Scenario: Using the REST API, I get a filtered list of Traders (with 'and' filter)
        When I make a GET request to /api/Trader with filter {"where": {"and":[{"firstName": "Kenneth"},{"lastName": "Williams"}]}}
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
              {
                "$class": "org.acme.biznet.Trader",
                "tradeId": "TRADER3",
                "firstName": "Kenneth",
                "lastName": "Williams"
              }
            ]
            """

    Scenario: Using the REST API, I get a filtered list of Traders (with 'or' filter)
        When I make a GET request to /api/Trader with filter {"where": {"or":[{"firstName": "Jenny"},{"firstName": "Amy"}]}}
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

    Scenario: Using the REST API, I can create another Commodity
        When I make a POST request to /api/Commodity
            """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "DEF",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 23,
              "owner": "resource:org.acme.biznet.Trader#TRADER1"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
           """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "DEF",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 23,
              "owner": "resource:org.acme.biznet.Trader#TRADER1"
            }
            """

    Scenario: Using the REST API, I can create yet another Commodity
        When I make a POST request to /api/Commodity
            """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "GHI",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 50,
              "owner": "resource:org.acme.biznet.Trader#TRADER2"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
           """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "GHI",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 50,
              "owner": "resource:org.acme.biznet.Trader#TRADER2"
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

    Scenario: Using the REST API, I can get the traded Commodities with quantity < 50
        When I make a GET request to /api/Commodity with filter {"where": {"quantity": {"lt": 50}}}
        Then The response code should be 200
        And The response body should be JSON matching
           """
            [{
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "DEF",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 23,
              "owner": "resource:org.acme.biznet.Trader#TRADER1"
            }]
            """

    Scenario: Using the REST API, I can get the traded Commodities with quantity > 50
        When I make a GET request to /api/Commodity with filter {"where": {"quantity": {"gt": 50}}}
        Then The response code should be 200
        And The response body should be JSON matching
           """
            [{
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "ABC",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 72.297,
              "owner": "resource:org.acme.biznet.Trader#TRADER2"
            }]
            """

    Scenario: Using the REST API, I can get the traded Commodities with quantity != 50 and owner TRADER2
        When I make a GET request to /api/Commodity with filter {"where": {"and": [{"or": [{"quantity": {"gt": 50}}, {"quantity": {"lt": 50}}]}, {"owner": "resource:org.acme.biznet.Trader#TRADER2"}]}}
        Then The response code should be 200
        And The response body should be JSON matching
           """
            [{
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "ABC",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 72.297,
              "owner": "resource:org.acme.biznet.Trader#TRADER2"
            }]
            """

    Scenario: Using the REST API, I can get the traded Commodities with quantity between 20 and 50
        When I make a GET request to /api/Commodity with filter {"where": {"quantity": {"between": [20, 50]}}}
        Then The response code should be 200
        And The response body should be JSON matching
           """
            [{
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "DEF",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 23,
              "owner": "resource:org.acme.biznet.Trader#TRADER1"
            }, {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "GHI",
              "description": "Test commodity",
              "mainExchange": "Euronext",
              "quantity": 50,
              "owner": "resource:org.acme.biznet.Trader#TRADER2"
            }]
            """

    Scenario: Using the REST API, I delete TRADER1
        When I make a DELETE request to /api/Trader/TRADER1
        Then The response code should be 204


    Scenario: Using the REST API, I delete TRADER2
        When I make a DELETE request to /api/Trader/TRADER2
        Then The response code should be 204

    Scenario: Using the REST API, I delete TRADER3
        When I make a DELETE request to /api/Trader/TRADER3
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
