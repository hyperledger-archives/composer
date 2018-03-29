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

Feature: Transaction steps

    Background:
        Given I have deployed the business network archive basic-sample-network.bna
        And I have added the following participants of type org.acme.sample.SampleParticipant
            | participantId | firstName | lastName |
            | 1             | Alice     | A        |
            | 2             | Bob       | B        |
        And I have added the following assets of type org.acme.sample.SampleAsset
            | assetId | owner | value |
            | 1       | 1     | 10    |
            | 2       | 2     | 10    |

    Scenario: when I submit the following transaction of type (1)
        When I submit the following transaction of type org.acme.sample.SampleTransaction
            | asset  | newValue |
            | 1      | 100      |
        Then I should have the following asset of type org.acme.sample.SampleAsset
            | assetId | owner | value |
            | 1       | 1     | 100   |

    Scenario: when I submit the following transaction
        When I submit the following transaction
            """
            {"$class":"org.acme.sample.SampleTransaction", "asset":"1", "newValue":"100"}
            """
        Then I should have the following asset of type org.acme.sample.SampleAsset
            | assetId | owner | value |
            | 1       | 1     | 100   |

    Scenario: when I submit the following transactions of type (1)
        When I submit the following transactions of type org.acme.sample.SampleTransaction
            | asset  | newValue |
            | 1      | 100      |
            | 2      | 200      |
        Then I should have the following assets of type org.acme.sample.SampleAsset
            | assetId | owner | value |
            | 1       | 1     | 100   |
            | 2       | 2     | 200   |

    Scenario: when I submit the following transactions
        When I submit the following transactions
            """
            [
                {"$class":"org.acme.sample.SampleTransaction", "asset":"1", "newValue":"100"},
                {"$class":"org.acme.sample.SampleTransaction", "asset":"2", "newValue":"200"}
            ]
            """
        Then I should have the following assets of type org.acme.sample.SampleAsset
            | assetId | owner | value |
            | 1       | 1     | 100   |
            | 2       | 2     | 200   |

    Scenario: I should get an error when I try to submit an invalid transaction of type (1)
        When I submit the following transaction of type org.acme.sample.SampleTransaction
            | asset  | newValue |
            | 3      | 100      |
        Then I should get an error
