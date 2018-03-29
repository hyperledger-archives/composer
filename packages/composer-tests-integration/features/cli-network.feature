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

    Scenario: Using the CLI, I can create new Assets by submitting transactions
        When I run the following expected pass CLI command
            """
            composer transaction submit --card admin@marbles-network -d '{"$class": "org.hyperledger.composer.system.AddAsset","registryType": "Asset","registryId": "org.hyperledger_composer.marbles.NewMarble", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#org.hyperledger_composer.marbles.NewMarble", "resources": [{"$class": "org.hyperledger_composer.marbles.NewMarble","marbleId": "101","size": "SMALL","color": "RED","owner": "resource:org.hyperledger_composer.marbles.Player#bob"}]}'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can check that the assets were created
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
        And The stdout information should include text matching /101: /
        And The stdout information should include text matching /\$class:   org.hyperledger_composer.marbles.NewMarble/
        And The stdout information should include text matching /marbleId: 101/
        And The stdout information should include text matching /size:     SMALL/
        And The stdout information should include text matching /color:    RED/
        And The stdout information should include text matching /owner:    resource:org.hyperledger_composer.marbles.Player#bob/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create get back the log level of the running network
        When I run the following expected pass CLI command
            """
            composer network loglevel --card admin@marbles-network 
            """
        Then The stdout information should include text matching /composer\[error\]:*/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create set the log level of the running network
        When I run the following expected pass CLI command
            """
            composer network loglevel --card admin@marbles-network --newlevel 'composer[debug]:acls'
            """
        Then The stdout information should include text matching /composer\[debug\]:acls/
        And The stdout information should include text matching /Command succeeded/        
