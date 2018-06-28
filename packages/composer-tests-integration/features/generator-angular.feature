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

@generator @generator-angular
Feature: Angular Application Generator

    Background:
        Given I have admin business cards available
        And I have deployed the business network test-network

    Scenario: Using the Composer generator, I can generate an Angular web application AND REST Server
        When I run the following expected pass CLI command
            | command | yo hyperledger-composer:angular |
            | --liveNetwork | true |
            | --appName | my-angular-app |
            | --appDescription | a description for my angular network |
            | --authorName | Kai Usher |
            | --authorEmail | kai@congaverse.com |
            | --license | Apache-2.0 |
            | --cardName | admin@test-network |
            | --apiServer | generate |
            | --apiPort | 3000 |
            | --apiNamespace | never |
        Then I have the following files
            | ../my-angular-app/src/app/app.module.ts |
            | ../my-angular-app/src/app/Commodity/Commodity.component.ts |
            | ../my-angular-app/src/app/Trade/Trade.component.ts |
            | ../my-angular-app/src/app/Trader/Trader.component.ts |
            | ../my-angular-app/e2e/app.e2e-spec.ts |

    Scenario: I can run the generated unit tests
        When I run the following expected pass CLI command
            """
            npm test --prefix ./my-angular-app
            """
        Then The stdout information should include text matching /Executed 11 of 11 SUCCESS/

    Scenario: I can start the generated application and test it with generated integration tests
        When I spawn the following background task GENERATED_APP, and wait for /webpack: Compiled successfully./
            """
            npm start --prefix ./my-angular-app
            """
        And I run the following expected pass CLI command
            """
            npm run e2e --prefix ./my-angular-app
            """
        Then The stdout information should include text matching /SUCCESS/

    Scenario: Finally, shutdown the REST server and angular app
        When I kill process on port 4200
        When I kill process on port 3000
