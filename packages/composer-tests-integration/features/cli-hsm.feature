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

@cli @hsm
Feature: Cli steps

    Background:
        Given I have admin business cards available
        And I have deployed the business network trade-network

    Scenario: Using the CLI, I can create new Participants
        When I run the following expected pass CLI command
            """
            composer participant add --card admin@trade-network -d '{"$class":"org.acme.trading.Trader","tradeId":"bob2","firstName":"bob","lastName":"bobbington"}'
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue an Identity to the participant called Bob
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@trade-network -u bob2 -a org.acme.trading.Trader#bob2 -f ./tmp/bob2@trade-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/bob2@trade-network.card |

    Scenario:
        Given I have the following items
            | ../tmp/bob2@trade-network.card |
        When I convert a card to be HSM managed
            """
            ./tmp/bob2@trade-network.card
            """
        Then I have the following files
            | ../tmp/bob2_hsm@trade-network.card |

    Scenario: Using the CLI, I can import the hsm managed card that was just created
        Given I have the following files
            | ../tmp/bob2_hsm@trade-network.card |
        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/bob2_hsm@trade-network.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        And The stdout information should include text matching /Card file: ./tmp/bob2_hsm@trade-network.card/
        And The stdout information should include text matching /Card name: bob2@trade-network/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can verify that Bob's card was imported
        When I run the following expected pass CLI command
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
        And The stdout information should include text matching /│ bob2@trade-network  │ bob2               │ trade-network    │/
        And The stdout information should include text matching /├─────────────────────┼────────────────────┼──────────────────┤/
        And The stdout information should include text matching /│ TestPeerAdmin@org1  │ TestPeerAdmin@org1 │                  │/
        And The stdout information should include text matching /├─────────────────────┼────────────────────┼──────────────────┤/
        And The stdout information should include text matching /│ TestPeerAdmin@org2  │ TestPeerAdmin@org2 │                  │/
        And The stdout information should include text matching /└─────────────────────┴────────────────────┴──────────────────┘/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate my user bob2
        When I run the following expected pass CLI command
            """
            composer network ping --card bob2@trade-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: trade-network/
        And The stdout information should include text matching /participant: org.acme.trading.Trader#bob2/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can see the card that I just imported is now showing HSM managed
        When I run the following expected pass CLI command
            """
            composer card list --card bob2@trade-network
            """
        Then The stdout information should include text matching /credentials:         Credentials set, HSM managed/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can export an HSM managed card
        When I run the following expected pass CLI command
            """
            composer card export --card bob2@trade-network -f ./tmp/bob2_exported@trade-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        And I have the following files
            | ../tmp/bob2_exported@trade-network.card |

    Scenario: Using the CLI, I can delete an HSM managed card
        When I run the following expected pass CLI command
            """
            composer card delete --card bob2@trade-network
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can import an HSM managed card
        Given I have the following files
            | ../tmp/bob2_exported@trade-network.card |

        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/bob2_exported@trade-network.card
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate my user bob2 again
        When I run the following expected pass CLI command
            """
            composer network ping --card bob2@trade-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: trade-network/
        And The stdout information should include text matching /participant: org.acme.trading.Trader#bob2/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue another Identity to the participant called Bob
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@trade-network -u fred -a org.acme.trading.Trader#bob2 -f ./tmp/fred@trade-network.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/fred@trade-network.card |

    Scenario: Using the CLI, I can request this identity and it will be hsm managed
        Given I have saved the secret in file to FRED_SECRET
           """
           ./tmp/fred@trade-network.card
           """
        When I substitue the alias FRED_SECRET and run an expected pass CLI command
           """
           composer identity request --card bob2@trade-network -u fred -s FRED_SECRET -d ./tmp
           """
        Then The stdout information should include text matching /Command succeeded/
        And I have the following files
            | ../tmp/fred-pub.pem |

    Scenario: Using the CLI, I can create an HSM managed card
        When I run the following expected pass CLI command
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
        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/fred_hsm@trade-network.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        And The stdout information should include text matching /Card file: ./tmp/fred_hsm@trade-network.card/
        And The stdout information should include text matching /Card name: fred@trade-network/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can see the card that I just imported is now showing HSM managed
        When I run the following expected pass CLI command
            """
            composer card list --card fred@trade-network
            """
        Then The stdout information should include text matching /credentials:         Credentials set, HSM managed/
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can validate my user fred
        When I run the following expected pass CLI command
            """
            composer network ping --card fred@trade-network
            """
        Then The stdout information should include text matching /The connection to the network was successfully tested: trade-network/
        And The stdout information should include text matching /participant: org.acme.trading.Trader#bob2/
        And The stdout information should include text matching /Command succeeded/
