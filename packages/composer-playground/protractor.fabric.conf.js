// Protractor conf file
'use strict';

let SpecReporter = require('jasmine-spec-reporter').SpecReporter;

exports.config = {
    allScriptsTimeout: 20000,
    framework: 'jasmine',
    directConnect: true,
    baseUrl: 'http://127.0.0.1:3002',
    specs: ['./e2e/specs/round-trip.spec.ts',
        './e2e/specs/playground-tutorial.spec.ts',
        './e2e/specs/identity.spec.ts'],
    capabilities: {
        'browserName': 'chrome',
        'chromeOptions': {
            prefs: {
                download: {
                    'prompt_for_download': false,
                    'directory_upgrade': true,
                    'default_directory': './e2e/downloads' //matches that specified in /utils/constants.ts file
                }
            }
        }
    },
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 60000
    },
    params: {
        profile: 'hlfv1'
    },
    beforeLaunch: function() {
        require('ts-node').register({
            project: './tsconfig.json'
        });
    },
    onPrepare: function() {
        /* eslint-disable no-undef */
        jasmine.getEnv().addReporter(new SpecReporter({
            displayStacktrace: 'all'
        }));
        browser.manage().window().setSize(1280, 1024);
        /* eslint-enable no-undef */
    }
};
