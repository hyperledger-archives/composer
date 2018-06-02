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

@rest @rest-apikey
Feature: Rest steps

    Background:
        Given I have admin business cards available

    Scenario: Using a secured REST API, requests are rejeted if the API key is not supplied
        Given I have a secured REST API server for test-network using API key "conga"
        And I have cleared the cookie jar
        When I make a GET request to /api/system/ping
        Then The response code should be 401

    Scenario: Using a secured REST API, requests are rejeted if the wrong API key is supplied
        When I make a GET request to /api/system/ping with API key "cOnGa"
        Then The response code should be 401

    Scenario: Using a secured REST API, requests are accepted if the correct API key is supplied
        When I make a GET request to /api/system/ping with API key "conga"
        Then The response code should be 200
        And The response body should be JSON matching
            """
              {
                "version": _.isString,
                "participant": "org.hyperledger.composer.system.NetworkAdmin#admin",
                "identity": _.isString
              }
            """

    Scenario: Finally, shutdown the REST server
        When I shutdown the REST server
