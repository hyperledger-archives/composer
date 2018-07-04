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

@cli @cli-other-networks
Feature: Cli-other-networks steps

    Background:
        Given I have admin business cards available
        And I have deployed the business network marbles-network as marbles-network-1
        And I have deployed the business network marbles-network as marbles-network-2
        And I have deployed the business network marbles-network as marbles-network-3
        And I have deployed the business network marbles-network as marbles-network-4

    Scenario: Using the CLI, I can create a participant in network 1
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card admin@marbles-network-1
              -d '{
                  "$class": "org.hyperledger.composer.system.AddParticipant",
                  "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger_composer.marbles.Player",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Player",
                    "email": "alice@email.com",
                    "firstName": "alice",
                    "lastName": "a"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can issue an identity called lostmymarbles to the participant in network 1
        When I run the following expected pass CLI command
            """
            composer identity issue --card admin@marbles-network-1 -u lostmymarbles -a resource:org.hyperledger_composer.marbles.Player#alice@email.com -f ./tmp/lostmymarbles_DONOTIMPORT@marbles-network-1.card
            """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/lostmymarbles_DONOTIMPORT@marbles-network-1.card |

    Scenario: Using the CLI, I can request certificates for the identity lostmymarbles
        Given I have saved the secret in file to LOSTMYMARBLES_SECRET
           """
           ./tmp/lostmymarbles_DONOTIMPORT@marbles-network-1.card
           """
        When I substitue the alias LOSTMYMARBLES_SECRET and run an expected pass CLI command
           """
           composer identity request --card admin@marbles-network-1 -u lostmymarbles -s LOSTMYMARBLES_SECRET -d ./tmp
           """
        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/lostmymarbles-pub.pem |
            | ../tmp/lostmymarbles-priv.pem |

    Scenario: Using the CLI, I can create a card for the identity lostmymarbles for use with network 1
        When I run the following expected pass CLI command
            | command | composer card create |
            | -p | ./profiles/basic-connection-org1.yaml |
            | -u | lostmymarbles |
            | -n | marbles-network-1 |
            | -c | ./tmp/lostmymarbles-pub.pem |
            | -k | ./tmp/lostmymarbles-priv.pem |
            | -f | ./tmp/lostmymarbles@marbles-network-1.card |

        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/lostmymarbles@marbles-network-1.card |

    Scenario: Using the CLI, I can import the card that was just created
        Given I have the following files
            | ../tmp/lostmymarbles@marbles-network-1.card |
        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/lostmymarbles@marbles-network-1.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        Then The stdout information should include text matching /Card file: ./tmp/lostmymarbles@marbles-network-1.card/
        Then The stdout information should include text matching /Card name: lostmymarbles@marbles-network-1/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create an asset in network 1
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card lostmymarbles@marbles-network-1
              -d '{
                  "$class": "org.hyperledger.composer.system.AddAsset",
                  "targetRegistry": "resource:org.hyperledger.composer.system.AssetRegistry#org.hyperledger_composer.marbles.Marble",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Marble",
                    "marbleId": "1001",
                    "size": "SMALL",
                    "color": "RED",
                    "owner": "resource:org.hyperledger_composer.marbles.Player#alice@email.com"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create a participant in network 2
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card admin@marbles-network-2
              -d '{
                  "$class": "org.hyperledger.composer.system.AddParticipant",
                  "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger_composer.marbles.Player",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Player",
                    "email": "bob@email.com",
                    "firstName": "bob",
                    "lastName": "b"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can bind an identity called lostmymarbles to the participant in network 2
        When I run the following expected pass CLI command
            """
            composer identity bind --card admin@marbles-network-2 -a resource:org.hyperledger_composer.marbles.Player#bob@email.com -e ./tmp/lostmymarbles-pub.pem
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create a card for the identity lostmymarbles for use with network 2
        When I run the following expected pass CLI command
            | command | composer card create |
            | -p | ./profiles/basic-connection-org1.yaml |
            | -u | lostmymarbles |
            | -n | marbles-network-2 |
            | -c | ./tmp/lostmymarbles-pub.pem |
            | -k | ./tmp/lostmymarbles-priv.pem |
            | -f | ./tmp/lostmymarbles@marbles-network-2.card |

        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/lostmymarbles@marbles-network-2.card |

    Scenario: Using the CLI, I can import the card that was just created
        Given I have the following files
            | ../tmp/lostmymarbles@marbles-network-2.card |
        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/lostmymarbles@marbles-network-2.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        Then The stdout information should include text matching /Card file: ./tmp/lostmymarbles@marbles-network-2.card/
        Then The stdout information should include text matching /Card name: lostmymarbles@marbles-network-2/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create an asset in network 2
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card lostmymarbles@marbles-network-2
              -d '{
                  "$class": "org.hyperledger.composer.system.AddAsset",
                  "targetRegistry": "resource:org.hyperledger.composer.system.AssetRegistry#org.hyperledger_composer.marbles.Marble",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Marble",
                    "marbleId": "1002",
                    "size": "SMALL",
                    "color": "YELLOW",
                    "owner": "resource:org.hyperledger_composer.marbles.Player#bob@email.com"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create a participant in network 3
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card admin@marbles-network-3
              -d '{
                  "$class": "org.hyperledger.composer.system.AddParticipant",
                  "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger_composer.marbles.Player",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Player",
                    "email": "charlie@email.com",
                    "firstName": "charlie",
                    "lastName": "c"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can bind an identity called lostmymarbles to the participant in network 3
        When I run the following expected pass CLI command
            """
            composer identity bind --card admin@marbles-network-3 -a resource:org.hyperledger_composer.marbles.Player#charlie@email.com -e ./tmp/lostmymarbles-pub.pem
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create a card for the identity lostmymarbles for use with network 3
        When I run the following expected pass CLI command
            | command | composer card create |
            | -p | ./profiles/basic-connection-org1.yaml |
            | -u | lostmymarbles |
            | -n | marbles-network-3 |
            | -c | ./tmp/lostmymarbles-pub.pem |
            | -k | ./tmp/lostmymarbles-priv.pem |
            | -f | ./tmp/lostmymarbles@marbles-network-3.card |

        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/lostmymarbles@marbles-network-3.card |

    Scenario: Using the CLI, I can import the card that was just created
        Given I have the following files
            | ../tmp/lostmymarbles@marbles-network-3.card |
        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/lostmymarbles@marbles-network-3.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        Then The stdout information should include text matching /Card file: ./tmp/lostmymarbles@marbles-network-3.card/
        Then The stdout information should include text matching /Card name: lostmymarbles@marbles-network-3/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create an asset in network 3
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card lostmymarbles@marbles-network-3
              -d '{
                  "$class": "org.hyperledger.composer.system.AddAsset",
                  "targetRegistry": "resource:org.hyperledger.composer.system.AssetRegistry#org.hyperledger_composer.marbles.Marble",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Marble",
                    "marbleId": "1003",
                    "size": "SMALL",
                    "color": "GREEN",
                    "owner": "resource:org.hyperledger_composer.marbles.Player#charlie@email.com"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create a participant in network 4
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card admin@marbles-network-4
              -d '{
                  "$class": "org.hyperledger.composer.system.AddParticipant",
                  "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger_composer.marbles.Player",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Player",
                    "email": "dana@email.com",
                    "firstName": "dana",
                    "lastName": "d"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can bind an identity called lostmymarbles to the participant in network 4
        When I run the following expected pass CLI command
            """
            composer identity bind --card admin@marbles-network-4 -a resource:org.hyperledger_composer.marbles.Player#dana@email.com -e ./tmp/lostmymarbles-pub.pem
            """
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create a card for the identity lostmymarbles for use with network 4
        When I run the following expected pass CLI command
            | command | composer card create |
            | -p | ./profiles/basic-connection-org1.yaml |
            | -u | lostmymarbles |
            | -n | marbles-network-4 |
            | -c | ./tmp/lostmymarbles-pub.pem |
            | -k | ./tmp/lostmymarbles-priv.pem |
            | -f | ./tmp/lostmymarbles@marbles-network-4.card |

        Then The stdout information should include text matching /Command succeeded/
        Then I have the following files
            | ../tmp/lostmymarbles@marbles-network-4.card |

    Scenario: Using the CLI, I can import the card that was just created
        Given I have the following files
            | ../tmp/lostmymarbles@marbles-network-4.card |
        When I run the following expected pass CLI command
            """
            composer card import --file ./tmp/lostmymarbles@marbles-network-4.card
            """
        Then The stdout information should include text matching /Successfully imported business network card/
        Then The stdout information should include text matching /Card file: ./tmp/lostmymarbles@marbles-network-4.card/
        Then The stdout information should include text matching /Card name: lostmymarbles@marbles-network-4/
        Then The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can create an asset in network 4
        When I run the following expected pass CLI command
            """
            composer transaction submit
              --card lostmymarbles@marbles-network-4
              -d '{
                  "$class": "org.hyperledger.composer.system.AddAsset",
                  "targetRegistry": "resource:org.hyperledger.composer.system.AssetRegistry#org.hyperledger_composer.marbles.Marble",
                  "resources": [{
                    "$class": "org.hyperledger_composer.marbles.Marble",
                    "marbleId": "1004",
                    "size": "SMALL",
                    "color": "BLUE",
                    "owner": "resource:org.hyperledger_composer.marbles.Player#dana@email.com"
                  }]
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        And The stdout information should include text matching /Command succeeded/

    Scenario: Using the CLI, I can execute a transaction that returns all of the assets from all of the networks via network 1
        When I run the following expected pass CLI command
            """
            composer transaction submit
              -c lostmymarbles@marbles-network-1
              -d '{
                    "$class": "org.hyperledger_composer.marbles.GetAllMarbles"
                }'
            """
        Then The stdout information should include text matching /Transaction Submitted./
        Then The stdout information should include text matching /marbleId: 1001/
        Then The stdout information should include text matching /marbleId: 1002/
        Then The stdout information should include text matching /marbleId: 1003/
        Then The stdout information should include text matching /marbleId: 1004/
        And The stdout information should include text matching /Command succeeded/
