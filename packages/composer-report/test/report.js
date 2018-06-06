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
const fs = require('fs');
const nodereport = require('node-report');
const tar = require('tar');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);

describe('composer-report CLI', function() {
    const sandbox = sinon.sandbox.create();

    describe('#beginReport', function() {
        let accessSyncStub;
        let mkdtempSyncStub;

        beforeEach(function() {
            accessSyncStub = sandbox.stub(fs, 'accessSync');
            mkdtempSyncStub = sandbox.stub(fs, 'mkdtempSync');
            mkdtempSyncStub.returns('tempDir');
        });

        afterEach(function() {
            sandbox.restore();
        });

        it('should create a temporary directory to store files to create the report archive from', function() {
            let result = report.beginReport();
            expect(result.reportId).to.match(/^composer-report-\d{8}T\d{6}/);
            expect(result.reportDir).to.equal('tempDir');
        });

        it('should handle errors', function() {
            let testErr = new Error('ERROR');
            accessSyncStub.throws(testErr);

            let result;
            try {
                report.beginReport();
            } catch (err) {
                result = err;
            }

            expect(result).to.exist;
            expect(result.name).not.to.equal('DirectoryAccessError');
        });

        it('should throw DirectoryAccessError if the current directory is not writeable', function() {
            let testErr = new Error('Access denied');
            testErr.code = 'EACCES';
            accessSyncStub.throws(testErr);

            let result;
            try {
                report.beginReport();
            } catch (err) {
                result = err;
            }

            expect(result).to.exist;
            expect(result.name).to.equal('DirectoryAccessError');
        });
    });

    describe('#collectBasicDiagnostics', function() {
        let triggerReportStub;
        let setDirectoryStub;
        let writeFileSyncStub;

        beforeEach(function() {
            triggerReportStub = sandbox.stub(nodereport, 'triggerReport');
            setDirectoryStub = sandbox.stub(nodereport, 'setDirectory');
            writeFileSyncStub = sandbox.stub(fs, 'writeFileSync');
        });

        afterEach(function() {
            sandbox.restore();
        });

        it('should successfully write a composer report text file to the temporary directory', function() {
            report.collectBasicDiagnostics('reportId', 'reportDir');
            expect(writeFileSyncStub).to.have.been.calledWith('reportDir/reportId.txt', sinon.match(/^composer-report version: \d+\.\d+\.\d+$/));
        });

        it('should successfully write a node-report report to the temporary directory', function() {
            report.collectBasicDiagnostics('reportId', 'reportDir');
            expect(setDirectoryStub).to.have.been.calledWith('reportDir');
            expect(triggerReportStub).to.have.been.called;
        });
    });

    describe('#completeReport', function() {
        let cStub;

        beforeEach(function() {
            cStub = sandbox.stub(tar, 'c');
        });

        afterEach(function() {
            sandbox.restore();
        });

        it('should successfully create a zipped tar archive of the temporary directory in the current directory', function() {
            report.completeReport('reportId', 'reportDir');
            sinon.assert.calledOnce(cStub);
            sinon.assert.calledWith(cStub, {
                cwd: 'reportDir/',
                prefix: 'reportId',
                gzip: true,
                file: 'reportId.tgz',
                sync: true
            }, ['.']);
        });
    });
});
