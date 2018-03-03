@cli-identities
Feature: Cli-identities steps

    Background:
        Given I have admin business cards available
        And I have deployed the business network basic-sample-network

    Scenario: Using the CLI, I can create new Participants
        When I run the following expected pass CLI command
            """
            composer participant add --card admin@basic-sample-network -d '{"$class":"org.acme.sample.SampleParticipant","participantId":"bob","firstName":"bob","lastName":"bobbington"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create new Participants
        When I run the following expected pass CLI command
            """
            composer participant add --card admin@basic-sample-network -d '{"$class":"org.acme.sample.SampleParticipant","participantId":"sal","firstName":"sally","lastName":"sallyington"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create new Participants
        When I run the following expected pass CLI command
            """
            composer participant add --card admin@basic-sample-network -d '{"$class":"org.acme.sample.SampleParticipant","participantId":"fra","firstName":"frank","lastName":"frankington"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create new Participants
        When I run the following expected pass CLI command
            """
            composer participant add --card admin@basic-sample-network -d '{"$class":"org.acme.sample.SampleParticipant","participantId":"ange","firstName":"angela","lastName":"angleton"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can check that my new Participants were created
        When I run the following expected pass CLI command
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

    Scenario: Using the CLI, I can list all the current Identities
        When I run the following expected pass CLI command
            """
            composer identity list --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /\$class:      org.hyperledger.composer.system.Identity/
        Then The stdout information should include text matching /name:        admin/
        Then The stdout information should include text matching /issuer:/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue an Identity to the participant called Sal
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@basic-sample-network -u sal -a org.acme.sample.SampleParticipant#sal -f ./tmp/sal_DONOTIMPORT@basic-sample-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/sal_DONOTIMPORT@basic-sample-network.card |

    Scenario: Using the CLI, I can request the idenity for sal
        Given I have saved the secret in file to SAL_SECRET
           """
           ./tmp/sal_DONOTIMPORT@basic-sample-network.card
           """
        When I substitue the alias SAL_SECRET and run an expected pass CLI command
           """
           composer identity request --card admin@basic-sample-network -u sal -s SAL_SECRET -d ./tmp
           """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/sal-pub.pem |
            | ../tmp/sal-priv.pem |

    Scenario: Using the CLI, I can create a card for the sal identity
        When I run the following expected pass CLI command
            | command | composer card create |
            | -p | ./profiles/basic-connection-org1.json |
            | -u | sal |
            | -n | basic-sample-network |
            | -c | ./tmp/sal-pub.pem |
            | -k | ./tmp/sal-priv.pem |
            | -f | ./tmp/sal@basic-sample-network.card |

        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/sal@basic-sample-network.card |

    Scenario: Using the CLI, I can import the card that was just created
        Given I have the following files
            | ../tmp/sal@basic-sample-network.card |
        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/sal@basic-sample-network.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        Then The stdout information should include text matching /Card file: ./tmp/sal@basic-sample-network.card/
        Then The stdout information should include text matching /Card name: sal@basic-sample-network/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate my user sal through a network ping
        When I run the following expected pass CLI command
            """
            composer network ping --card sal@basic-sample-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: basic-sample-network/
        Then The stdout information should include text matching /version:/
        Then The stdout information should include text matching /participant: org.acme.sample.SampleParticipant#sal/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue an Identity with issuer authority to the participant called Ange
        When I run the following expected pass CLI command
            """
            composer identity issue -x --card admin@basic-sample-network -u ange -a org.acme.sample.SampleParticipant#ange -f ./tmp/ange@basic-sample-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/ange@basic-sample-network.card |

    Scenario: Using the CLI, I can import Ange into my card store
        Given I have the following files
            | ../tmp/ange@basic-sample-network.card |
        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/ange@basic-sample-network.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        Then The stdout information should include text matching /Card file: ./tmp/ange@basic-sample-network.card/
        Then The stdout information should include text matching /Card name: ange@basic-sample-network/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue an Identity to the participant called Frank using Ange
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@basic-sample-network -u fra -a org.acme.sample.SampleParticipant#fra -f ./tmp/frank@basic-sample-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/frank@basic-sample-network.card |

    Scenario: Using the CLI, I can issue an Identity to the participant called Bob
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@basic-sample-network -u bob -a org.acme.sample.SampleParticipant#bob -f ./tmp/bob@basic-sample-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/bob@basic-sample-network.card |

    Scenario: Using the CLI, I can validate that Bob's identity was created and is in the ISSUED state
        When I run the following expected pass CLI command
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
        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/bob@basic-sample-network.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        Then The stdout information should include text matching /Card file: ./tmp/bob@basic-sample-network.card/
        Then The stdout information should include text matching /Card name: bob@basic-sample-network/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can verify that Bob's card was imported
        When I run the following expected pass CLI command
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
        When I run the following expected pass CLI command
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
        When I run the following expected pass CLI command
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
        When I substitue the alias BOBID and run an expected pass CLI command
            """
            composer identity revoke --identityId BOBID --card admin@basic-sample-network
            """
        Then The stdout information should include text matching /was revoked and can no longer be used to connect to the business network./
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can see that Bob's identity has now been REVOKED
        When I run the following expected pass CLI command
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
        When I run the following expected fail CLI command
            """
            composer network list --card bob@basic-sample-network
            """
        Then The stdout information should include text matching /The current identity, with the name '.+?' and the identifier '.+?', has been revoked/
        Then The stderr information should include text matching /List business network from card bob@basic-sample-network/
