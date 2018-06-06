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

Feature: Participant steps

    Background:
        Given I have deployed the business network definition basic-sample-network

    Scenario: given I have added the following participant of type (1)
        Given I have added the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        Then I should have the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |

    Scenario: given I have added the following participant
        Given I have added the following participant
            """
            {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"}
            """
        Then I should have the following participant
            """
            {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"}
            """

    Scenario: given I have added the following participants of type (1)
        Given I have added the following participants of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
            | 2             | Bob       | B        |
        Then I should have the following participants of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
            | 2             | Bob       | B        |

    Scenario: given I have added the following participants
        Given I have added the following participants
            """
            [
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"},
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"2", "firstName":"Bob", "lastName":"B"}
            ]
            """
        Then I should have the following participants
            """
            [
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"},
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"2", "firstName":"Bob", "lastName":"B"}
            ]
            """

    Scenario: when I add the following participant of type (1)
        When I add the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        Then I should have the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |

    Scenario: when I add the following participant
        When I add the following participant
            """
            {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"}
            """
        Then I should have the following participant
            """
            {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"}
            """

    Scenario: when I add the following participants of type (1)
        When I add the following participants of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
            | 2             | Bob       | B        |
        Then I should have the following participants of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
            | 2             | Bob       | B        |

    Scenario: when I add the following participants
        When I add the following participants
            """
            [
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"},
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"2", "firstName":"Bob", "lastName":"B"}
            ]
            """
        Then I should have the following participants
            """
            [
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"},
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"2", "firstName":"Bob", "lastName":"B"}
            ]
            """

    Scenario: when I update the following participant of type (1)
        Given I have added the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        When I update the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | C        |
        Then I should have the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | C        |

    Scenario: when I update the following participant
        Given I have added the following participant
            """
            {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"}
            """
        When I update the following participant
            """
            {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"C"}
            """
        Then I should have the following participant
            """
            {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"C"}
            """

    Scenario: when I update the following participants of type (1)
        Given I have added the following participants of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
            | 2             | Bob       | B        |
        When I update the following participants of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | C        |
            | 2             | Bob       | D        |
        Then I should have the following participants of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | C        |
            | 2             | Bob       | D        |

    Scenario: when I update the following participants
        Given I have added the following participants
            """
            [
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"},
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"2", "firstName":"Bob", "lastName":"B"}
            ]
            """
        When I update the following participants
            """
            [
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"C"},
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"2", "firstName":"Bob", "lastName":"D"}
            ]
            """
        Then I should have the following participants
            """
            [
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"C"},
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"2", "firstName":"Bob", "lastName":"D"}
            ]
            """

    Scenario: when I remove the following participant of type (1)
        Given I have added the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        When I remove the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        Then I should not have the following participant of type org.acme.sample.SampleParticipant
            | participantId |
            | 1             |

    Scenario: when I remove the following participants
        Given I have added the following participant
            """
            {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"}
            """
        When I remove the following participant
            """
            {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"}
            """
        Then I should not have the following participant
            """
            {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"}
            """

    Scenario: when I remove the following participants of type (1)
        Given I have added the following participants of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
            | 2             | Bob       | B        |
        When I remove the following participants of type org.acme.sample.SampleParticipant
            | participantId |
            | 1             |
            | 2             |
        Then I should not have the following participants of type org.acme.sample.SampleParticipant
            | participantId |
            | 1             |
            | 2             |

    Scenario: when I remove the following participants
        Given I have added the following participants
            """
            [
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"},
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"2", "firstName":"Bob", "lastName":"B"}
            ]
            """
        When I remove the following participants
            """
            [
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"},
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"2", "firstName":"Bob", "lastName":"B"}
            ]
            """
        Then I should not have the following participants
            """
            [
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"1", "firstName":"Alice", "lastName":"A"},
                {"$class":"org.acme.sample.SampleParticipant", "participantId":"2", "firstName":"Bob", "lastName":"B"}
            ]
            """

    Scenario: I should get an error when I try to add a duplicate participant of type (1)
        Given I have added the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        When I add the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        Then I should get an error

    Scenario: I should get an error when I try to update a non-existent participant of type (1)
        When I update the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        Then I should get an error

    Scenario: I should get an error when I try to remove a non-existent participant of type (1)
        When I remove the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        Then I should get an error

    Scenario: I should get an error when I expect an participant of type (1) to have incorrect values
        Given I have added the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        Then I should have the following participants of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | C        |
        And I should get an error matching /AssertionError/

    Scenario: I should get an error when I expect an participant of type (1) not to exist and it does
        Given I have added the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
        Then I should not have the following participants of type org.acme.sample.SampleParticipant
            | participantId |
            | 1             |
        And I should get an error matching /the participant with ID .* exists/
