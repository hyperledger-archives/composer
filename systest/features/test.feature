Feature: Example feature

  Scenario: Trying it out
    Given I have an empty asset registry
    When I add the following asset to the asset registry:
      | uri | data |
      | http://some/asset | Some asset |
    Then the asset registry contains the following assets:
      | uri | data |
      | http://some/asset | Some asset |
