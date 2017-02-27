'use strict';
let path = require('path');
let assert = require('yeoman-assert');
let helpers = require('yeoman-test');
let shell = require('shelljs');
var fs = require('fs-extra');

describe('fabric-composer:angular', function () {
    let tmpDir;


    before(function() {
        return helpers.run(path.join(__dirname, '../generators/angular'))
        .inTmpDir(function (dir) {
            tmpDir = dir;
        })
        .withPrompts({
            liveNetwork: false,
            appName: "test-app",
            appDescription: "A test application",
            authorName: "TestUser",
            authorEmail: "TestUser@TestApp.com",
            fileName: __dirname+"/data/digitalPropertyNetwork.bna"
        })
        .on('error', function (error) {
            console.log('Error found:', error);
        })
        .on('ready', function (generator) {
            console.log('About to start generating files..')
            console.log('Creating temporary directory:',tmpDir)
            // This is called right before `generator.run()` is called
        })
        .on('end', function(done){

            console.log('Generated app, about to run tests.');
        });
    // runs before all tests in this block
    });

    it('creates LandTitle component typescript', function () {
        assert.file(tmpDir+"/test-app/src/app/SalesAgreement/SalesAgreement.component.ts");
    });

    it('creates LandTitle component test', function () {
        assert.file(tmpDir+"/test-app/src/app/SalesAgreement/SalesAgreement.component.spec.ts");
    });

    it('creates LandTitle component html', function () {
        assert.file(tmpDir+"/test-app/src/app/SalesAgreement/SalesAgreement.component.html");
    });

    it('creates LandTitle component css', function () {
        assert.file(tmpDir+"/test-app/src/app/SalesAgreement/SalesAgreement.component.css");
    });

    it('creates SalesAgreement component typescript', function () {
        assert.file(tmpDir+"/test-app/src/app/SalesAgreement/SalesAgreement.component.ts");
    });

    it('creates SalesAgreement component test', function () {
        assert.file(tmpDir+"/test-app/src/app/SalesAgreement/SalesAgreement.component.spec.ts");
    });

    it('creates SalesAgreement component html', function () {
        assert.file(tmpDir+"/test-app/src/app/SalesAgreement/SalesAgreement.component.html");
    });

    it('creates SalesAgreement component css', function () {
        assert.file(tmpDir+"/test-app/src/app/SalesAgreement/SalesAgreement.component.css");
    });

});


