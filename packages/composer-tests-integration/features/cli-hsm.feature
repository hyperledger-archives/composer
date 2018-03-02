@hsm
Feature: Cli steps

    Background:
        Given I have admin business cards available
        And I have deployed the business network trade-network

    Scenario: Using the CLI, I can create new Participants
        When I run the following CLI command
            """
            composer participant add --card admin@trade-network -d '{"$class":"org.acme.trading.Trader","participantId":"bob","firstName":"bob","lastName":"bobbington"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue an Identity to the participant called Bob
        When I run the following CLI command
            """
            composer identity issue --card admin@trade-network -u bob -a org.acme.trading.Trader#bob -f ./tmp/bob@trade-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/bob@trade-network.card |

    Scenario:
        Given I have the following items
            | ../tmp/bob@trade-network.card |
        When I convert a card to be HSM managed
            """
            ./tmp/bob@trade-network.card
            """
        Then I have the following files
            | ../tmp/bob_hsm@trade-network.card |

    Scenario: Using the CLI, I can import the hsm managed card that was just created
        Given I have the following files
            | ../tmp/bob_hsm@trade-network.card |
        When I run the following CLI command
            """
            composer card import --file ./tmp/bob_hsm@trade-network.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        And The stdout information should include text matching /Card file: ./tmp/bob_hsm@trade-network.card/
        And The stdout information should include text matching /Card name: bob@trade-network/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can verify that Bob's card was imported
        When I run the following CLI command

            """
            composer card list
            """
        Then The stdout information should include text matching /The following Business Network Cards are available:/
        And The stdout information should include text matching /Connection Profile: hlfv1/
        And The stdout information should include text matching /┌─────────────────────┬────────────────────┬──────────────────┐/
        And The stdout information should include text matching /│ Card Name           │ UserId             │ Business Network │/
        And The stdout information should include text matching /├─────────────────────┼────────────────────┼──────────────────┤/
        And The stdout information should include text matching /│ admin@trade-network │ admin              │ trade-network    │/
        And The stdout information should include text matching /├─────────────────────┼────────────────────┼──────────────────┤/
        And The stdout information should include text matching /│ bob@trade-network   │ bob                │ trade-network    │/
        And The stdout information should include text matching /├─────────────────────┼────────────────────┼──────────────────┤/
        And The stdout information should include text matching /│ TestPeerAdmin@org1  │ TestPeerAdmin@org1 │                  │/
        And The stdout information should include text matching /├─────────────────────┼────────────────────┼──────────────────┤/
        And The stdout information should include text matching /│ TestPeerAdmin@org2  │ TestPeerAdmin@org2 │                  │/
        And The stdout information should include text matching /└─────────────────────┴────────────────────┴──────────────────┘/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate my user bob
        When I run the following CLI command
            """
            composer network ping --card bob@trade-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: trade-network/
        And The stdout information should include text matching /participant: org.acme.trading.Trader#bob/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can see the card that I just imported is now showing HSM managed
        When I run the following CLI command
            """
            composer card list --name bob@trade-network
            """
        Then The stdout information should include text matching /credentialsSet:      Credentials set, HSM managed/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can export an HSM managed card
        When I run the following CLI command
            """
            composer card export --name bob@trade-network -f ./tmp/bob_exported@trade-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        And I have the following files
            | ../tmp/bob_exported@trade-network.card |

    Scenario: Using the CLI, I can delete an HSM managed card
        When I run the following CLI command
            """
            composer card delete --name bob@trade-network
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can import an HSM managed card
        Given I have the following files
            | ../tmp/bob_exported@trade-network.card |

        When I run the following CLI command
            """
            composer card import --file ./tmp/bob_exported@trade-network.card
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate my user bob again
        When I run the following CLI command
            """
            composer network ping --card bob@trade-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: trade-network/
        And The stdout information should include text matching /participant: org.acme.trading.Trader#bob/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue another Identity to the participant called Bob
        When I run the following CLI command
            """
            composer identity issue --card admin@trade-network -u fred -a org.acme.trading.Trader#bob -f ./tmp/fred@trade-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/fred@trade-network.card |

    Scenario: Using the CLI, I can request this identity and it will be hsm managed
        Given I have saved the secret in file to FRED_SECRET
           """
           ./tmp/fred@trade-network.card
           """
        When I substitue the alias FRED_SECRET and run the following CLI command
           """
           composer identity request --card bob@trade-network -u fred -s FRED_SECRET -d ./tmp
           """
        Then The stdout information should include text matching /Command succeeded/
        And I have the following files
            | ../tmp/fred-pub.pem |

    Scenario: Using the CLI, I can create an HSM managed card
        When I run the following CLI command
            | command | composer card create |
            | -p | ./profiles/basic-connection-org1-hsm.json |
            | -u | fred |
            | -n | trade-network |
            | -c | ./tmp/fred-pub.pem |
            | -f | ./tmp/fred_hsm@trade-network.card |

        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/fred_hsm@trade-network.card |

    Scenario: Using the CLI, I can import the hsm managed card that was just created
        Given I have the following files
            | ../tmp/fred_hsm@trade-network.card |
        When I run the following CLI command
            """
            composer card import --file ./tmp/fred_hsm@trade-network.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        And The stdout information should include text matching /Card file: ./tmp/fred_hsm@trade-network.card/
        And The stdout information should include text matching /Card name: fred@trade-network/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can see the card that I just imported is now showing HSM managed
        When I run the following CLI command
            """
            composer card list --name fred@trade-network
            """
        Then The stdout information should include text matching /credentialsSet:      Credentials set, HSM managed/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate my user fred
        When I run the following CLI command
            """
            composer network ping --card fred@trade-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: trade-network/
        And The stdout information should include text matching /participant: org.acme.trading.Trader#bob/
        And The stdout information should include text matching /Command succeeded/
