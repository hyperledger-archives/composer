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

@generator @generator-busnet
Feature: Business Network Generator

    Background:
        Given I have admin business cards available

    @generateOne
    Scenario: Using the Composer generator, I can generate an empty template network
        When I run the following expected pass CLI command
            | command | yo hyperledger-composer:businessnetwork |
            | --appname | my-empty-bus-net |
            | --appdescription | a description for my business network |
            | --appauthor | Captain Conga |
            | --appemail | conga@congaverse.com |
            | --applicense | Apache2.0 |
            | --ns | conga.busnet |
            | --empty | yes |
        Then Folder ../my-empty-bus-net should only contain the following files
            | .eslintrc.yml |
            | README.md |
            | package.json |
            | permissions.acl |
            | models/conga.busnet.cto |

    Scenario: Using the Composer generator, I can generate a populated template network
        When I run the following expected pass CLI command
            | command | yo hyperledger-composer:businessnetwork |
            | --appname | my-bus-net |
            | --appdescription | a description for my business network |
            | --appauthor | Captain Conga |
            | --appemail | conga@congaverse.com |
            | --applicense | Apache2.0 |
            | --ns | conga.busnet |
            | --empty | no |
        Then Folder ../my-bus-net should only contain the following files
            | .eslintrc.yml |
            | README.md |
            | package.json |
            | permissions.acl |
            | models/conga.busnet.cto |
            | lib/logic.js |
            | test/logic.js |
            | features/sample.feature |
            | features/support/index.js |

    Scenario: Using the Composer generator, I can install the business network packages
        When I run the following expected pass CLI command
            """
             npm install --prefix ./my-bus-net
            """
        Then The stdout information should include text matching /added .* packages/

    Scenario: Using the Composer generator, I can generate a testable template network
        When I run the following expected pass CLI command
            """
             npm test --prefix ./my-bus-net
            """
        Then The stdout information should include text matching /18 scenarios \(18 passed\)/
        And The stdout information should include text matching /144 steps \(144 passed\)/

    Scenario: I can build a bna from the generated template network
        When I run the following expected pass CLI command
            """
            composer archive create -t dir -a ./tmp/my-bus-net.bna -n ./my-bus-net
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/my-bus-net.bna |

    Scenario: I can deploy a bna created from a generated template business network
        Given I have a deployed the bna my-bus-net
        When I run the following expected pass CLI command
            """
            composer network ping --card admin@my-bus-net
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: my-bus-net/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: I can create an asset in the deployed template business network
         When I run the following expected pass CLI command
            """
            composer transaction submit --card admin@my-bus-net -d '{"$class": "org.hyperledger.composer.system.AddAsset", "targetRegistry": "resource:org.hyperledger.composer.system.AssetRegistry#conga.busnet.SampleAsset", "resources": [{"$class": "conga.busnet.SampleAsset","assetId": "newAsset","value": "101", "owner": "conga.busnet.SampleParticipant#bob"}]}'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        Then The stdout information should include text matching /Command succeeded/

    Scenario: I can list all assets in the deployed templeate business network and the asset
         When I run the following expected pass CLI command
            """
            composer network list --card admin@my-bus-net -r conga.busnet.SampleAsset
            """
        Then The stdout information should include text matching /newAsset: /
        Then The stdout information should include text matching /\$class:  conga.busnet.SampleAsset/
        Then The stdout information should include text matching /assetId: newAsset/
        Then The stdout information should include text matching /value:   101/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: I can submit the template transaction in the deployed template business network
         When I run the following expected pass CLI command
            """
            composer transaction submit --card admin@my-bus-net -d '{"$class": "conga.busnet.SampleTransaction", "asset": "resource:conga.busnet.SampleAsset#newAsset", "newValue": "5"}'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        Then The stdout information should include text matching /Command succeeded/

    Scenario: I can list all assets in the deployed templeate business network and see the updated asset
         When I run the following expected pass CLI command
            """
            composer network list --card admin@my-bus-net -r conga.busnet.SampleAsset
            """
        Then The stdout information should include text matching /newAsset: /
        Then The stdout information should include text matching /\$class:  conga.busnet.SampleAsset/
        Then The stdout information should include text matching /assetId: newAsset/
        Then The stdout information should include text matching /value:   5/
        Then The stdout information should include text matching /Command succeeded/

