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
            composer runtime install --card TestPeerAdmin@org1-only --businessNetworkName basic-sample-network
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can perform a runtime install on org2
        When I run the following CLI command
            """
            composer runtime install --card TestPeerAdmin@org2-only --businessNetworkName basic-sample-network
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

    Scenario: Using the CLI, I can perform a business network start
        Given I have the following files
            | ../tmp/basic-sample-network.bna |
        When I run the following CLI command
            """
            composer network start --card TestPeerAdmin@org1 --networkAdmin admin --networkAdminSecret adminpw --archiveFile ./tmp/basic-sample-network.bna --file networkadmin
            """
        Then The stdout information should include text matching /Command succeeded/
