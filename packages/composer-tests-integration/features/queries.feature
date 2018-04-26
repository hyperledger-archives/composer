#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

@queries
Feature: Queries steps

    Background:
        Given I have admin business cards available

    Scenario: Using the REST API, I can ping the network
        Given I have a REST API server for queries-network
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

    Scenario: Using the REST API, I can create TRADER1
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

    Scenario: Using the REST API, I can create TRADER2
        When I make a POST request to /api/Trader
            """
            {
              "$class": "org.acme.biznet.Trader",
              "tradeId": "TRADER2",
              "firstName": "Jack",
              "lastName": "Sock"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
            """
            {
              "$class": "org.acme.biznet.Trader",
              "tradeId": "TRADER2",
              "firstName": "Jack",
              "lastName": "Sock"
            }
            """

    Scenario: Using the REST API, I can create TRADER3
        When I make a POST request to /api/Trader
            """
            {
              "$class": "org.acme.biznet.Trader",
              "tradeId": "TRADER3",
              "firstName": "Rainer",
              "lastName": "Valens"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
            """
            {
              "$class": "org.acme.biznet.Trader",
              "tradeId": "TRADER3",
              "firstName": "Rainer",
              "lastName": "Valens"
            }
            """

    Scenario: Using the REST API, I can create a Commodity
        When I make a POST request to /api/Commodity
            """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "EMA",
              "description": "Corn",
              "mainExchange": "EURONEXT",
              "quantity": 10,
              "owner": "resource:org.acme.biznet.Trader#TRADER1",
              "issueDate": "2018-03-01"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
           """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "EMA",
              "description": "Corn",
              "mainExchange": "EURONEXT",
              "quantity": 10,
              "owner": "resource:org.acme.biznet.Trader#TRADER1",
              "issueDate": "2018-03-01T00:00:00.000Z"
            }
            """

    Scenario: Using the REST API, I can create another Commodity
        When I make a POST request to /api/Commodity
            """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "CC",
              "description": "Cocoa",
              "mainExchange": "ICE",
              "quantity": 80,
              "owner": "resource:org.acme.biznet.Trader#TRADER2",
              "issueDate": "2018-01-01"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
            """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "CC",
              "description": "Cocoa",
              "mainExchange": "ICE",
              "quantity": 80,
              "owner": "resource:org.acme.biznet.Trader#TRADER2",
              "issueDate": "2018-01-01T00:00:00.000Z"
            }
            """

    Scenario: Using the REST API, I can create yet another Commodity
        When I make a POST request to /api/Commodity
            """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "BUT",
              "description": "Butter",
              "mainExchange": "ICE",
              "quantity": 50,
              "owner": "resource:org.acme.biznet.Trader#TRADER2",
              "issueDate": "2018-04-04"
            }
            """
        Then The response code should be 200
        And The response body should be JSON matching
            """
            {
              "$class": "org.acme.biznet.Commodity",
              "tradingSymbol": "BUT",
              "description": "Butter",
              "mainExchange": "ICE",
              "quantity": 50,
              "owner": "resource:org.acme.biznet.Trader#TRADER2",
              "issueDate": "2018-04-04T00:00:00.000Z"
            }
            """

    Scenario: Using the REST API, I can list the Commodities
        When I make a GET request to /api/Commodity
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "BUT",
                  "description": "Butter",
                  "mainExchange": "ICE",
                  "quantity": 50,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-04-04T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "CC",
                  "description": "Cocoa",
                  "mainExchange": "ICE",
                  "quantity": 80,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-01-01T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "EMA",
                  "description": "Corn",
                  "mainExchange": "EURONEXT",
                  "quantity": 10,
                  "owner": "resource:org.acme.biznet.Trader#TRADER1",
                  "issueDate": "2018-03-01T00:00:00.000Z"
                }
            ]
            """

    Scenario: Using the REST API, I can perform filtered queries
        When I make a GET request to /api/queries/selectCommoditiesByExchange?exchange=EURONEXT
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "EMA",
                  "description": "Corn",
                  "mainExchange": "EURONEXT",
                  "quantity": 10,
                  "owner": "resource:org.acme.biznet.Trader#TRADER1",
                  "issueDate": "2018-03-01T00:00:00.000Z"
                }
            ]
            """

    Scenario: Using the REST API, I can list the Commodities using a query
        When I make a GET request to /api/queries/selectCommodities
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "BUT",
                  "description": "Butter",
                  "mainExchange": "ICE",
                  "quantity": 50,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-04-04T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "CC",
                  "description": "Cocoa",
                  "mainExchange": "ICE",
                  "quantity": 80,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-01-01T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "EMA",
                  "description": "Corn",
                  "mainExchange": "EURONEXT",
                  "quantity": 10,
                  "owner": "resource:org.acme.biznet.Trader#TRADER1",
                  "issueDate": "2018-03-01T00:00:00.000Z"
                }
            ]
            """

    Scenario: Using the REST API, I can list the Commodities by ascending quantity using a query
        When I make a GET request to /api/queries/selectCommoditiesOrdered
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "EMA",
                  "description": "Corn",
                  "mainExchange": "EURONEXT",
                  "quantity": 10,
                  "owner": "resource:org.acme.biznet.Trader#TRADER1",
                  "issueDate": "2018-03-01T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "BUT",
                  "description": "Butter",
                  "mainExchange": "ICE",
                  "quantity": 50,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-04-04T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "CC",
                  "description": "Cocoa",
                  "mainExchange": "ICE",
                  "quantity": 80,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-01-01T00:00:00.000Z"
                }
            ]
            """

    Scenario: Using the REST API, I can list the Commodities by descending quantity using a query
        When I make a GET request to /api/queries/selectCommoditiesOrderedReverse
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "CC",
                  "description": "Cocoa",
                  "mainExchange": "ICE",
                  "quantity": 80,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-01-01T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "BUT",
                  "description": "Butter",
                  "mainExchange": "ICE",
                  "quantity": 50,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-04-04T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "EMA",
                  "description": "Corn",
                  "mainExchange": "EURONEXT",
                  "quantity": 10,
                  "owner": "resource:org.acme.biznet.Trader#TRADER1",
                  "issueDate": "2018-03-01T00:00:00.000Z"
                }
            ]
            """

    Scenario: Using the REST API, I can list the Commodities in date order using a query
        When I make a GET request to /api/queries/selectCommoditiesByDate
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "CC",
                  "description": "Cocoa",
                  "mainExchange": "ICE",
                  "quantity": 80,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-01-01T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "EMA",
                  "description": "Corn",
                  "mainExchange": "EURONEXT",
                  "quantity": 10,
                  "owner": "resource:org.acme.biznet.Trader#TRADER1",
                  "issueDate": "2018-03-01T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "BUT",
                  "description": "Butter",
                  "mainExchange": "ICE",
                  "quantity": 50,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-04-04T00:00:00.000Z"
                }
            ]
            """

    Scenario: Using the REST API, I can list the Commodities in reverse date order using a query
        When I make a GET request to /api/queries/selectCommoditiesByDateReverse
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "BUT",
                  "description": "Butter",
                  "mainExchange": "ICE",
                  "quantity": 50,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-04-04T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "EMA",
                  "description": "Corn",
                  "mainExchange": "EURONEXT",
                  "quantity": 10,
                  "owner": "resource:org.acme.biznet.Trader#TRADER1",
                  "issueDate": "2018-03-01T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "CC",
                  "description": "Cocoa",
                  "mainExchange": "ICE",
                  "quantity": 80,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-01-01T00:00:00.000Z"
                }
            ]
            """

    Scenario: Using the REST API, I can list the Commodities with high quantity
        When I make a GET request to /api/queries/selectCommoditiesWithHighQuantity
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "CC",
                  "description": "Cocoa",
                  "mainExchange": "ICE",
                  "quantity": 80,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-01-01T00:00:00.000Z"
                }
            ]
            """

    Scenario: Using the REST API, I can list the Commodities with mid quantity for TRADER2
        When I make a GET request to /api/queries/selectCommoditiesWithMidQuantity?owner=resource%3Aorg.acme.biznet.Trader%23TRADER2
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "BUT",
                  "description": "Butter",
                  "mainExchange": "ICE",
                  "quantity": 50,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-04-04T00:00:00.000Z"
                }
            ]
            """

    Scenario: Using the REST API, I can list the Commodities with mid quantity for TRADER1
        When I make a GET request to /api/queries/selectCommoditiesWithMidQuantity?owner=resource%3Aorg.acme.biznet.Trader%23TRADER1
        Then The response code should be 200
        And The response body should be JSON matching
            """
            []
            """

    Scenario: Using the REST API, I can remove the Commodities with high quantity
        When I make a POST request to /api/RemoveHighQuantityCommodities
            """
            {}
            """
        Then The response code should be 200
        And The response body should be JSON matching
            """
            {
              "$class": "org.acme.biznet.RemoveHighQuantityCommodities",
              "transactionId": _.isString
            }
            """

    Scenario: Using the REST API, I can list the Commodities
        When I make a GET request to /api/Commodity
        Then The response code should be 200
        And The response body should be JSON matching
            """
            [
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "BUT",
                  "description": "Butter",
                  "mainExchange": "ICE",
                  "quantity": 50,
                  "owner": "resource:org.acme.biznet.Trader#TRADER2",
                  "issueDate": "2018-04-04T00:00:00.000Z"
                },
                {
                  "$class": "org.acme.biznet.Commodity",
                  "tradingSymbol": "EMA",
                  "description": "Corn",
                  "mainExchange": "EURONEXT",
                  "quantity": 10,
                  "owner": "resource:org.acme.biznet.Trader#TRADER1",
                  "issueDate": "2018-03-01T00:00:00.000Z"
                }
            ]
            """

    Scenario: Finally, shutdown the REST server
        When I kill task named REST_SVR
