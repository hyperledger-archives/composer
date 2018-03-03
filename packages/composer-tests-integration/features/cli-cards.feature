@cli-cards
Feature: CLI cards steps

    Background:
        Given I have admin business cards available

    Scenario: Using the CLI, I can create a business network card using a connection profile and certificates
        Given I have the following items
            | ../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts |
            | ../hlfv1/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore |
            | ../profiles/basic-connection-org1.json |
        When I run the following expected pass CLI command
            | command | composer card create |
            | -p | ./profiles/basic-connection-org1.json |
            | -u | PeerAdmin |
            | -c | ./hlfv1/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem |
            | -k | ./hlfv1/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/key.pem |
            | -r | PeerAdmin |
            | -r | ChannelAdmin |
            | -f | ./tmp/PeerAdmin.card |

        Then The stdout information should include text matching /Command succeeded/
        And I have the following files
            | ../tmp/PeerAdmin.card |

    Scenario: Using the CLI, I can import a business network card
        Given I have the following files
            | ../tmp/PeerAdmin.card |
        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/PeerAdmin.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        And The stdout information should include text matching /Card file: ./tmp/PeerAdmin.card/
        And The stdout information should include text matching /Card name: PeerAdmin@hlfv1/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can see the card that I just imported in the list of cards
        When I run the following expected pass CLI command
            """
            composer card list
            """
        Then The stdout information should include text matching /The following Business Network Cards are available:/
        And The stdout information should include text matching /Connection Profile: hlfv1/
        And The stdout information should include text matching /┌────────────────────┬────────────────────┬──────────────────┐/
        And The stdout information should include text matching /│ Card Name          │ UserId             │ Business Network │/
        And The stdout information should include text matching /├────────────────────┼────────────────────┼──────────────────┤/
        And The stdout information should include text matching /│ PeerAdmin@hlfv1    │ PeerAdmin          │                  │/
        And The stdout information should include text matching /├────────────────────┼────────────────────┼──────────────────┤/
        And The stdout information should include text matching /│ TestPeerAdmin@org1 │ TestPeerAdmin@org1 │                  │/
        And The stdout information should include text matching /├────────────────────┼────────────────────┼──────────────────┤/
        And The stdout information should include text matching /│ TestPeerAdmin@org2 │ TestPeerAdmin@org2 │                  │/
        And The stdout information should include text matching /└────────────────────┴────────────────────┴──────────────────┘/
        And The stdout information should include text matching /Command succeeded/

    Scenario: When using the CLI, I can see the details of the card that I just imported
        When I run the following expected pass CLI command
            """
            composer card list -n PeerAdmin@hlfv1
            """
        Then The stdout information should include text matching /userName:            PeerAdmin/
        And The stdout information should include text matching /description:/
        And The stdout information should include text matching /businessNetworkName:/
        And The stdout information should include text matching /identityId:          [0-9a-z]{64}/
        And The stdout information should include text matching /roles:/
        And The stdout information should include text matching /- ChannelAdmin/
        And The stdout information should include text matching /connectionProfile:/
        And The stdout information should include text matching /  name:   hlfv1/
        And The stdout information should include text matching /  x-type: hlfv1/
        And The stdout information should include text matching /secretSet:           No secret set/
        And The stdout information should include text matching /credentialsSet:      Credentials set/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I should get an error if I try to delete a card which doesn't exist
        When I run the following expected fail CLI command
            """
            composer card delete -n nobody@penguin
            """
        Then The stdout information should include text matching /Command failed/

    Scenario: Using the CLI, I can export a card that exists in my wallet
        When I run the following expected pass CLI command
            """
            composer card export --name PeerAdmin@hlfv1 --file ./tmp/ExportedPeerAdmin.card
            """
        Then The stdout information should include text matching /Command succeeded/
        And I have the following files
            | ../tmp/PeerAdmin.card |

    Scenario: Using the CLI, I can delete a named card that exists
        When I run the following expected pass CLI command
            """
            composer card delete --name PeerAdmin@hlfv1
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I get a relevant message when I import a card that has invalid name format created from an invalid common connection profile.
        Given I have the following files
            | ../resources/cards/PeerAdminInvalidName@hlfv1.card |
        When I run the following expected fail CLI command
            """
            composer card import --file ./resources/cards/PeerAdminInvalidName@hlfv1.card
            """
        Then The stdout information should include text matching /Failed to import the business network card/
        And The stdout information should include text matching /keyword:    type/
        And The stdout information should include text matching /dataPath:   .name/
        And The stdout information should include text matching /schemaPath: #/properties/name/type/
        And The stdout information should include text matching /message:    should be string/
        And The stdout information should include text matching /Errors found in the connection profile in the card/
