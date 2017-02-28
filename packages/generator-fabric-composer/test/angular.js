'use strict';
let path = require('path');
let assert = require('yeoman-assert');
let helpers = require('yeoman-test');
var fs = require('fs-extra');

describe('fabric-composer:angular for digitalPropertyNetwork', function () {

    let tmpDir; // This is the directory which we will create our app into
    console.log("What is this",path.join(__dirname, '../generators/angular'));
    before(function() {
        return helpers.run(path.join(__dirname, '../generators/angular'))
        .inTmpDir(function (dir) {
            tmpDir = dir;
        })
        .withPrompts({
            liveNetwork: false,
            appName: "digitalPropertyNetwork",
            appDescription: "A digitalPropertyNetwork    application",
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
        .on('end', function(){
            console.log('finished');
        });
    // runs before all tests in this block
    });

    it('creates LandTitle component typescript', function () {
        assert.file(tmpDir+"/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.ts");
    });

    it('creates LandTitle component test', function () {
        assert.file(tmpDir+"/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.spec.ts");
    });

    it('creates LandTitle service', function () {
        assert.file(tmpDir+"/digitalPropertyNetwork/src/app/LandTitle/LandTitle.service.ts");
    });

    it('creates LandTitle component html', function () {
        assert.file(tmpDir+"/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.html");
    });

    it('creates LandTitle component css', function () {
        assert.file(tmpDir+"/digitalPropertyNetwork/src/app/LandTitle/LandTitle.component.css");
    });

    it('creates SalesAgreement component typescript', function () {
        assert.file(tmpDir+"/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.ts");
    });

    it('creates SalesAgreement component test', function () {
        assert.file(tmpDir+"/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.spec.ts");
    });

    it('creates SalesAgreement service', function () {
        assert.file(tmpDir+"/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.service.ts");
    });

    it('creates SalesAgreement component html', function () {
        assert.file(tmpDir+"/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.html");
    });

    it('creates SalesAgreement component css', function () {
        assert.file(tmpDir+"/digitalPropertyNetwork/src/app/SalesAgreement/SalesAgreement.component.css");
    });

});


describe('fabric-composer:angular for CarAuction-Network', function () {

    let newDir; // This is the directory which we will create our app into

    before(function() {
        return helpers.run(path.join(__dirname, '../generators/angular'))
        .inTmpDir(function (dir) {
            newDir = dir;
        })
        .withPrompts({
            liveNetwork: false,
            appName: "CarAuction-Network",
            appDescription: "A CarAuction-Network application",
            authorName: "TestUser",
            authorEmail: "TestUser@TestApp.com",
            fileName: __dirname+"/data/org.acme.vehicle.auction@0.0.2.bna"
        })
        .on('error', function (error) {
            console.log('Error found:', error);
        })
        .on('ready', function (generator) {
            console.log('About to start generating files..')
            console.log('Creating temporary directory:',newDir)
            // This is called right before `generator.run()` is called
        }).on('end', function(){
            console.log('Finished!');
        });
    // runs before all tests in this block
    });

    it('creates VehicleListing component typescript', function () {
        assert.file(newDir+"/CarAuction-Network/src/app/VehicleListing/VehicleListing.component.ts");
    });

    it('creates VehicleListing component test', function () {
        assert.file(newDir+"/CarAuction-Network/src/app/VehicleListing/VehicleListing.component.spec.ts");
    });

    it('creates VehicleListing service', function () {
        assert.file(newDir+"/CarAuction-Network/src/app/VehicleListing/VehicleListing.service.ts");
    });

    it('creates VehicleListing component html', function () {
        assert.file(newDir+"/CarAuction-Network/src/app/VehicleListing/VehicleListing.component.html");
    });

    it('creates VehicleListing component css', function () {
        assert.file(newDir+"/CarAuction-Network/src/app/VehicleListing/VehicleListing.component.css");
    });

    it('creates Vehicle component typescript', function () {
        assert.file(newDir+"/CarAuction-Network/src/app/Vehicle/Vehicle.component.ts");
    });

    it('creates Vehicle component test', function () {
        assert.file(newDir+"/CarAuction-Network/src/app/Vehicle/Vehicle.component.spec.ts");
    });

    it('creates Vehicle service', function () {
        assert.file(newDir+"/CarAuction-Network/src/app/Vehicle/Vehicle.service.ts");
    });

    it('creates Vehicle component html', function () {
        assert.file(newDir+"/CarAuction-Network/src/app/Vehicle/Vehicle.component.html");
    });

    it('creates Vehicle component css', function () {
        assert.file(newDir+"/CarAuction-Network/src/app/Vehicle/Vehicle.component.css");
    });

});



