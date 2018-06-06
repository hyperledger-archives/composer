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
const path = require('path');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;

describe('composer-report CLI command', function() {

    let sandbox = sinon.sandbox.create();
    let beginReportStub;
    let collectBasicDiagnosticsStub;
    let completeReportStub;
    let consoleLogSpy;

    beforeEach(() => {
        consoleLogSpy = sandbox.spy(console, 'log');
        beginReportStub = sandbox.stub(report, 'beginReport');
        collectBasicDiagnosticsStub = sandbox.stub(report, 'collectBasicDiagnostics');
        completeReportStub = sandbox.stub(report, 'completeReport');
    });

    afterEach(() => {
        sandbox.restore();
        delete require.cache[path.resolve(__dirname, '../bin/cmd.js')];
    });

    it('should call the library functions when the command is run', function() {
        beginReportStub.returns({
            reportId: 'reportId',
            reportDir: 'reportDir'
        });

        require('../bin/cmd.js');

        expect(beginReportStub).to.have.been.calledOnce;
        expect(collectBasicDiagnosticsStub).to.have.been.calledOnce;
        expect(collectBasicDiagnosticsStub).to.have.been.calledWith('reportId', 'reportDir');
        expect(completeReportStub).to.have.been.calledOnce;
        expect(completeReportStub).to.have.been.calledWith('reportId', 'reportDir');
    });

    it('should handle errors', function() {
        let testErr = new Error('ERROR');
        testErr.name = 'NAME';
        beginReportStub.throws(testErr);

        let result;
        try {
            require('../bin/cmd.js');

            expect(beginReportStub).to.have.been.calledOnce;
            expect(collectBasicDiagnosticsStub).not.to.have.been.called;
            expect(completeReportStub).not.to.have.been.called;
        } catch (err) {
            result = err;
        }

        expect(result).to.exist;
    });

    it('should show an error if the current directory is not writeable', function() {
        let testErr = new Error('Access denied');
        testErr.name = 'DirectoryAccessError';
        beginReportStub.throws(testErr);

        require('../bin/cmd.js');

        expect(beginReportStub).to.have.been.calledOnce;
        expect(collectBasicDiagnosticsStub).not.to.have.been.called;
        expect(completeReportStub).not.to.have.been.called;
        expect(consoleLogSpy).to.have.been.calledWith('Access denied');
    });
});
