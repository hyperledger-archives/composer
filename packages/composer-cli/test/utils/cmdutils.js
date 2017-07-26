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

const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');

const fs = require('fs');
const chai = require('chai');
const sinon = require('sinon');


chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

describe('composer transaction cmdutils unit tests', () => {

    let sandbox;
    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#parseOptions', () => {
        it('should return an empty object if no options to parse', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'};
            CmdUtil.parseOptions(argv).should.deep.equal({});
        });

        it('should handle only optionsFile', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,optionsFile: '/path/to/options.json'};
            const optionsFileContents = '{"opt1": "value1", "opt2": "value2"}';
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(optionsFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'value1', opt2: 'value2'});
        });

        it ('should handle options file not found', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,optionsFile: '/path/to/options.json'};
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(false);
            CmdUtil.parseOptions(argv).should.deep.equal({});
        });

        it('should handle only a single option', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'opt1=value1'};
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'value1'});
        });

        it('should handle multiple options', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: ['opt1=value1', 'opt2=value2', 'opt3=value3']};
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'value1', opt2: 'value2', opt3: 'value3'});
        });

        it('should handle a single option (exists in options file) and options file', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'opt1=newvalue1'
                       ,optionsFile: '/path/to/options.json'};
            const optionsFileContents = '{"opt1": "value1", "opt2": "value2"}';
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(optionsFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'newvalue1', opt2: 'value2'});
        });

        it('should handle a single option (does not exist in options file) and options file', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'opt4=newvalue1'
                       ,optionsFile: '/path/to/options.json'};
            const optionsFileContents = '{"opt1": "value1", "opt2": "value2"}';
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(optionsFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'value1', opt2: 'value2', opt4: 'newvalue1'});
        });


        it('should handle a multiple options and options file', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: ['opt1=newvalue1', 'opt5=newvalue5']
                       ,optionsFile: '/path/to/options.json'};
            const optionsFileContents = '{"opt1": "value1", "opt2": "value2"}';
            sandbox.stub(fs, 'readFileSync').withArgs('/path/to/options.json').returns(optionsFileContents);
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(true);
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'newvalue1', opt2: 'value2', opt5: 'newvalue5'});
        });

        it('should handle a missing options file and single option provided', () => {
            const argv = {enrollId: 'WebAppAdmin'
                       ,enrollSecret: 'DJY27pEnl16d'
                       ,connectionProfileName: 'testProfile'
                       ,option: 'opt1=value1'
                       ,optionsFile: '/path/to/options.json'};
            sandbox.stub(fs, 'existsSync').withArgs('/path/to/options.json').returns(false);
            CmdUtil.parseOptions(argv).should.deep.equal({opt1: 'value1'});
        });
    });
});
