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
const { sep } = require('path');
const os = require('os');
const nodereport = require('node-report');
const tar = require('tar');

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const assert = chai.assert;
chai.use(sinonChai);

describe('composer-report CLI', function() {
    const sandbox = sinon.sandbox.create();
    let triggerReportStub;
    let setDirectoryStub;
    let cStub;

    beforeEach(function() {
        cStub = sandbox.stub(tar, 'c').returns(Promise.resolve());
        triggerReportStub = sandbox.stub(nodereport, 'triggerReport');
        setDirectoryStub = sandbox.stub(nodereport, 'setDirectory');
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should successfully run the composer-report command with no arguments specified', function() {
        let reportSpy = sinon.spy(report, 'report');
        report.report({}, reportSpy);
        expect(reportSpy).to.have.been.calledWith({});
    });

    it('should create a temporary directory to store files to create the report archive from', function() {
        let setupSpy = sinon.spy(report, 'setupReportDir');
        let result = report.setupReportDir(setupSpy);
        expect(setupSpy).to.have.been.calledOnce;
        assert.match(result, new RegExp('^'+os.tmpdir()+sep+'.*$'));
    });

    it('should successfully write a node-report report to the temporary directory', function() {
        let createReportSpy = sinon.spy(report, 'createNodeReport');
        report.createNodeReport('/tmp');
        expect(createReportSpy).to.have.been.calledWith('/tmp');
        expect(setDirectoryStub).to.have.been.calledWith('/tmp');
        expect(triggerReportStub).to.have.been.calledWith();
    });

    it('should successfully create a zipped tar archive of the COMPOSER_REPORT_TEMPDIR in the current directory and log the output filename in the console', function() {
        report.archiveReport('COMPOSER_REPORT_TEMPDIR');
        sinon.assert.calledOnce(cStub);
        sinon.assert.calledWith(cStub, {
            cwd: 'COMPOSER_REPORT_TEMPDIR/',
            prefix: sinon.match(/^composer-report-\d{8}T\d{6}$/),
            gzip: true,
            file: sinon.match(/^composer-report-\d{8}T\d{6}\.tgz$/),
            sync: true
        }, ['.']);
    });
});
