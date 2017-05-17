# Coding Guidelines

## Coding Style

### Good Coding Practices Using ESLint

Hyperledger Composer uses a utility to ensure the codebase conforms to good language practice. Hyperledger Composer is written in both `node.js` and `golang`, with [ESLint](http://eslint.org/) being used for `node.js`.

The Hyperledger Composer project includes a set of lint definitions in its initialization file ``.eslintrc.yml`` that will be used whenever lint is run, so you should use the one in the project, as it contains the default configurations.

### API Documentation Using JSDoc

Hyperledger Composer automatically generates its API documentation from the source code with appropriate annotations using [JSDoc](https://en.wikipedia.org/wiki/JSDoc). It helps keep the API documentation up-to-date and accurate. PLEASE note the comment at the top regarding the naming of the directory path that contains the git repository. JSDoc filename filters apply to the absolute and not relative path. In summary, don't start any directory with _

If you change APIs, update the documentation. Note that the linter settings will enforce the use of JSDoc comments for all methods and classes. We use these comments to generate high-quality documentation and UML diagrams from source code. Please ensure your code (particularly public APIs) are clearly documented.

## Testing

All changes pushed to Hyperledger Composer must include unit tests that ensure that the new functionality works as designed, or that fixed bugs stay fixed. Pull requests that add code changes without associated automated unit tests will **not** be accepted. Unit tests should aim for 100% code coverage and may be run locally with `npm test`. 

Our current test suites make use of:

 - [Mocha](https://mochajs.org/)
 - [Chai](http://chaijs.com/)
 - [Karma](https://karma-runner.github.io/1.0/index.html)
 - [Jasmine](https://jasmine.github.io/)
 - [Istanbul](https://gotwarlost.github.io/istanbul/) 

### Unit Test Framework Using Mocha

Hyperledger Composer requires that all code added to the project is provided with unit tests. These tests operate inside a test framework called [mocha](https://mochajs.org/) which controls their execution. Mocha is triggered every time code is pushed to either a user's repository or the Hyperledger Composer repository.

### Unit Test Framework using Karma and Jasmine
The default configuration is set to target the Chrome browser, and this is the target browser during the build process. Unit tests should rigorously test controller files and where appropriate inspect the view to ensure that mapped logic is operating as expected.

### Simplify writing tests using the chai assertion library, chai-things and sinon

Hyperledger Composer tests use an assertion library called [chai](http://chaijs.com/) to help write these tests, which run in the mocha. Chai allows developers to easily write tests that verify the behaviour of their code using `should`, `expect` and `assert` interfaces. [chai-things](https://www.npmjs.com/package/chai-things) is a chai extension which helps writing units tests involving arrays. Hyperledger Composer sometimes relies on external systems like Hyperledger and to enable the creation of unit tests, Hyperledger Composer [sinon](https://www.npmjs.com/package/sinon) to create realistic units tests which do not draw in huge amounts of infrastructure.  sinon has technology called "test spies", "stubs" and "mocks" which greatly help this process.

### Code Coverage Using Istanbul

The Hyperledger Composer project uses a code coverage tool called [Istanbul](https://gotwarlost.github.io/istanbul/) to ensure that all the code is tested, including statements, branches, and functions. This helps to improve the quality of the Hyperledger Composer tests. The output of Istanbul can be used to see where any specific tests need to be added to ensure complete code coverage.

