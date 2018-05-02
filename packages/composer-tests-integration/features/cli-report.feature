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

@cli @cli-report
Feature: CLI report steps

    Background:
        Given I have admin business cards available

    Scenario: Using the CLI, I should get an error if I try and provide any command line arguments
    When I run the following expected fail CLI command
        """
        composer report -idonotknowwhatiamdoing
        """
    Then The stderr information should include text matching /Unknown arguments/

    Scenario: Using the CLI, I can run a composer report command to create a file about the current environment
        When I run the following expected pass CLI command
            """
            composer report
            """
        Then The stdout information should include text matching /Creating Composer report/
        Then The stdout information should include text matching /Collecting diagnostic data.../
        Then The stdout information should include text matching /Created archive file: composer-report-/
        Then The stdout information should include text matching /Command succeeded/
        Then A new file matching this regex should be created /composer-report-/
