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

const composerReport = require('composer-report');

const Report = require('../../lib/cmds/report.js');
const ReportCmd = require('../../lib/cmds/report/reportCommand.js');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const should = chai.should();
chai.use(sinonChai);

describe('composer report CLI', function() {
    const sandbox = sinon.sandbox.create();
    let consoleLogSpy;
    let beginReportStub;
    let collectBasicDiagnosticsStub;
    let completeReportStub;

    beforeEach(function() {
        consoleLogSpy = sandbox.spy(console, 'log');
        beginReportStub = sandbox.stub(composerReport, 'beginReport').returns({
            reportId: 'REPORT',
            reportDir: 'DIR'
        });
        collectBasicDiagnosticsStub = sandbox.stub(composerReport, 'collectBasicDiagnostics');
        completeReportStub = sandbox.stub(composerReport, 'completeReport').returns('ARCHIVE');
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should successfully run the composer report command', function() {
        const args = {};
        return ReportCmd.handler(args).then(() => {
            consoleLogSpy.should.have.been.calledThrice;
            consoleLogSpy.should.have.been.calledWith(sinon.match('Creating Composer report'));
            consoleLogSpy.should.have.been.calledWith(sinon.match('Collecting diagnostic data...'));
            consoleLogSpy.should.have.been.calledWith(sinon.match(/Created archive file: .*ARCHIVE/));
            beginReportStub.should.have.been.calledOnce;
            collectBasicDiagnosticsStub.should.have.been.calledWith('REPORT', 'DIR');
            completeReportStub.should.have.been.calledWith('REPORT', 'DIR');
        });
    });

    it('should execute top level report command',()=>{
        let result = Report.handler({some:'args'});
        result.should.be.an.instanceOf(Promise);
    });

    it('should handle errors', function() {
        let testErr = new Error('ERROR');
        beginReportStub.throws(testErr);

        let result;
        try {
            const args = {};
            return ReportCmd.handler(args).then(() => {
                should.fail('Should have thrown an error!');
            });
        } catch (err) {
            result = err;
        }

        should.exist(result);
        result.name.should.not.equal('DirectoryAccessError');
    });

    it('should throw DirectoryAccessError if the current directory is not writeable', function() {
        let testErr = new Error('Access denied');
        testErr.name = 'DirectoryAccessError';
        beginReportStub.throws(testErr);

        const args = {};
        return ReportCmd.handler(args).then(() => {
            should.fail('Should have been rejected!');
        }).catch((err) => {
            should.exist(err);
            err.name.should.equal('DirectoryAccessError');
        });
    });

});
