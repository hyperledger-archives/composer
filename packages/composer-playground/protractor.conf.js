// Protractor conf file
var os = require('os');
var SpecReporter = require('jasmine-spec-reporter').SpecReporter;

exports.config = {
  allScriptsTimeout: 20000,
  framework: 'jasmine',
  directConnect: true,
  baseUrl: 'http://127.0.0.1:3001',
  specs: ['./e2e/specs/welcome.spec.ts',
          './e2e/specs/login-define.spec.ts'],
  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
        prefs: {
            download: {
                'prompt_for_download': false,
                'directory_upgrade': true,
                'default_directory': './e2e/downloads'
            }
        }
    }
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
    browser.manage().window().setSize(1280, 1024);
 }
}

