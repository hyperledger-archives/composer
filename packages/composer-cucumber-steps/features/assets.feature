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

Feature: Asset steps

    Background:
        Given I have deployed the business network archive basic-sample-network.bna

    Scenario: given I have added the following asset of type (1)
        Given I have added the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
        Then I should have the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |

    Scenario: given I have added the following asset
        Given I have added the following asset
            """
            {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"}
            """
        Then I should have the following asset
            """
            {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"}
            """

    Scenario: given I have added the following assets of type (1)
        Given I have added the following assets of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
            | 2       | bob@email.com   | 20    |
        Then I should have the following assets of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
            | 2       | bob@email.com   | 20    |

    Scenario: given I have added the following assets
        Given I have added the following assets
            """
            [
                {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"},
                {"$class":"org.acme.sample.SampleAsset", "assetId":"2", "owner":"bob@email.com", "value":"20"}
            ]
            """
        Then I should have the following assets
            """
            [
                {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"},
                {"$class":"org.acme.sample.SampleAsset", "assetId":"2", "owner":"bob@email.com", "value":"20"}
            ]
            """

    Scenario: when I add the following asset of type (1)
        When I add the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
        Then I should have the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |

    Scenario: when I add the following asset
        When I add the following asset
            """
            {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"}
            """
        Then I should have the following asset
            """
            {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"}
            """

    Scenario: when I add the following assets of type (1)
        When I add the following assets of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
            | 2       | bob@email.com   | 20    |
        Then I should have the following assets of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
            | 2       | bob@email.com   | 20    |

    Scenario: when I add the following assets
        When I add the following assets
            """
            [
                {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"},
                {"$class":"org.acme.sample.SampleAsset", "assetId":"2", "owner":"bob@email.com", "value":"20"}
            ]
            """
        Then I should have the following assets
            """
            [
                {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"},
                {"$class":"org.acme.sample.SampleAsset", "assetId":"2", "owner":"bob@email.com", "value":"20"}
            ]
            """

    Scenario: when I update the following asset of type (1)
        Given I have added the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
        When I update the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 20    |
        Then I should have the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 20    |

    Scenario: when I update the following asset
        Given I have added the following asset
            """
            {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"}
            """
        When I update the following asset
            """
            {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"20"}
            """
        Then I should have the following asset
            """
            {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"20"}
            """

    Scenario: when I update the following assets of type (1)
        Given I have added the following assets of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
            | 2       | bob@email.com   | 20    |
        When I update the following assets of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 99    |
            | 2       | bob@email.com   | 88    |
        Then I should have the following assets of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 99    |
            | 2       | bob@email.com   | 88    |

    Scenario: when I update the following assets
        Given I have added the following assets
            """
            [
                {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"},
                {"$class":"org.acme.sample.SampleAsset", "assetId":"2", "owner":"bob@email.com", "value":"20"}
            ]
            """
        When I update the following assets
            """
            [
                {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"99"},
                {"$class":"org.acme.sample.SampleAsset", "assetId":"2", "owner":"bob@email.com", "value":"88"}
            ]
            """
        Then I should have the following assets
            """
            [
                {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"99"},
                {"$class":"org.acme.sample.SampleAsset", "assetId":"2", "owner":"bob@email.com", "value":"88"}
            ]
            """

    Scenario: when I remove the following asset of type (1)
        Given I have added the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
        When I remove the following asset of type org.acme.sample.SampleAsset
            | assetId |
            | 1       |
        Then I should not have the following asset of type org.acme.sample.SampleAsset
            | assetId |
            | 1       |

    Scenario: when I remove the following asset
        Given I have added the following asset
            """
            {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"}
            """
        When I remove the following asset
            """
            {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"}
            """
        Then I should not have the following asset
            """
            {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"}
            """

    Scenario: when I remove the following assets of type (1)
        Given I have added the following assets of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
            | 2       | bob@email.com   | 20    |
        When I remove the following assets of type org.acme.sample.SampleAsset
            | assetId |
            | 1       |
            | 2       |
        Then I should not have the following assets of type org.acme.sample.SampleAsset
            | assetId |
            | 1       |
            | 2       |

    Scenario: when I remove the following assets
        Given I have added the following assets
            """
            [
                {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"},
                {"$class":"org.acme.sample.SampleAsset", "assetId":"2", "owner":"bob@email.com", "value":"20"}
            ]
            """
        When I remove the following assets
            """
            [
                {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"},
                {"$class":"org.acme.sample.SampleAsset", "assetId":"2", "owner":"bob@email.com", "value":"20"}
            ]
            """
        Then I should not have the following assets
            """
            [
                {"$class":"org.acme.sample.SampleAsset", "assetId":"1", "owner":"alice@email.com", "value":"10"},
                {"$class":"org.acme.sample.SampleAsset", "assetId":"2", "owner":"bob@email.com", "value":"20"}
            ]
            """

    Scenario: I should get an error when I try to add a duplicate asset of type (1)
        Given I have added the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
        When I add the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
        Then I should get an error

    Scenario: I should get an error when I try to update a non-existent asset of type (1)
        When I update the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
        Then I should get an error

    Scenario: I should get an error when I try to remove a non-existent asset of type (1)
        When I remove the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
        Then I should get an error

    Scenario: I should get an error when I expect an asset of type (1) to have incorrect values
        Given I have added the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
        Then I should have the following assets of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 99    |
        And I should get an error matching /AssertionError/

    Scenario: I should get an error when I expect an asset of type (1) not to exist and it does
        Given I have added the following asset of type org.acme.sample.SampleAsset
            | assetId | owner           | value |
            | 1       | alice@email.com | 10    |
        Then I should not have the following assets of type org.acme.sample.SampleAsset
            | assetId |
            | 1       |
        And I should get an error matching /the asset with ID .* exists/

    Scenario: I should handle all primitive types in tables for assets
        When I add the following asset of type org.acme.sample.SampleComplexAsset
            | assetId | booleanField | dateTimeField        | doubleField | integerField | longField |
            | abc     | true         | 1970-01-01T00:00:00Z | 3.14159     | 13           | 999999999 |
        Then I should have the following assets of type org.acme.sample.SampleComplexAsset
            | assetId | booleanField | dateTimeField        | doubleField | integerField | longField |
            | abc     | true         | 1970-01-01T00:00:00Z | 3.14159     | 13           | 999999999 |

    Scenario: I should get an error for non-primitive types in a table
        When I add the following asset of type org.acme.sample.SampleComplexAsset
            | assetId | booleanField | dateTimeField        | doubleField | integerField | longField | arrayField |
            | abc     | true         | 1970-01-01T00:00:00Z | 3.14159     | 13           | 999999999 | banana     |
        Then I should get an error matching /arrayField/
