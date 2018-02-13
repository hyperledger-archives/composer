Feature: Cli steps

    Background:
        Given I have generated crypto material

    Scenario: Using the CLI, I can create a business network card
        Given I have the following items
            | ../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts |
            | ../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore |
            | ../profiles/basic-connection-org1.json |
        When I run the following CLI command
            | command | composer card create |
            | -p | ./profiles/basic-connection-org1.json |
            | -u | PeerAdmin |
            | -c | ./hlfv1/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem |
            | -k | ./hlfv1/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/key.pem |
            | -r | PeerAdmin |
            | -r | ChannelAdmin |
            | -f | ./tmp/PeerAdmin@hlfv1.card |

        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/PeerAdmin@hlfv1.card |

    Scenario: Using the CLI, I can perform a runtime install on org1
        When I run the following CLI command
            """
            composer runtime install --card TestPeerAdmin@org1 --businessNetworkName basic-sample-network
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can perform a runtime install on org2
        When I run the following CLI command
            """
            composer runtime install --card TestPeerAdmin@org2 --businessNetworkName basic-sample-network
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create business archive files from project folders
        Given I have the following folders
            | ../resources/sample-networks/basic-sample-network |
        When I run the following CLI command
            """
            composer archive create -t dir -a ./tmp/basic-sample-network.bna -n ./resources/sample-networks/basic-sample-network
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/basic-sample-network.bna |

    Scenario: Using the CLI, I can create business archive files from project folders
        Given I have the following folders
            | ../resources/sample-networks/basic-sample-network |
        When I run the following CLI command
            """
            composer archive create -t dir -a ./tmp/basic-sample-network-update.bna -n ./resources/sample-networks/basic-sample-network-update
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/basic-sample-network-update.bna |

    Scenario: Using the CLI, I can perform a business network start
        Given I have the following files
            | ../tmp/basic-sample-network.bna |
        When I run the following CLI command
            """
            composer network start --card TestPeerAdmin@org1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile ./tmp/basic-sample-network.bna --file ./tmp/networkadmin.card
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can import the card that was just created when the network was started (ie. chaincode was instantiated)
        Given I have the following files
            | ../tmp/networkadmin.card |
        When I run the following CLI command
            """
            composer card import --file ./tmp/networkadmin.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        Then The stdout information should include text matching /Card file: ./tmp/networkadmin.card/
        Then The stdout information should include text matching /Card name: admin@basic-sample-network/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can see the card that I just imported
        When I run the following CLI command
            """
            composer card list
            """
        Then The stdout information should include text matching /The following Business Network Cards are available:/
        Then The stdout information should include text matching /Connection Profile: hlfv1/
        Then The stdout information should include text matching /┌────────────────────────────┬────────────────────┬──────────────────────┐/
        Then The stdout information should include text matching /│ Card Name                  │ UserId             │ Business Network     │/
        Then The stdout information should include text matching /├────────────────────────────┼────────────────────┼──────────────────────┤/
        Then The stdout information should include text matching /│ admin@basic-sample-network │ admin              │ basic-sample-network │/
        Then The stdout information should include text matching /├────────────────────────────┼────────────────────┼──────────────────────┤/
        Then The stdout information should include text matching /│ TestPeerAdmin@org1         │ TestPeerAdmin@org1 │                      │/
        Then The stdout information should include text matching /├────────────────────────────┼────────────────────┼──────────────────────┤/
        Then The stdout information should include text matching /│ TestPeerAdmin@org2         │ TestPeerAdmin@org2 │                      │/
        Then The stdout information should include text matching /└────────────────────────────┴────────────────────┴──────────────────────┘/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can ping the network that I just started
        When I run the following CLI command
            """
            composer network ping --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: basic-sample-network/
        Then The stdout information should include text matching /version:/
        Then The stdout information should include text matching /participant: org.hyperledger.composer.system.NetworkAdmin#admin/
        Then The stdout information should include text matching /identity: org.hyperledger.composer.system.Identity#.+?/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can verify that there no assets have been created yet
        When I run the following CLI command
            """
            composer network list --card admin@basic-sample-network -r org.acme.sample.SampleAsset
            """
        Then The stdout information should include text matching /models:/
        Then The stdout information should include text matching /- org.hyperledger.composer.system/
        Then The stdout information should include text matching /- org.acme.sample/
        Then The stdout information should include text matching /scripts:/
        Then The stdout information should include text matching /- lib/sample.js/
        Then The stdout information should include text matching /registries:/
        Then The stdout information should include text matching /org.acme.sample.SampleAsset:/
        Then The stdout information should include text matching /id:           org.acme.sample.SampleAsset/
        Then The stdout information should include text matching /name:         Asset registry for org.acme.sample.SampleAsset/
        Then The stdout information should include text matching /registryType: Asset/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can update the network to a newer version
        Given I have the following files
            | ../tmp/basic-sample-network-update.bna |

        When I run the following CLI command
            """
            composer network update --card admin@basic-sample-network -a ./tmp/basic-sample-network-update.bna
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate my network update
        When I run the following CLI command
            """
            composer network ping --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: basic-sample-network/
        Then The stdout information should include text matching /version:/
        Then The stdout information should include text matching /participant: org.hyperledger.composer.system.NetworkAdmin#admin/
        Then The stdout information should include text matching /identity: org.hyperledger.composer.system.Identity#.+?/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate that listing all the networks includes my update
        When I run the following CLI command
            """
            composer network list --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /org.acme.sample.NewSampleAsset/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create new Participants
        When I run the following CLI command
            """
            composer participant add --card admin@basic-sample-network -d '{"$class":"org.acme.sample.SampleParticipant","participantId":"bob","firstName":"bob","lastName":"bobbington"}'
            composer participant add --card admin@basic-sample-network -d '{"$class":"org.acme.sample.SampleParticipant","participantId":"sal","firstName":"sally","lastName":"sallyington"}'
            composer participant add --card admin@basic-sample-network -d '{"$class":"org.acme.sample.SampleParticipant","participantId":"fra","firstName":"frank","lastName":"frankington"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can check that my new Participants were created
        When I run the following CLI command
            """
            composer network list --card admin@basic-sample-network
            """
            Then The stdout information should include text matching /id:           org.acme.sample.SampleParticipant/
            Then The stdout information should include text matching /name:         Participant registry for org.acme.sample.SampleParticipant/
            Then The stdout information should include text matching /registryType: Participant/
            Then The stdout information should include text matching /assets: /
            Then The stdout information should include text matching /bob: /
            Then The stdout information should include text matching /\$class:        org.acme.sample.SampleParticipant/
            Then The stdout information should include text matching /participantId: bob/
            Then The stdout information should include text matching /firstName:     bob/
            Then The stdout information should include text matching /lastName:      bobbington/
            Then The stdout information should include text matching /sal: /
            Then The stdout information should include text matching /\$class:        org.acme.sample.SampleParticipant/
            Then The stdout information should include text matching /participantId: sal/
            Then The stdout information should include text matching /firstName:     sally/
            Then The stdout information should include text matching /lastName:      sallyington/
            Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create new Assets by submitting transactions
        When I run the following CLI command
            """
            composer transaction submit --card admin@basic-sample-network -d '{"$class": "org.hyperledger.composer.system.AddAsset","registryType": "Asset","registryId": "org.acme.sample.SampleAsset", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#org.acme.sample.SampleAsset", "resources": [{"$class": "org.acme.sample.SampleAsset","assetId": "newAsset","owner": "resource:org.acme.sample.SampleParticipant#bob","value": "101"}]}'
            composer transaction submit --card admin@basic-sample-network -d '{"$class": "org.hyperledger.composer.system.AddAsset","registryType": "Asset","registryId": "org.acme.sample.NewSampleAsset", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#org.acme.sample.SampleAsset", "resources": [{"$class": "org.acme.sample.NewSampleAsset","assetId": "newNewAsset","description":"Description","owner": "resource:org.acme.sample.SampleParticipant#sal","value": "101"}]}'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can check that the assets were created
        When I run the following CLI command
            """
            Then The stdout information should include text matching /newAsset/
            Then The stdout information should include text matching /newNewAsset/
            composer network list --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can check that the assets were created
        When I run the following CLI command
            """
            composer network list --card admin@basic-sample-network -r org.acme.sample.SampleAsset
            """
        Then The stdout information should include text matching /models: /
        Then The stdout information should include text matching /- org.hyperledger.composer.system/
        Then The stdout information should include text matching /- org.acme.sample/
        Then The stdout information should include text matching /scripts: /
        Then The stdout information should include text matching /- lib/sample.js/
        Then The stdout information should include text matching /registries: /
        Then The stdout information should include text matching /org.acme.sample.SampleAsset: /
        Then The stdout information should include text matching /id:           org.acme.sample.SampleAsset/
        Then The stdout information should include text matching /name:         Asset registry for org.acme.sample.SampleAsset/
        Then The stdout information should include text matching /registryType: Asset/
        Then The stdout information should include text matching /assets: /
        Then The stdout information should include text matching /newAsset: /
        Then The stdout information should include text matching /\$class:  org.acme.sample.SampleAsset/
        Then The stdout information should include text matching /assetId: newAsset/
        Then The stdout information should include text matching /owner:   resource:org.acme.sample.SampleParticipant#bob/
        Then The stdout information should include text matching /value:   101/
        Then The stdout information should include text matching /newNewAsset: /
        Then The stdout information should include text matching /\$class:      org.acme.sample.NewSampleAsset/
        Then The stdout information should include text matching /assetId:     newNewAsset/
        Then The stdout information should include text matching /owner:       resource:org.acme.sample.SampleParticipant#sal/
        Then The stdout information should include text matching /value:       101/
        Then The stdout information should include text matching /description: Description/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can list all the current Identities
        When I run the following CLI command
            """
            composer identity list --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /\$class:      org.hyperledger.composer.system.Identity/
        Then The stdout information should include text matching /name:        admin/
        Then The stdout information should include text matching /issuer:/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue an Identity to the participant called Bob
        When I run the following CLI command
            """
            composer identity issue --card admin@basic-sample-network -u bob -a org.acme.sample.SampleParticipant#bob -f ./tmp/bob@basic-sample-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/bob@basic-sample-network.card |

    Scenario: Using the CLI, I can issue an Identity to the participant called Sally who can then issue and Identity to the participant called Frank
        When I run the following CLI command
            """
            composer identity issue -x --card admin@basic-sample-network -u sal -a org.acme.sample.SampleParticipant#sal -f ./tmp/sally@basic-sample-network.card
            composer identity issue -x --card admin@basic-sample-network -u fra -a org.acme.sample.SampleParticipant#fra -f ./tmp/frank@basic-sample-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/sally@basic-sample-network.card |
            | ../tmp/frank@basic-sample-network.card |

    Scenario: Using the CLI, I can validate that Bob's identity was created and is in the ISSUED state
        When I run the following CLI command
            """
            composer identity list --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /\$class:      org.hyperledger.composer.system.Identity/
        Then The stdout information should include text matching /name:        admin/
        Then The stdout information should include text matching /issuer:/
        Then The stdout information should include text matching /\$class:      org.hyperledger.composer.system.Identity/
        Then The stdout information should include text matching /name:        bob/
        Then The stdout information should include text matching /issuer:/
        Then The stdout information should include text matching /state:       ISSUED/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can import the card for bob
        Given I have the following items
            | ../tmp/bob@basic-sample-network.card |
        When I run the following CLI command
            """
            composer card import --file ./tmp/bob@basic-sample-network.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        Then The stdout information should include text matching /Card file: ./tmp/bob@basic-sample-network.card/
        Then The stdout information should include text matching /Card name: bob@basic-sample-network/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can verify that Bob's card was imported
        When I run the following CLI command
            """
            composer card list
            """
        Then The stdout information should include text matching /The following Business Network Cards are available:/
        Then The stdout information should include text matching /Connection Profile: hlfv1/
        Then The stdout information should include text matching /┌────────────────────────────┬────────────────────┬──────────────────────┐/
        Then The stdout information should include text matching /│ Card Name                  │ UserId             │ Business Network     │/
        Then The stdout information should include text matching /├────────────────────────────┼────────────────────┼──────────────────────┤/
        Then The stdout information should include text matching /│ admin@basic-sample-network │ admin              │ basic-sample-network │/
        Then The stdout information should include text matching /├────────────────────────────┼────────────────────┼──────────────────────┤/
        Then The stdout information should include text matching /│ bob@basic-sample-network   │ bob                │ basic-sample-network │/
        Then The stdout information should include text matching /├────────────────────────────┼────────────────────┼──────────────────────┤/
        Then The stdout information should include text matching /│ TestPeerAdmin@org1         │ TestPeerAdmin@org1 │                      │/
        Then The stdout information should include text matching /├────────────────────────────┼────────────────────┼──────────────────────┤/
        Then The stdout information should include text matching /│ TestPeerAdmin@org2         │ TestPeerAdmin@org2 │                      │/
        Then The stdout information should include text matching /└────────────────────────────┴────────────────────┴──────────────────────┘/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can connect to the business network using the newly imported card
        When I run the following CLI command
            """
            composer network list --card bob@basic-sample-network
            """
        Then The stdout information should include text matching /models:/
        Then The stdout information should include text matching /- org.hyperledger.composer.system/
        Then The stdout information should include text matching /- org.acme.sample/
        Then The stdout information should include text matching /scripts:/
        Then The stdout information should include text matching /- lib/sample.js/
        Then The stdout information should include text matching /registries:/
        Then The stdout information should include text matching /org.acme.sample.SampleAsset:/
        Then The stdout information should include text matching /id:           org.acme.sample.SampleAsset/
        Then The stdout information should include text matching /name:         Asset registry for org.acme.sample.SampleAsset/
        Then The stdout information should include text matching /registryType: Asset/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can see that connecting to the business network as Bob has ACTIVATED the identity
        When I run the following CLI command
            """
            composer identity list --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /\$class:      org.hyperledger.composer.system.Identity/
        Then The stdout information should include text matching /name:        admin/
        Then The stdout information should include text matching /issuer:/
        Then The stdout information should include text matching /\$class:      org.hyperledger.composer.system.Identity/
        Then The stdout information should include text matching /name:        bob/
        Then The stdout information should include text matching /issuer:/
        Then The stdout information should include text matching /state:       ACTIVATED/
        Then The stdout information should include text matching /Command succeeded/
        Then I save group 1 from the console output matching pattern ^[\S\s]*identityId:\s+([\S\s]*)\n\s+name:\s+bob[\S\s]*$ as alias BOBID

    Scenario: Using the CLI, I can revoke Bob's identity
        When I substitue the alias BOBID and run the following CLI command
            """
            composer identity revoke --identityId BOBID --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /was revoked and can no longer be used to connect to the business network./
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can see that Bob's diplomatic immunity has now been REVOKED
        When I run the following CLI command
            """
            composer identity list --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /\$class:      org.hyperledger.composer.system.Identity/
        Then The stdout information should include text matching /name:        admin/
        Then The stdout information should include text matching /issuer:/
        Then The stdout information should include text matching /\$class:      org.hyperledger.composer.system.Identity/
        Then The stdout information should include text matching /name:        bob/
        Then The stdout information should include text matching /issuer:/
        Then The stdout information should include text matching /state:       REVOKED/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can no longer access things using Bob's card
        When I run the following CLI command
            """
            composer network list --card bob@basic-sample-network
            """
        Then The stdout information should include text matching /The current identity, with the name '.+?' and the identifier '.+?', has been revoked/
        Then The stderr information should include text matching /List business network from card bob@basic-sample-network/

    @sams
    Scenario: Using the CLI, I can run a composer report command to create a file about the current environment
        When I run the following CLI command
            """
            composer report
            """
        Then The stdout information should include text matching /Creating Composer report/
        Then The stdout information should include text matching /Triggering node report.../
        Then The stdout information should include text matching /Created archive file: composer-report-/
        Then The stdout information should include text matching /Command succeeded/
        Then A new file matching this regex should be created /composer-report-/



