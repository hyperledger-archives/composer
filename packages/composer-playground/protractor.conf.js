// Protractor conf file
var os = require('os');
var SpecReporter = require('jasmine-spec-reporter').SpecReporter;

exports.config = {
  allScriptsTimeout: 11000,
  framework: 'jasmine',
  directConnect: true,
  baseUrl: 'http://127.0.0.1:3001',
  specs: ['./e2e/**/*.*spec.ts'],
  capabilities: {
    'browserName': 'chrome'
  },
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 60000
  },
  beforeLaunch: function() {
    require('ts-node').register({
      project: './tsconfig.json'
    });
  },
  onPrepare: function(){
    jasmine.getEnv().addReporter(new SpecReporter({displayStacktrace: 'all'}));
 }
}

