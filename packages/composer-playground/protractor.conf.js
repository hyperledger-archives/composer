// Protractor conf file
exports.config = {
  allScriptsTimeout: 11000,
  framework: 'jasmine',
  directConnect: true,
  chromeDriver: './e2e/drivers/chromedriver_2.29',
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
  }
}
