// Protractor conf file
exports.config = {
  allScriptsTimeout: 11000,
  framework: 'jasmine',
  directConnect: true,
  chromeDriver: '../drivers/chromedriver_2.29',
  baseUrl: 'http://localhost:3000',
  specs: ['../**/*.*spec.ts'],
  capabilities: {
    'browserName': 'chrome'
  },
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 60000
  },
  beforeLaunch: function() {
    require('ts-node').register({
      project: '../tsconfig.json'
    });
  }
}
