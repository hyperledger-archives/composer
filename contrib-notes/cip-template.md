# Composer Improvement Proposal

All CIPs should follow the specified template below. It is used to help cover all aspects behind the reasoning for the CIP, and bring in considerations that might otherwise have been neglected. Most of all we want all CIPs to be absolutey transaparent, so that the community can see the justification behind all CIPs that are delivered.

## CIP Template
```
Abstract
  - Overview of the CIP

Motivation
  - Why is this CIP required?

Specification
  - What changes are to be made?

Rationale
  - Reasoning behind the specification

Backwards Compatibility
  - Are any functions going to be deprecated?
  - Will the CIP require a version bump?

Test Requirements
  - Please see test requirements below

Implementation
  - How is the CIP to be implemented?

Copyright
    This document is licensed under the Creative Commons Attribution 4.0 International Public License.

```

Test requirements vary depending on what is being planned; the below template includes items that should be taken into consideration when test planning for a CIP.

## Test Considerations Template
```
Readiness Criteria
  - New hardware/infrastructure requirements?
  - New test framework requirements? It is generally expected that CIP testing would involve extending existing test suites, but it is possible to introduce a requirment for a new framework to run specific tests. This needs to be identified as it can take a long time to get the framework in place.
  - Mitigation of above to enable progress

User Acceptance Criteria
  - What are we considering to be the user acceptance criteria?
  - Is a new tutorial in place/required?
  - Are there any documentation requirements?
  - Is the API doc completed?
  - How is the error conditioning?

Test Deliverables
  - Features under test
  - Unit test requirements (This is more a statement of fact that we know all new code must be covered by unit tests, and that there will be 100% coverage ... with meaningful tests)
  - Functional test requirements
    -- Can you extend the extend existing frameworks? (ie, the cucumber steps etc)
    -- What user scenarios are to be covered?
  - Integration test requirements
    -- Can the deliverable be included within an integration test?
    -- What integration scenarios are to be considered?
    -- Are we considering golden path only, or also error paths?
  - Performance test requirements
    -- Should we be adding a performance test for the deliverable?
    -- Are there expected performance improvements from the delivery of the CIP?
  - Manual test requirements (shame on you! It is highly unlikely that any contributions that require manual testing will be accepted)
  - Test considerations
    -- Platform coverage: Are there any considerations such as specific OS requirements for the tests to be run on?
    -- Browser coverage
 
Assumptions
  - Have any assumptions been made in the above? 
  - What risks do these assumptions reveal?

Exit Criteria
 - All tests delivered and passing (that's a given!)
 - Code coverage acceptable (100% is acceptable)
 - Zero P1/P2 issues
 - No manual tests

```

## License <a name="license"></a>
Hyperledger Project source code files are made available under the Apache License, Version 2.0 (Apache-2.0), located in the LICENSE file. Hyperledger Project documentation files are made available under the Creative Commons Attribution 4.0 International License (CC-BY-4.0), available at http://creativecommons.org/licenses/by/4.0/.