'use strict';
let path = require('path');
let assert = require('yeoman-assert');
let helpers = require('yeoman-test');

describe('fabric-composer:angular for digitalPropertyNetwork running against a deployed business network', function () {

    let tmpDir; // This is the directory which we will create our app into
    before(function() {
        return helpers.run(path.join(__dirname, '../generators/angular'))
        .inTmpDir(function (dir) {
            tmpDir = dir;
        })
        .withPrompts({
            liveNetwork: true,
            appName: 'digitalPropertyNetwork',
            appDescription: 'A digitalPropertyNetwork application',
            authorName: 'TestUser',
            authorEmail: 'TestUser@TestApp.com',
            networkIdentifier: 'digitalproperty-network',
            connectionProfileName: 'defaultProfile',
            enrollmentId: 'WebAppAdmin',
            enrollmentSecret: 'DJY27pEnl16d'
        })
        .on('error', function (error) {
            console.log('Error found:', error);
        })
        .on('ready', function (generator) {
            console.log('About to start generating files..');
            console.log('Creating temporary directory:',tmpDir);

        })
        .on('end', function(){
            console.log('Finished generating files');
        });

    });

    it('creates typescript classes', function(){
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/net.biz.digitalPropertyNetwork.ts');
    });

    it('creates LandTitle component typescript', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.ts');
    });

    it('creates LandTitle component test', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.spec.ts');
    });

    it('creates LandTitle service', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.service.ts');
    });

    it('creates LandTitle component html', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.html');
    });

    it('creates LandTitle component css', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.css');
    });

    it('creates SalesAgreement component typescript', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.ts');
    });

    it('creates SalesAgreement component test', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.spec.ts');
    });

    it('creates SalesAgreement service', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.service.ts');
    });

    it('creates SalesAgreement component html', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.html');
    });

    it('creates SalesAgreement component css', function () {
        assert.file(tmpDir+'/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.css');
    });

});
