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

@tutorial @developer-tutorial
Feature: Developer tutorial

    Scenario: Starting developer tutorial
        Given I have admin business cards available
        Given I am doing the developer tutorial

    Scenario: Step One: Creating a business network structure
        When I run the yo command from the tutorial:
            | command          | identifiedBy:create-network   |
            | --appname        | identifiedBy:network-name     |
            | --applicense     | identifiedBy:license          |
            | --ns             | identifiedBy:namespace        |
            | --appdescription | King conga\'s special network |
            | --appauthor      | King Conga                    |
            | --appemail       | king@conga-email              |
            | --empty          | identifiedBy:empty            |

        Then I have the following files
            | ../tutorial-network/.eslintrc.yml                    |
            | ../tutorial-network/README.md                        |
            | ../tutorial-network/package.json                     |
            | ../tutorial-network/permissions.acl                  |
            | ../tutorial-network/models/org.example.mynetwork.cto |
            | ../tutorial-network/lib/logic.js                     |
            | ../tutorial-network/test/logic.js                    |
            | ../tutorial-network/features/sample.feature          |
            | ../tutorial-network/features/support/index.js        |

    Scenario: Step Two: Defining a business network
        Given I have used the tutorial to create a network called tutorial-network
        And I replace the contents of the following files made by the tutorial:
            | folder | filename                       | content                          |
            | models | identifiedBy:model-file-name   | identifiedBy:model-file-content  |
            | lib    | identifiedBy:script-file-name  | identifiedBy:script-file-content |
            | .      | identifiedBy:acl-file-name     | identifiedBy:acl-file-content    |

    Scenario: Step Three: Generate a business network archive
        Given I have navigated to the folder:
            """
            identifiedBy:created-network-folder
            """
        When I run the cli command from the tutorial:
            | command | identifiedBy:archive-create |

        Then I have the following files
            | ../tutorial-network/tutorial-network@0.0.1.bna |

    Scenario: Step Four: Deploying the business network
        # HANDLE THAT INTEGRATION TESTS USE MULTI ORG UNLIKE THE DEV TUT WHICH USERS FABRIC TOOLS SINGLE ORG
        When I run the cli command from the tutorial substituting PeerAdmin@hlfv1 with TestPeerAdmin@org1:
            | command | identifiedBy:network-install |
            | -o      | npmrcFile=/tmp/npmrc         |
        And I run the cli command from the tutorial substituting PeerAdmin@hlfv1 with TestPeerAdmin@org2:
            | command | identifiedBy:network-install |
            | -o      | npmrcFile=/tmp/npmrc         |
        And I run the cli command from the tutorial substituting PeerAdmin@hlfv1 with TestPeerAdmin@org1:
            | command | identifiedBy:network-start |
        And I run the cli command from the tutorial:
            | command | identifiedBy:card-import |
        And I run the cli command from the tutorial:
            | command | identifiedBy:network-ping |
        Then The stdout information should include text matching /The connection to the network was successfully tested: tutorial-network/

    Scenario: Step Five: Generating a REST server
        Given I run in the background the rest-server command from the tutorial:
            | command          | identifiedBy:start-rest-server     |
            | --card           | identifiedBy:admin-card            |
            | --namespaces     | identifiedBy:use-namespaces        |
            | --authentication | identifiedBy:enable-authentication |
            | --websockets     | identifiedBy:publish-events        |
            | --tls            | identifiedBy:enable-tls            |
            | wait for         | Browse your REST API               |

    Scenario: Step Six: Generating an application
        When I run the yo command from the tutorial:
            | command          | identifiedBy:create-app    |
            | --liveNetwork    | identifiedBy:live-network  |
            | --appName        | tutorial-application       |
            | --appDescription | King conga\'s special app  |
            | --authorName     | King Conga                 |
            | --authorEmail    | king@conga-email           |
            | --license        | Free4Congas                |
            | --cardName       | identifiedBy:card-name     |
            | --apiServer      | identifiedBy:api-url       |
            | --apiPort        | identifiedBy:api-port      |
            | --apiNamespace   | never                      |
        And I run in the background the npm command from the tutorial:
            | command  | identifiedBy:start-app |
            | --prefix | identifiedBy:navigate-for-angular |
            |          | /tutorial-application  |
            | wait for | Compiled successfully. |
        And I make a request to the tutorials suggested app url:
            """
            identifiedBy:app-url
            """
        Then The response code should be 200

    Scenario: Finally, shutdown the REST server and angular app
         When I kill task named REST-SERVER
         When I kill task named NPM
         When I kill process on port 4200

