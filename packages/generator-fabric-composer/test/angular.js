'use strict';
let path = require('path');
let assert = require('yeoman-assert');
let helpers = require('yeoman-test');
let shell = require('shelljs');
var fs = require('fs-extra');

describe('fabric-composer:angular', function () {

  it('creates files', function () {
      return helpers.run(path.join(__dirname, '../generators/angular'))
      .withPrompts({
          liveNetwork: false,
          appName: "test-app",
          appDescription: "A test application",
          authorName: "TestUser",
          authorEmail: "TestUser@TestApp.com",
          fileName: __dirname+"/data/digitalPropertyNetwork.bna"
        })
        .inTmpDir(function (dir) {
            // `dir` is the path to the new temporary directory
            fs.copySync(path.join(__dirname, '../generators/angular/templates'), dir)
        })
        .on('error', function (error) {
            console.log('Oh Noes!', error);
        })
        .on('ready', function (generator) {
            console.log('about to pwd')
            console.log(shell.pwd());
            console.log('done')
            assert.file('test-app/src/app/LandTitle/LandTitle.component.ts');
            // This is called right before `generator.run()` is called
        })
        .on('end', function(done){
            done();
        });



  });
});
