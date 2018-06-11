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

@generator @generator-loopback
Feature: LoopBack Application Generator

    Background:
        Given I have admin business cards available
        And I have deployed the business network test-network as test-network-generator-loopback

    Scenario: Using the Composer generator, I can generate an LoopBack application
        When I run the following expected pass CLI command
            | command | yo hyperledger-composer:loopback |
            | --liveNetwork | true |
            | --appName | my-loopback-app |
            | --appDescription | A description for my LoopBack application |
            | --authorName | Simon Stone |
            | --authorEmail | simon@congaverse.com |
            | --license | Apache-2.0 |
            | --cardName | admin@test-network-generator-loopback |
        Then I have the following files
            | ../my-loopback-app/common/models/Commodity.json |
            | ../my-loopback-app/common/models/Trade.json |
            | ../my-loopback-app/common/models/Trader.json |

    Scenario: I can start the generated LoopBack application
        When I spawn the following background task GENERATED_APP, and wait for /Web server listening at/
            """
            npm start --prefix ./my-loopback-app
            """

    Scenario: Using the REST API, I can ping the network
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

    Scenario: Finally, shutdown the generated LoopBack application
        When I kill process on port 3000
