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
const report = require('../lib/report.js');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;


describe('composer-report CLI command', function() {

    let sandbox;
    let reportStub;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        reportStub = sandbox.stub(report, 'report');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should call the library function when the command is run', function() {
        require('../bin/cmd.js');
        expect(reportStub).to.have.been.calledOnce;
    });
});