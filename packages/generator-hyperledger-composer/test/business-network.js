'use strict';
let path = require('path');
let fs = require('fs');
let assert = require('yeoman-assert');
let helpers = require('yeoman-test');

/**
 * Get all files recursively in a directoy
 * @param {*} dir directory to search
 * @param {*} fileList file list to append
 * @returns {*} list of files in directory
 */
function getFiles(dir, fileList){
    fileList = fileList || [];
    let files = fs.readdirSync(dir);
    for(let i in files){
        if (!files.hasOwnProperty(i)){
            continue;
        }
        let name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, fileList);
        } else {
            fileList.push(name);
        }
    }
    return fileList;
}

describe('hyperledger-composer:businessnetwork for generating a template business network', function () {

    let tmpDir;
    const passedBusNetName = 'my-template-busnet';
    const passedBusNetDescription = 'My busnet description';
    const passedNS = 'test.template.namespace';
    const passedAuthor = 'MrConga';
    const passedEmail = 'conga@congazone.org';
    const passedLic = 'For exclusive conga';

    // Run the business network generator
    before(function() {
        return helpers.run(path.join(__dirname, '../generators/businessnetwork'))
        .inTmpDir(function (dir) {
            tmpDir = dir;
        })
        .withPrompts({
            appname: passedBusNetName,
            appdescription: passedBusNetDescription,
            appauthor: passedAuthor,
            appemail: passedEmail,
            applicense: passedLic,
            namespace: passedNS,
        })
        .on('error', function (error) {
            console.log('Error found:', error);
        })
        .on('ready', function (generator) {
            console.log('About to start generating files..');
            console.log('Creating temporary directory:', tmpDir);

        })
        .on('end', function(){
            console.log('Finished generating files');
        });
    });

    it('should create all required business network files within a directory that is the passed bsuness network name', () => {
        let busNetDir = tmpDir + '/' + passedBusNetName;
        let myExpectedFiles = [
            busNetDir + '/.eslintrc.yml',
            busNetDir + '/README.md',
            busNetDir + '/package.json',
            busNetDir + '/models/' + passedNS +'.cto',
            busNetDir + '/lib/logic.js',
            busNetDir + '/test/logic.js'
        ];
        assert.file(myExpectedFiles);
    });

    it('should only create required business network files', () => {
        let dirFiles = getFiles(tmpDir);

        let busNetDir = tmpDir + '/' + passedBusNetName;
        let myExpectedFiles = [
            busNetDir + '/.eslintrc.yml',
            busNetDir + '/README.md',
            busNetDir + '/package.json',
            busNetDir + '/models/' + passedNS +'.cto',
            busNetDir + '/lib/logic.js',
            busNetDir + '/test/logic.js'
        ];

        let unexpectedFiles =[];
        for (let file of dirFiles){
            if(myExpectedFiles.indexOf(file) === -1){
                unexpectedFiles.push(file);
            }
        }

        if(unexpectedFiles.length > 0){
            assert.fail('Unexpected files generated: ', unexpectedFiles);
        }

    });

    it('should create a README.md file that contains the BusNet name and description as content', () => {
        let busNetDir = tmpDir + '/' + passedBusNetName;
        let readMeContent = '# ' + passedBusNetName + '\n\n' + passedBusNetDescription;
        assert.fileContent(busNetDir + '/README.md', readMeContent);
    });

    it('should create a package.json file that contains mapped input', () => {
        let packageFile = tmpDir + '/' + passedBusNetName + '/package.json';
        assert(fs.existsSync(packageFile), 'No package.json file detected in test run');

        let myPackage = require(packageFile);
        assert(myPackage.name === passedBusNetName, 'incorrect name in packaage file');
        assert(myPackage.author === passedAuthor, 'incorrect author in packaage file');
        assert(myPackage.email === passedEmail, 'incorrect email in packaage file');
        assert(myPackage.license === passedLic, 'incorrect license in packaage file');
    });

});
