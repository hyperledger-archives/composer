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

const fs = require('fs');
const path = require('path');
const Validate = require('../../lib/cmds/archive/validateCommand.js');
const MigrationChecker = require('../../lib/cmds/archive/lib/migrationchecker.js');
//const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

describe('composer archive validate unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(path, 'resolve');
        sandbox.stub(fs, 'readFileSync');
        sandbox.stub(process, 'exit');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('List handler() method tests', function () {

        it('should correctly execute when all params correctly specified.', function () {

            let argv = { from: 'somearchive.zip', to: 'anotherarchive.zip' };

            let loadNetworkStub = sinon.stub(MigrationChecker.prototype, 'loadNetworks').resolves();
            let runRulesStub = sinon.stub(MigrationChecker.prototype, 'runRules').resolves();

            return Validate.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(loadNetworkStub);
                sinon.assert.calledOnce(runRulesStub);

                loadNetworkStub.restore();
                runRulesStub.restore();
            });
        });
    });

});