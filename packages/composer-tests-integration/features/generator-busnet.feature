@generator-busnet
Feature: Business Network Generator

    Background:
        Given I have admin business cards available

    Scenario: Using the Composer generator, I can generate a template network
        When I run the following expected pass CLI command
            | command | yo hyperledger-composer:businessnetwork |
            | --appname | my-bus-net |
            | --appdescription | a description for my business network |
            | --appauthor | Captain Conga |
            | --appemail | conga@congaverse.com |
            | --applicense | Apache2.0 |
            | --ns | conga.busnet |
        Then I have the following files
            | ../my-bus-net/.eslintrc.yml |
            | ../my-bus-net/README.md |
            | ../my-bus-net/package.json |
            | ../my-bus-net/models/conga.busnet.cto |
            | ../my-bus-net/lib/logic.js |
            | ../my-bus-net/test/logic.js |

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
        Then The stdout information should include text matching /1 passing/

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
            composer transaction submit --card admin@my-bus-net -d '{"$class": "org.hyperledger.composer.system.AddAsset","registryType": "Asset","registryId": "conga.busnet.SampleAsset", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#conga.busnet.SampleAsset", "resources": [{"$class": "conga.busnet.SampleAsset","assetId": "newAsset","value": "101"}]}'
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
            composer transaction submit --card admin@my-bus-net -d '{"$class": "conga.busnet.ChangeAssetValue", "relatedAsset": "resource:conga.busnet.SampleAsset#newAsset", "newValue": "5"}'
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

