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

@cli @cli-network
Feature: Cli network steps

    Background:
        Given I have admin business cards available
       And I have deployed the business network marbles-network

    Scenario: Using the CLI, I can ping the network that I just started
        When I run the following expected pass CLI command
            """
            composer network ping --card admin@marbles-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: marbles-network/
        And The stdout information should include text matching /participant: org.hyperledger.composer.system.NetworkAdmin#admin/
        And The stdout information should include text matching /identity: org.hyperledger.composer.system.Identity#.+?/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can verify that there no assets have been created yet
        When I run the following expected pass CLI command
            """
            composer network list --card admin@marbles-network -r org.hyperledger_composer.marbles.Marble
            """
        Then The stdout information should include text matching /models:/
        And The stdout information should include text matching /- org.hyperledger.composer.system/
        And The stdout information should include text matching /- org.hyperledger_composer.marbles/
        And The stdout information should include text matching /scripts:/
        And The stdout information should include text matching /- lib/logic.js/
        And The stdout information should include text matching /registries:/
        And The stdout information should include text matching /org.hyperledger_composer.marbles.Marble:/
        And The stdout information should include text matching /id:           org.hyperledger_composer.marbles.Marble/
        And The stdout information should include text matching /name:         Asset registry for org.hyperledger_composer.marbles.Marble/
        And The stdout information should include text matching /registryType: Asset/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create a Participant
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card admin@marbles-network
              -d '{
                  "$class": "org.hyperledger.composer.system.AddParticipant",
                  "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger_composer.marbles.Player",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Player",
                    "email": "bob",
                    "firstName": "bob",
                    "lastName": "bobby"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create a second Participant
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card admin@marbles-network
              -d '{
                  "$class": "org.hyperledger.composer.system.AddParticipant",
                  "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger_composer.marbles.Player",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Player",
                    "email": "sal",
                    "firstName": "sal",
                    "lastName": "sally"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create an asset
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card admin@marbles-network
              -d '{
                  "$class": "org.hyperledger.composer.system.AddAsset",
                  "targetRegistry": "resource:org.hyperledger.composer.system.AssetRegistry#org.hyperledger_composer.marbles.Marble",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Marble",
                    "marbleId": "101",
                    "size": "SMALL",
                    "color": "RED",
                    "owner": "resource:org.hyperledger_composer.marbles.Player#bob"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can execute a transaction from within the business network
        When I run the following expected pass CLI command
            """
            composer transaction submit
              -c admin@marbles-network
              -d '{
                    "$class": "org.hyperledger_composer.marbles.TradeMarble",
                    "marble": "resource:org.hyperledger_composer.marbles.Marble#101",
                    "newOwner": "resource:org.hyperledger_composer.marbles.Player#sal"
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can execute a transaction that returns data from within the business network
        When I run the following expected pass CLI command
            """
            composer transaction submit
              -c admin@marbles-network
              -d '{
                    "$class": "org.hyperledger_composer.marbles.TradeMarbleWithReceipt",
                    "marble": "resource:org.hyperledger_composer.marbles.Marble#101",
                    "newOwner": "resource:org.hyperledger_composer.marbles.Player#bob"
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /\$class:   org.hyperledger_composer.marbles.TradeReceipt/
        And The stdout information should include text matching /marble:/
        And The stdout information should include text matching /owner:    resource:org.hyperledger_composer.marbles.Player#bob/
        And The stdout information should include text matching /oldOwner:/
        And The stdout information should include text matching /newOwner:/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can update the network to a newer version
        Given I have the following folders
            | ../resources/sample-networks/marbles-network-update |
        And I run the following expected pass CLI command
            """
            composer archive create -t dir -a ./tmp/marbles-network-update.bna -n ./resources/sample-networks/marbles-network-update
            """
        And I run the following expected pass CLI command
            """
            composer network install --card TestPeerAdmin@org1 --archiveFile ./tmp/marbles-network-update.bna -o npmrcFile=/tmp/npmrc
            """

        When I run the following expected pass CLI command
            """
            composer network upgrade --card TestPeerAdmin@org1 --networkName marbles-network --networkVersion 0.2.0
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate my network update
        When I run the following expected pass CLI command
            """
            composer network ping --card admin@marbles-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: marbles-network/
        And The stdout information should include text matching /participant: org.hyperledger.composer.system.NetworkAdmin#admin/
        And The stdout information should include text matching /identity: org.hyperledger.composer.system.Identity#.+?/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate that listing all the networks includes my update
        When I run the following expected pass CLI command
            """
            composer network list --card admin@marbles-network
            """
        Then The stdout information should include text matching /org.hyperledger_composer.marbles.NewMarble/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, errors creating new assets are displayed to the user
        When I run the following expected fail CLI command
            """
            composer transaction submit
                --card admin@marbles-network
                -d '{
                    "$class": "org.hyperledger.composer.system.AddAsset",
                    "targetRegistry": "resource:org.hyperledger.composer.system.AssetRegistry#org.hyperledger_composer.marbles.NewMarble",
                    "resources": [{
                        "$class": "org.hyperledger_composer.marbles.NewMarble",
                        "marbleId": "101",
                        "size": "SMALL",
                        "color": "RED",
                        "owner": "resource:org.hyperledger_composer.marbles.Player#bob",
                        "ALL_YOUR_BASE_ARE_BELONG_TO_US": "A value"
                    }]
                }'
            """
        Then The stdout information should include text matching /ALL_YOUR_BASE_ARE_BELONG_TO_US/

    Scenario: Using the CLI, I can create a new Participant
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card admin@marbles-network
              -d '{
                  "$class": "org.hyperledger.composer.system.AddParticipant",
                  "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger_composer.marbles.Player",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Player",
                    "email": "bob2",
                    "firstName": "bob2",
                    "lastName": "bobby2"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create a second new Participant
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card admin@marbles-network
              -d '{
                  "$class": "org.hyperledger.composer.system.AddParticipant",
                  "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger_composer.marbles.Player",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Player",
                    "email": "sal2",
                    "firstName": "sal2",
                    "lastName": "sally2"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create a new Asset
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card admin@marbles-network
              -d '{
                  "$class": "org.hyperledger.composer.system.AddAsset",
                  "targetRegistry": "resource:org.hyperledger.composer.system.AssetRegistry#org.hyperledger_composer.marbles.NewMarble",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.NewMarble",
                    "marbleId": "201",
                    "size": "SMALL",
                    "color": "RED",
                    "owner": "resource:org.hyperledger_composer.marbles.Player#bob2"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can check that the Asset was created
        When I run the following expected pass CLI command
            """
            composer network list --card admin@marbles-network -r org.hyperledger_composer.marbles.NewMarble
            """
        Then The stdout information should include text matching /models: /
        And The stdout information should include text matching /- org.hyperledger.composer.system/
        And The stdout information should include text matching /- org.hyperledger_composer.marbles/
        And The stdout information should include text matching /scripts: /
        And The stdout information should include text matching /- lib/logic.js/
        And The stdout information should include text matching /registries: /
        And The stdout information should include text matching /org.hyperledger_composer.marbles.NewMarble: /
        And The stdout information should include text matching /id:           org.hyperledger_composer.marbles.NewMarble/
        And The stdout information should include text matching /name:         Asset registry for org.hyperledger_composer.marbles.NewMarble/
        And The stdout information should include text matching /registryType: Asset/
        And The stdout information should include text matching /assets: /
        And The stdout information should include text matching /201: /
        And The stdout information should include text matching /\$class:   org.hyperledger_composer.marbles.NewMarble/
        And The stdout information should include text matching /marbleId: 201/
        And The stdout information should include text matching /size:     SMALL/
        And The stdout information should include text matching /color:    RED/
        And The stdout information should include text matching /owner:    resource:org.hyperledger_composer.marbles.Player#bob2/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can execute a transaction from within the new business network
        When I run the following expected pass CLI command
            """
            composer transaction submit
              -c admin@marbles-network
              -d '{
                    "$class": "org.hyperledger_composer.marbles.TradeMarble",
                    "marble": "resource:org.hyperledger_composer.marbles.NewMarble#201",
                    "newOwner": "resource:org.hyperledger_composer.marbles.Player#sal2"
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can execute a transaction that returns data from within the new business network
        When I run the following expected pass CLI command
            """
            composer transaction submit
              -c admin@marbles-network
              -d '{
                    "$class": "org.hyperledger_composer.marbles.TradeMarbleWithReceipt",
                    "marble": "resource:org.hyperledger_composer.marbles.NewMarble#201",
                    "newOwner": "resource:org.hyperledger_composer.marbles.Player#bob2"
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /\$class:   org.hyperledger_composer.marbles.TradeReceipt/
        And The stdout information should include text matching /marble:/
        And The stdout information should include text matching /owner:    resource:org.hyperledger_composer.marbles.Player#bob2/
        And The stdout information should include text matching /oldOwner:/
        And The stdout information should include text matching /newOwner:/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can reset the network to remove all assets
        When I run the following expected pass CLI command
            """
            composer network reset -c admin@marbles-network
            """

    Scenario: Using the CLI, I can count the number of marbles
        When I run the following expected pass CLI command
            """
            composer network list --card admin@marbles-network -r org.hyperledger_composer.marbles.NewMarble |grep 'marbleId:'|wc -l
            """
        Then The stdout information should include text matching /0/

    Scenario: Using the CLI, I can download the BNA file for the running network
        When I run the following expected pass CLI command
            """
            composer network download -c admin@marbles-network -a ./tmp/downloaded-marbles.bna
            """
        Then I have the following files
            | ../tmp/downloaded-marbles.bna |

    Scenario: Using the CLI, I can create get back the log level of the running network
        When I run the following expected pass CLI command
            """
            composer network loglevel --card admin@marbles-network
            """
        Then The stdout information should include text matching /composer\[debug\]:*/
        And The stdout information should include text matching /Command succeeded/


    Scenario: Checking the chain code container logs should have the correct loglevels
        Given I run the following expected pass CLI command
            """
            composer network loglevel --card admin@marbles-network --newlevel 'composer[debug]:*'
            """
        When I start watching the chain code logs
        And I run the following expected pass CLI command
            """
            composer network list --card admin@marbles-network
            """
        Then I stop watching the chain code logs
        And  Then the maximum log level should be debug
        And  The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create set the log level of the running network
        When I run the following expected pass CLI command
            """
            composer network loglevel --card admin@marbles-network --newlevel 'composer[info]:acls'
            """
        Then The stdout information should include text matching /composer\[info\]:acls/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Checking the chain code container logs should have the correct loglevels
        When I run the following expected pass CLI command
            """
            composer network loglevel --card admin@marbles-network --newlevel 'composer[info]:*'
            """
        And The stdout information should include text matching /composer\[info\]:\*/
        And The stdout information should include text matching /Command succeeded/
        When I start watching the chain code logs
        And I run the following expected pass CLI command
            """
            composer network loglevel --card admin@marbles-network --newlevel 'composer[warn]:*'
            """
        Then I stop watching the chain code logs
        And  Then the maximum log level should be info
        And  The stdout information should include text matching /Command succeeded/
