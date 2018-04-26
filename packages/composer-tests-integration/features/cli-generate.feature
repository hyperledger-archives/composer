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

@cli @cli-generate
Feature: Cli generate steps

    Scenario: Using the CLI, I can issue the command to generate doc for the empty network
        Given I have the following folders
            | ../resources/sample-networks/empty-business-network |
        And I run the following expected pass CLI command
            """
            composer archive create -t dir -a ./tmp/empty-business-network.bna -n ./resources/sample-networks/empty-business-network
            """
        And The generated output is to be placed in
            """
            tmp/empty-business-network-out
            """
        When I run the following expected pass CLI command
            """
            composer generator docs -a ./tmp/empty-business-network.bna -o tmp/empty-business-network-out
            """
        Then The stdout information should include text matching /Command succeeded/
        And I have the following files
            | ../tmp/empty-business-network-out/acls.html |
            | ../tmp/empty-business-network-out/assets.html |
            | ../tmp/empty-business-network-out/class.html |
            | ../tmp/empty-business-network-out/enums.html |
            | ../tmp/empty-business-network-out/events.html |
            | ../tmp/empty-business-network-out/index.html |
            | ../tmp/empty-business-network-out/participants.html |
            | ../tmp/empty-business-network-out/queries.html |
            | ../tmp/empty-business-network-out/transactions.html |
        And The generated files do not have an image in the nav bar
        And The index page should contain the readme for the empty-business-network
        And The summary should contain 0 assets
        And The summary should contain 0 transactions
        And The summary should contain 0 participants
        And The assets page should contain no assets
        And The transactions page should contain no transactions
        And The participants page should contain no participants
        And The events page should contain no events
        And The enums page should contain no enums
        And The acls page should contain the following acls
            | NetworkAdminUser |
            | NetworkAdminSystem |

    Scenario: Using the CLI, I can issue the command to generate doc for the vehicle manufacture network
        Given I have the following folders
            | ../resources/sample-networks/vehicle-manufacture-network |
        And I run the following expected pass CLI command
            """
            composer archive create -t dir -a ./tmp/vehicle-manufacture-network.bna -n ./resources/sample-networks/vehicle-manufacture-network
            """
        And The generated output is to be placed in
            """
            tmp/vehicle-manufacture-network-out
            """
        When I run the following expected pass CLI command
            """
            composer generator docs -a ./tmp/vehicle-manufacture-network.bna -o tmp/vehicle-manufacture-network-out
            """
        Then The stdout information should include text matching /Command succeeded/
        And I have the following files
            | ../tmp/vehicle-manufacture-network-out/acls.html |
            | ../tmp/vehicle-manufacture-network-out/assets.html |
            | ../tmp/vehicle-manufacture-network-out/class.html |
            | ../tmp/vehicle-manufacture-network-out/enums.html |
            | ../tmp/vehicle-manufacture-network-out/events.html |
            | ../tmp/vehicle-manufacture-network-out/index.html |
            | ../tmp/vehicle-manufacture-network-out/participants.html |
            | ../tmp/vehicle-manufacture-network-out/queries.html |
            | ../tmp/vehicle-manufacture-network-out/transactions.html |
        And The generated files should have the following image in the nav bar
            """
            https://hyperledger.github.io/composer-sample-networks/packages/vehicle-manufacture-network/networkimage.svg
            """
        And The generated files should have the following network name in the nav bar
            """
            vehicle-manufacture-network
            """
        And The index page should contain the readme for the vehicle-manufacture-network
        And The summary should contain 2 assets
        And The summary should contain 3 transactions
        And The summary should contain 4 participants
        And The assets page should contain the following assets
            | Order |
            | Vehicle |
        And The transactions page should contain the following transactions
            | placeOrder |
            | updateOrderStatus |
            | setupDemo |
        And The participants page should contain the following participants
            | Company |
            | Person |
            | Manufacturer |
            | Regulator |
        And The events page should contain the following events
            | PlaceOrderEvent |
            | UpdateOrderStatusEvent |
        And The enums page should contain the following enums
            | OrderStatus |
            | VehicleStatus |
        And The acls page should contain the following acls
            | PersonMakeOrder |
            | PersonPlaceOrder |
            | PersonReadOrder |
            | ManufacturerUpdateOrder |
            | ManufacturerUpdateOrderStatus |
            | ManufacturerReadOrder |
            | ManufacturerCreateVehicles |
            | ManufacturerReadVehicles |
            | RegulatorAdminUser |
            | ParticipantsSeeSelves |
            | NetworkAdminUser |
            | System |

    Scenario: Using the CLI, I will get an error when I issue the command to generate a doc for a non existent file
        When I run the following expected fail CLI command
            """
            composer generator docs -a ./tmp/non-existant.bna 
            """
        Then The stdout information should include text matching /no such file or directory/
        And The stdout information should include text matching /Command failed/

    Scenario: Using the CLI, I will get an error when I issue the command to generate a doc for a non bna file
        When I run the following expected fail CLI command
            """
            composer generator docs -a ./index.js
            """
        Then The stdout information should include text matching /is this a zip file/
        And The stdout information should include text matching /Command failed/

    Scenario: Using the CLI, I will get an error when I issue the commands to generate a doc for a bna file with errors within
        When I run the following expected fail CLI command
            """
            composer generator docs -a ./resources/sample-networks/bad-sample-network.bna
            """
        Then The stdout information should include text matching /ParseException/
        And The stdout information should include text matching /Command failed/