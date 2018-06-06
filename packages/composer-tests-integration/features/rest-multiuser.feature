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

@rest @rest-multiuser
Feature: Rest steps

    Background:
        Given I have admin business cards available

    Scenario: Using the REST API, I cannot ping the network without logging in
        Given I have a multiple user REST API server for test-network
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
            composer participant add --card admin@test-network -d '{"$class":"org.acme.biznet.Trader","tradeId":"alice@email.com","firstName":"Alice","lastName":"Aardvark"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue a business network card to the participant called Alice
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@test-network -u alice1 -a org.acme.biznet.Trader#alice@email.com -f ./tmp/alice1@test-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/alice1@test-network.card |

    Scenario: Using the REST API, I can import a business network card into my wallet
        When I make a POST request with form data to /api/wallet/import
            | name | value                              |
            | card | ./tmp/alice1@test-network.card |
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
            composer participant add --card admin@test-network -d '{"$class":"org.acme.biznet.Trader","tradeId":"bob@email.com","firstName":"Bob","lastName":"Bobbington"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue a business network card to the participant called Bob
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@test-network -u bob1 -a org.acme.biznet.Trader#bob@email.com -f ./tmp/bob1@test-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/bob1@test-network.card |

    Scenario: Using the REST API, I can import a business network card into my wallet
        When I make a POST request with form data to /api/wallet/import
            | name | value                              |
            | card | ./tmp/bob1@test-network.card |
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

    Scenario: Using the REST API, I can log in using a different set of credentials
        When I make a POST request to /auth/ldap
            """
            {
              "username": "charlie",
              "password": "bl0ckn0rr1sw0zh3re"
            }
            """
        Then The response code should be 200

    Scenario: Using the REST API, I cannot ping the network because I do not have a business network card in my wallet
        When I make a GET request to /api/system/ping
        Then The response code should be 500

    Scenario: Using the CLI, I can create a new participant called Charlie
        When I run the following expected pass CLI command
            """
            composer participant add --card admin@test-network -d '{"$class":"org.acme.biznet.Trader","tradeId":"charlie@email.com","firstName":"Charlie","lastName":"Norris"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue a business network card to the participant called Charlie
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@test-network -u charlie1 -a org.acme.biznet.Trader#charlie@email.com -f ./tmp/charlie1@test-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/charlie1@test-network.card |

    Scenario: Using the CLI, I can import the business network card into my wallet
        When I run the following expected pass CLI command
            """
            composer card import -f ./tmp/charlie1@test-network.card
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can ping the network after importing the business network card into my wallet
        When I run the following expected pass CLI command
            """
            composer network ping -c charlie1@test-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: test-network/
        And The stdout information should include text matching /version:/
        And The stdout information should include text matching /participant: org.acme.biznet.Trader#charlie@email.com/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can export the business network card from my wallet
        When I run the following expected pass CLI command
            """
            composer card export -c charlie1@test-network -f ./tmp/withcerts_charlie1@test-network.card
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the REST API, I can import a business network card into my wallet
        When I make a POST request with form data to /api/wallet/import
            | name | value                              |
            | card | ./tmp/withcerts_charlie1@test-network.card |
        Then The response code should be 204

    Scenario: Using the REST API, I can ping the network after importing a business network card into my wallet
        When I make a GET request to /api/system/ping
        Then The response code should be 200
        And The response body should be JSON matching
            """
              {
                "version": _.isString,
                "participant": "org.acme.biznet.Trader#charlie@email.com",
                "identity": _.isString
              }
            """

    Scenario: Using the REST API, I can log out
        When I make a GET request to /auth/logout
        Then The response code should be 200

    Scenario: Using the REST API, I cannot ping the network after logging out
        When I make a GET request to /api/system/ping
        Then The response code should be 401

    Scenario: Using the CLI, I can export a card that exists in my wallet
        When I run the following expected pass CLI command
            """
            composer card export --card admin@test-network --file ./tmp/admin.card
            """
        Then The stdout information should include text matching /Command succeeded/
        And I have the following files
            | ../tmp/admin.card |

    Scenario: Using the REST API, I can log in using my credentials
        When I make a POST request to /auth/ldap
            """
            {
              "username": "root",
              "password": "secret"
            }
            """
        Then The response code should be 200

    Scenario: Using the REST API, I can import a business network card into my wallet
        When I make a POST request with form data to /api/wallet/import
            | name | value                              |
            | card | ./tmp/admin.card |
        Then The response code should be 204


    Scenario: Using the REST API, I can create a Trader
        When I make a POST request to /api/Trader
            """
            {
                "$class": "org.acme.biznet.Trader",
                "tradeId": "dawn@email.com",
                "firstName": "Dawn",
                "lastName": "Onme"
            }
            """
        Then The response code should be 200

    Scenario: Using the REST API, I can issue an identity
        When I make a POST request for an identity to /api/system/identities/issue
        """
        { "participant":"org.acme.biznet.Trader#dawn@email.com",
        "userID":"dawnonme",
        "options":{}}
        """
        And I write the response data to a file ./tmp/dawnonme@test-network.card
        Then The response code should be 200
 
    Scenario: Using the CLI, I can import the business network card into my wallet
        When I run the following expected pass CLI command
            """
            composer card import -f ./tmp/dawnonme@test-network.card
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the REST API, I can log out
        When I make a GET request to /auth/logout
        Then The response code should be 200

    Scenario: Using the REST API, I cannot ping the network after logging out
        When I make a GET request to /api/system/ping
        Then The response code should be 401

    Scenario: Finally, shutdown the REST server
        When I shutdown the REST server
