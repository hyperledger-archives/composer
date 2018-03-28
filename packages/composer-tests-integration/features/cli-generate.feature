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

@cli @cli-generate
Feature: Cli generate steps

    Scenario: Using the CLI, I can issue the command to generate doc for my networks
        Given I have the following folders
            | ../resources/sample-networks/carauction-network |
        And I run the following expected pass CLI command
            """
            composer archive create -t dir -a ./tmp/carauction.bna -n ./resources/sample-networks/carauction-network
            """
        When I run the following expected pass CLI command
            """
            composer generator docs -a ./tmp/carauction.bna
            """
        Then The stdout information should include text matching /Command succeeded/