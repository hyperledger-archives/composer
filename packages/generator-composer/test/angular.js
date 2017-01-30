'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');

describe('generator-concerto:angular', function () {
  before(function () {
    return helpers.run(path.join(__dirname, '../generators/angular'))
      .withPrompts({someAnswer: true})
      .toPromise();
  });

  it('creates files', function () {
    assert.file([
      'dummyfile.txt'
    ]);
  });
});
