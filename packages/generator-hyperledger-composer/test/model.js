/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
let common = require('composer-common');
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

describe('hyperledger-composer:model for generating a template business network model file', function () {

    let tmpDir;
    const passedBusNetName = 'my-template-busnet';
    const passedBusNetDescription = 'My busnet description';
    const passedNS = 'test.template.namespace';
    const passedAuthor = 'MrConga';
    const passedEmail = 'conga@congazone.org';
    const passedLic = 'For exclusive conga';

    // Run the business network generator
    before(function() {
        return helpers.run(path.join(__dirname, '../generators/model'))
        .inTmpDir(function (dir) {
            tmpDir = dir;
        })
        .withPrompts({
            appname: passedBusNetName,
            appdescription: passedBusNetDescription,
            appauthor: passedAuthor,
            appemail: passedEmail,
            applicense: passedLic,
            ns: passedNS,
        })
        .on('error', function (error) {
            assert.fail('Error found:', error);
        });
    });

    it('should create all required business network files within a directory that is the passed business network name', () => {
        let busNetDir = tmpDir + '/' + passedBusNetName;
        let myExpectedFiles = [
            busNetDir + '/README.md',
            busNetDir + '/package.json',
            busNetDir + '/models/' + passedNS +'.cto'
        ];
        assert.file(myExpectedFiles);
    });

    it('should only create required business network files', () => {
        let dirFiles = getFiles(tmpDir);

        let busNetDir = tmpDir + '/' + passedBusNetName;
        let myExpectedFiles = [
            busNetDir + '/README.md',
            busNetDir + '/package.json',
            busNetDir + '/models/' + passedNS +'.cto'
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
        assert(myPackage.name === passedBusNetName, 'incorrect name in package file');
        assert(myPackage.author === passedAuthor, 'incorrect author in package file');
        assert(myPackage.email === passedEmail, 'incorrect email in package file');
        assert(myPackage.license === passedLic, 'incorrect license in package file');
        assert.strictEqual(myPackage.dependencies, undefined, 'there should be no production dependencies in package file');
        assert.strictEqual(myPackage.devDependencies, undefined, 'incorrect development dependencies in package file');
    });

    it('should create a valid model file that contains mapped input', () => {
        let modelFilePath = tmpDir + '/' + passedBusNetName + '/models/' + passedNS +'.cto';
        let definitions = '/**\n * Write your model definitions here\n */\n\nnamespace test.template.namespace\n\nparticipant User identified by email {\n  o String email\n}\n\nasset SampleAsset identified by assetId {\n  o String assetId\n  o String value\n}\n\ntransaction ChangeAssetValue {\n  o String newValue\n  --> Asset relatedAsset\n}\n';
        assert(fs.existsSync(modelFilePath), 'No model file detected in test run');

        let manager = new common.ModelManager();
        let model = fs.readFileSync(modelFilePath,'utf8');
        // add to model manager, which will throw if invalid
        manager.addModelFile(model, passedNS, false);

        let modelFile = manager.getModelFile(passedNS);

        // Check resulting model file
        // -namespace
        assert.equal(modelFile.getNamespace(), passedNS);
        assert.equal(modelFile.getDefinitions(), definitions);

        // -assets, number and FQN
        let assets = modelFile.getAssetDeclarations();
        assert.equal(assets.length, 1);
        assert.equal(assets[0].getFullyQualifiedName(), 'test.template.namespace.SampleAsset');

        // -participants, number and FQN
        let participants = modelFile.getParticipantDeclarations();
        assert.equal(participants.length, 1);
        assert.equal(participants[0].getFullyQualifiedName(), 'test.template.namespace.User');
    });

});
