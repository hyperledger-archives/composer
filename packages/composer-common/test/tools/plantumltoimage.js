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

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
const path = require('path');

const yargs = require('yargs');
const mockery = require('mockery');

describe('PlantUmlToImage', () => {

    let sandbox;
    let fsextraStubs = {};
    let statsStub = {};

    beforeEach(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });


        sandbox = sinon.sandbox.create();
        // setup the stubs for handling yargs and the process exit
        sandbox.stub(yargs, 'options').returns(yargs);
        sandbox.stub(yargs, 'usage').returns(yargs);
        sandbox.stub(yargs, 'argv').returns();
        sandbox.stub(process, 'exit');

        // Use Mockery to great effect to clean out the fs-extra and the plantuml
        // Allows greater control of what they need to fake


        // make a fake object that mockery will use, and provide it with sinon stubs
        fsextraStubs.readdir = sandbox.stub();
        fsextraStubs.ensureFileSync = sandbox.stub();
        fsextraStubs.statSync = sandbox.stub();
        fsextraStubs.createWriteStream = sandbox.stub();

        statsStub = { isDirectory: sandbox.stub(), isFile: sandbox.stub() };
        fsextraStubs.statSync.returns(statsStub);

        mockery.registerMock('fs-extra', fsextraStubs);

        // also crreate fake version of plantumkl
        mockery.registerMock('node-plantuml', {
            generate: function () {
                return { out: { pipe: sandbox.stub() } };
            }
        });

        // and get console to shutup
        sandbox.stub(console,'log');
        sandbox.stub(console,'error');
    });

    afterEach(() => {
        mockery.deregisterAll();
        sandbox.restore();
    });


    it('Should set up yargs correctly and call the processDirectory', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        // trigger the callback for the list of files
        fsextraStubs.readdir.yield(null, ['file1', 'file2']);
    });

    it('Should set up yargs correctly and call the processDirectory, with files', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        statsStub.isFile.returns(true);

        // trigger the callback with the list of files
        fsextraStubs.readdir.yield(null, ['file1.uml', 'file2.txt']);
    });

    it('Should set up yargs correctly and call the processDirectory, with files', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        statsStub.isDirectory.returns(true);

        // trigger the callback for the list of files
        fsextraStubs.readdir.yield(null, ['dir']);
    });

    it('Should set up yargs correctly and call the processDirectory but trigger an error', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        // trigger the callback with an error
        fsextraStubs.readdir.yield(new Error(),[]);
    });
});
