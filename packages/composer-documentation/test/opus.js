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

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
const os = require('os');
const path = require('path');
const fs = require('fs');
const tool = require('../index.js');
const rimrafOptions = { disableGlob: true };
const mockery = require('mockery');
const {promisify} = require('util');
const rimraf = promisify(require('rimraf'));
const InfoVisitor = require('../lib/processors/visitors/info.js');

describe('ClassUndertest', function () {

    let sandbox;
    let tmpDir;

    before('Create temporary working directory',()=>{
        // The parent directory for the new temporary directory
        const ostemp = os.tmpdir();
        tmpDir = fs.mkdtempSync(`${ostemp}${path.sep}`);
    });

    after('Remove the temporary directory',()=>{
        return rimraf(tmpDir,rimrafOptions);
    });

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
    });

    afterEach(() => {
        sandbox.restore();
        mockery.deregisterAll();
    });

    describe('#mainCode', async function() {
        it('should handle the system namespace', async function() {
            let args = {  outdir:path.join(tmpDir,'systemns'),
                config: path.resolve(__dirname,'../_configs/sns-config.yaml'),
                nsDocsRoot:path.resolve(__dirname,'../../composer-common/lib/system/')
            };
            await tool(args);
        });

        it('should handle a sample bna', async function() {
            let args = {  outdir:path.join(tmpDir,'bna'), archive : path.resolve(__dirname,'carauction-network.bna'),
                extDocsRoot : path.resolve(__dirname)
            };
            await tool(args);
        });

        it('should handle errors within the main docs loop',async ()=>{
            let mock = {
                resolve: sinon.stub(),
                join : sinon.stub().throws(new Error('wibble'))
            };
            mockery.registerMock('path', mock);

            delete require.cache[path.resolve(__dirname, '../index.js')];
            delete require.cache[path.resolve(__dirname, '../lib/opus.js')];
            let tool =  require('../index.js');
            let args = {  outdir:path.join(tmpDir,'systemns'),
                config: path.resolve(__dirname,'../_configs/sns-config.yaml'),
                nsDocsRoot:path.resolve(__dirname,'../../composer-common/lib/system/')
            };
            tool(args).should.be.eventually.be.rejected;
        });

        it('should handle errors in the visitor class', async function() {
            (()=>{new InfoVisitor().visit({});})
            .should.throw(/Unrecognised type/);
        });
    });


    describe('test file processor ',()=>{
        let tmpDir;
        let processors={};
        before(()=>{
            require('../lib/processors/file.js')(processors);

            // The parent directory for the new temporary directory
            const ostemp = os.tmpdir();
            tmpDir = fs.mkdtempSync(`${ostemp}${path.sep}`);
        });

        after('Remove the temporary directory',()=>{
            return rimraf(tmpDir,rimrafOptions);
        });

        it('handle files without any errors', async function() {
            let context={};
            let meta={};
            meta.inputdir=path.join(__dirname,'../testdata');
            meta.outputdir=tmpDir;
            meta.regexp='// File :(.*):';
            meta.pattern='**/*.js';
            await processors.split.post(context,meta);

            // validate the correct files are created
            let fileNames = fs.readdirSync(tmpDir);
            let filesExpected = [
                'org.example.commercialpaper_Account.js',
                'org.example.commercialpaper_CommercialPaper.js',
                'org.example.commercialpaper_Market.js',
                'org.example.commercialpaper_PaperListing.js',
                'org.example.commercialpaper_PaperOwnership.js',
                'logic.js' ];
            fileNames.should.have.deep.members(filesExpected);

        });
    });




});