@cli-report
Feature: Cli steps

    Background:
        Given I have admin business cards available

    Scenario: Using the CLI, I can run a composer report command to create a file about the current environment
        When I run the following CLI command
            """
            composer report
            """
        Then The stdout information should include text matching /Creating Composer report/
        Then The stdout information should include text matching /Collecting diagnostic data.../
        Then The stdout information should include text matching /Created archive file: composer-report-/
        Then The stdout information should include text matching /Command succeeded/
        Then A new file matching this regex should be created /composer-report-/
