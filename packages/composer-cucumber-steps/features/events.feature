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

Feature: Event steps

    Background:
        Given I have deployed the business network definition basic-sample-network
        And I have added the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        And I have added the following asset of type org.acme.sample.SampleAsset
            | assetId | owner | value |
            | 1       | 1     | 10    |

    Scenario: then I should have received the following event of type (1)
        When I submit the following transaction of type org.acme.sample.SampleTransaction
            | asset  | newValue |
            | 1      | 100      |
        Then I should have received the following event of type org.acme.sample.SampleEvent
            | asset | oldValue | newValue |
            | 1       | 10       | 100      |

    Scenario: then I should have received the following events
        When I submit the following transaction of type org.acme.sample.SampleTransaction
            | asset  | newValue |
            | 1      | 100      |
        Then I should have received the following event
            """
            {"$class":"org.acme.sample.SampleEvent", "asset":"1", "oldValue":"10", "newValue":"100"}
            """

    Scenario: then I should have received the following events of type (1)
        When I submit the following transaction of type org.acme.sample.SampleTransaction
            | asset  | newValue |
            | 1      | 20       |
            | 1      | 100      |
        Then I should have received the following event of type org.acme.sample.SampleEvent
            | asset | oldValue | newValue |
            | 1       | 10       | 20       |
            | 1       | 20       | 100      |

    Scenario: then I should have received the following events
        When I submit the following transaction of type org.acme.sample.SampleTransaction
            | asset  | newValue |
            | 1      | 20       |
            | 1      | 100      |
        Then I should have received the following events
            """
            [
                {"$class":"org.acme.sample.SampleEvent", "asset":"1", "oldValue":"10", "newValue":"20"},
                {"$class":"org.acme.sample.SampleEvent", "asset":"1", "oldValue":"20", "newValue":"100"}
            ]
            """

    Scenario: I should get an error when I do not receive an event of type (1)
        Then I should have received the following event of type org.acme.sample.SampleEvent
            | asset | oldValue | newValue |
            | 1       | 10       | 20       |
        And I should get an error matching /failed to find expected event/
