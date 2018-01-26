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
const VersionChecker = require('../../lib/tools/versionchecker');


describe('composer cli', () => {

    let sandbox;
    let stubreadfile;

    beforeEach(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        sandbox = sinon.sandbox.create();
        sandbox.stub(yargs, 'options').returns(yargs);
        sandbox.stub(yargs, 'usage').returns(yargs);
        sandbox.stub(process, 'exit');

        // don't fully understand why mockery needs to be used to stub
        // the fs class, but it does work here rather than sinon
        // but this does work.

        /** test class */
        stubreadfile = sandbox.stub();
        let fs =  { readFileSync : stubreadfile };
        mockery.registerMock('fs', fs);
        sandbox.stub(console,'log');
    });

    afterEach(() => {
        mockery.deregisterAll();
        sandbox.restore();
    });


    it('Should set up yargs correctly and call the main version checker code', function () {
        sandbox.stub(VersionChecker,'check');
        delete require.cache[path.resolve(__dirname,  '../../lib/tools/changelog.js')];
        require('../../lib/tools/changelog.js');
        sinon.assert.calledThrice(stubreadfile);

    });

    it('Should handle if VersionChecker throws an error', () => {
        sandbox.stub(VersionChecker,'check').throws(new Error());
        delete require.cache[path.resolve(__dirname,  '../../lib/tools/changelog.js')];
        require('../../lib/tools/changelog.js');
        sinon.assert.calledWith(process.exit, 1);
        sinon.assert.calledThrice(stubreadfile);

    });



});
