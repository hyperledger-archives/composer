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

const assert = require('yeoman-assert');
const fs = require('fs');
const helpers = require('yeoman-test');
const path = require('path');
const version = require('../package.json').version;

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

describe('hyperledger-composer:businessnetwork', function () {

    const passedBusNetName = 'my-template-busnet';
    const passedBusNetDescription = 'My busnet description';
    const passedNS = 'test.template.namespace';
    const passedAuthor = 'MrConga';
    const passedEmail = 'conga@congazone.org';
    const passedLic = 'For exclusive conga';

    describe('hyperledger-composer:businessnetwork for generating a populated template business network', function () {
        let tmpDir;
        let empty = 'No';

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
                ns: passedNS,
                empty: empty
            })
            .on('error', function (error) {
                assert.fail('Error found:', error);
            });
        });

        it('should create all required business network files within a directory that is the passed business network name', () => {
            let busNetDir = tmpDir + '/' + passedBusNetName;
            let myExpectedFiles = [
                busNetDir + '/.eslintrc.yml',
                busNetDir + '/README.md',
                busNetDir + '/package.json',
                busNetDir + '/permissions.acl',
                busNetDir + '/models/' + passedNS +'.cto',
                busNetDir + '/lib/logic.js',
                busNetDir + '/test/logic.js',
                busNetDir + '/features/sample.feature',
                busNetDir + '/features/support/index.js'
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
                busNetDir + '/permissions.acl',
                busNetDir + '/models/' + passedNS +'.cto',
                busNetDir + '/lib/logic.js',
                busNetDir + '/test/logic.js',
                busNetDir + '/features/sample.feature',
                busNetDir + '/features/support/index.js'
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
            assert.strictEqual(myPackage.name, passedBusNetName, 'incorrect name in package file');
            assert.strictEqual(myPackage.author, passedAuthor, 'incorrect author in package file');
            assert.strictEqual(myPackage.email, passedEmail, 'incorrect email in package file');
            assert.strictEqual(myPackage.license, passedLic, 'incorrect license in package file');
            assert.strictEqual(myPackage.dependencies, undefined, 'there should be no production dependencies in package file');
            assert.objectContent(myPackage.devDependencies, {
                'composer-admin': `^${version}`,
                'composer-cli': `^${version}`,
                'composer-client': `^${version}`,
                'composer-common': `^${version}`,
                'composer-connector-embedded': `^${version}`,
                'composer-cucumber-steps': `^${version}`,
            });
            assert.objectContent(myPackage.engines, { composer: `^${version}`});
        });
    });

    describe('hyperledger-composer:businessnetwork for generating an empty template business network', function () {
        let tmpDir;
        let empty = 'Yes';

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
                ns: passedNS,
                empty: empty
            })
            .on('error', function (error) {
                assert.fail('Error found:', error);
            });
        });

        it('should create all required business network files within a directory that is the passed business network name', () => {
            let busNetDir = tmpDir + '/' + passedBusNetName;
            let myExpectedFiles = [
                busNetDir + '/.eslintrc.yml',
                busNetDir + '/README.md',
                busNetDir + '/package.json',
                busNetDir + '/permissions.acl',
                busNetDir + '/models/' + passedNS +'.cto'
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
                busNetDir + '/permissions.acl',
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
            assert.deepStrictEqual(myPackage.devDependencies, {
                chai: 'latest',
                'chai-as-promised': 'latest',
                'composer-admin': `^${version}`,
                'composer-cli': `^${version}`,
                'composer-client': `^${version}`,
                'composer-common': `^${version}`,
                'composer-connector-embedded': `^${version}`,
                'composer-cucumber-steps': `^${version}`,
                cucumber: '^2.2.0',
                eslint: 'latest',
                mkdirp: 'latest',
                mocha: 'latest',
                nyc: 'latest'
            }, 'incorrect development dependencies in package file');
        });
    });
});
