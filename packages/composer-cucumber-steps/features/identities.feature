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
        Given I have deployed the business network archive basic-sample-network.bna
        And I have added the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
            | 2             | Bob       | B        |
        And I have added the following asset of type org.acme.sample.SampleAsset
            | assetId | owner | value |
            | 1       | 1     | 10    |
            | 2       | 2     | 10    |

    Scenario: given I have issued the participant (1) with the identity (2)
        Given I have issued the participant org.acme.sample.SampleParticipant#1 with the identity alice1
        Then I should have the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |

    Scenario: when I issue the participant (1) with the identity (2)
        When I issue the participant org.acme.sample.SampleParticipant#1 with the identity alice1
        Then I should have the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |

    Scenario: when I use the identity (1)
        Given I have issued the participant org.acme.sample.SampleParticipant#1 with the identity alice1
        When I use the identity alice1
        Then I should have the following participant of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |

    Scenario: should fail when I try to use a non-existent identity
        When I use the identity alice15
        Then I should get an error matching /.*has not been registered.*/

    Scenario: should fail when I issue to a duplicate identity
        Given I have issued the participant org.acme.sample.SampleParticipant#1 with the identity alice1
        When I issue the participant org.acme.sample.SampleParticipant#1 with the identity alice1
        Then I should get an error

    Scenario: should not fail when the identity has the correct permissions
        Given I have issued the participant org.acme.sample.SampleParticipant#1 with the identity alice1
        When I use the identity alice1
        And I submit the following transaction of type org.acme.sample.SampleTransaction
            | asset  | newValue |
            | 1      | 100      |
        Then I should have the following asset of type org.acme.sample.SampleAsset
            | assetId | owner | value |
            | 1       | 1     | 100   |

    Scenario: should fail when the identity does not have the correct permissions
        Given I have issued the participant org.acme.sample.SampleParticipant#2 with the identity bob1
        When I use the identity bob1
        And I submit the following transaction of type org.acme.sample.SampleTransaction
            | asset  | newValue |
            | 1      | 100      |
        Then I should get an error matching /does not have .* access/
