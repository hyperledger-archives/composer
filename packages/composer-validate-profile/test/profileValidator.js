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

const validator = require('../lib/profilevalidator.js');
const fs = require('fs');
const ajv = require('ajv');
const yaml = require('js-yaml');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const assert = sinon.assert;
const expect = chai.expect;
chai.use(sinonChai);

describe('composer validate-profile CLI', function() {
    const sandbox = sinon.sandbox.create();
    let jsonSpy;
    let consoleLogSpy;
    let GOOD_JSON_FILE = './test/data/connection.json';
    let BAD_JSON_FILE = './test/data/connectionBadJson.json';
    let GOOD_YAML_FILE = './test/data/connection.yaml';
    let BAD_YAML_FILE = './test/data/connectionBadYaml.yaml';

    beforeEach(function() {
        consoleLogSpy = sandbox.spy(console, 'log');
        jsonSpy = sandbox.spy(JSON, 'parse');
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('Input validation', function() {
        it('should throw an error when no arguments are specified', function() {
            expect(validator.validateProfile.bind(validator, '')).to.throw('Error: no file name specified');
        });

        it('should throw an error when an argument that ends in neither json or yaml is specified', function() {
            expect(validator.validateProfile.bind(validator, 'test')).to.throw('Usage ERROR: please supply a JSON or YAML connection profile');
        });

        it('should throw an error when an invalid schematype is specified', function() {
            expect(validator.validateProfile.bind(validator, './test/data/connection.json', 'bad')).to.throw('Error: Invalid schema type specified');
        });

    });

    describe('File load', function () {

        let yamlSpy;
        let fsSpy;

        beforeEach(function() {
            fsSpy = sandbox.spy(fs, 'readFileSync');
            yamlSpy = sandbox.spy(yaml, 'safeLoad');
        });

        it('should throw an error when a JSON filename that cannot be resolved is specified ', function() {
            expect(validator.validateProfile.bind(validator, 'doesnotexist.json')).to.throw(Error, /^ENOENT.*$/);
        });

        it('should throw an error when a YAML filename that cannot be resolved is specified ', function() {
            expect(validator.validateProfile.bind(validator, 'doesnotexist.yaml')).to.throw(Error, /^ENOENT.*$/);
        });

        it('should throw an error when a file with unparseable JSON is supplied', function() {
            expect(validator.validateProfile.bind(validator, BAD_JSON_FILE)).to.throw(Error, 'Unexpected token n in JSON at position 1');
        });

        it('should throw an error when a file with unparseable YAML is supplied', function() {
            expect(validator.validateProfile.bind(validator, BAD_YAML_FILE)).to.throw();
        });

        it('should load an object using js-yaml when a file with good YAML content is specified', function() {
            validator.validateProfile(GOOD_YAML_FILE);
            expect(fsSpy).to.have.been.calledWith(sinon.match(/^.*connection.yaml$/));
            expect(yamlSpy).to.have.been.called;
        });

        it('should load an object using JSON when a file with good JSON content is specified', function() {
            validator.validateProfile(GOOD_JSON_FILE);
            expect(fsSpy).to.have.been.calledWith(sinon.match(/^.*connection.json$/));
            expect(jsonSpy).to.have.been.called;
        });

        it('should display success messages when a file containing a valid profile is specified ', function() {
            validator.validateProfile(GOOD_JSON_FILE);
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/Validating profile file:.*json/));
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/SUCCESS: .*the profile is valid/));
        });

    });

    describe('Schema and ajv Tests', function () {
        it('should throw an error from ajv if a bad schema is loaded', function() {
            let compiler = new ajv();
            let schemaFile = fs.readFileSync('./test/data/badschema.json', 'utf8');
            let schema = JSON.parse(schemaFile);
            expect(compiler.compile.bind(compiler, schema)).to.throw;
        });
        it('should load the real JSON Schema file successfully', function() {
            let schemaFile = fs.readFileSync('./schema/ccpschema.json', 'utf8');
            let compiler = new ajv();
            let schema = JSON.parse(schemaFile);
            expect(compiler.compile.bind(compiler, schema)).to.not.throw;
        });
    });

    describe('Tests with real profiles that are valid', function() {

        it('should list no errors for a valid connection profile', function() {
            validator.validateProfile('./test/data/connection.json');
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/Validating profile file:.*json/));
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/SUCCESS: .*the profile is valid/));
        });

        it('should list no errors for the sample profile in the reference section of the composer docs', function() {
            validator.validateProfile('./test/data/connection.profile.in.doc.json');
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/Validating profile file:.*json/));
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/SUCCESS: .*the profile is valid/));
        });

        it('should list no errors for the sample profile in the reference section of the fabric docs', function() {
            validator.validateProfile('./test/data/connection.profile.in.fabric.doc.yaml', 'fabric');
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/Validating profile file:.*yaml/));
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/SUCCESS: .*the profile is valid/));
        });

    });

    describe('Tests with real profiles that are not valid', function() {

        let reportErrorSpy;
        let MISSING_NAME = {
            keyword: 'required',
            dataPath: '',
            schemaPath: '#/required',
            params: { missingProperty: 'name' },
            message: 'should have required property \'name\''
        };
        let MISSING_XTYPE = {
            keyword: 'required',
            dataPath: '',
            schemaPath: '#/required',
            params: { missingProperty: 'x-type' },
            message: 'should have required property \'x-type\''
        };

        beforeEach(function() {
            reportErrorSpy = sandbox.spy(validator, 'reportError');
        });

        it('should list an error if the connection profile doesn\'t contain a name property', function() {
            validator.validateProfile('./test/data/connection.no.name.json');
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/Validating profile file:.*json/));
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/ERROR: .*the profile contains the following errors/));
            expect(reportErrorSpy).to.have.been.calledOnce;
            expect(reportErrorSpy).to.have.been.calledWith(MISSING_NAME);
        });

        it('should list an error if the connection profile name property is invalid', function() {
            let exp = {
                keyword: 'pattern',
                dataPath: '.name',
                schemaPath: '#/properties/name/pattern',
                params: { pattern: '^[a-zA-Z0-9_-]*$' },
                message: 'should match pattern "^[a-zA-Z0-9_-]*$"'
            };
            validator.validateProfile('./test/data/connection.invalid.name.json');
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/Validating profile file:.*json/));
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/ERROR: .*the profile contains the following errors/));
            expect(reportErrorSpy).to.have.been.calledOnce;
            expect(reportErrorSpy).to.have.been.calledWith(exp);
        });

        it('should list an error if the connection profile has a client section with no organization', function() {
            let exp = {
                keyword: 'required',
                dataPath: '.client',
                schemaPath: '#/definitions/client/required',
                params: { missingProperty: 'organization' },
                message: 'should have required property \'organization\''
            };
            validator.validateProfile('./test/data/connection.client.no.org.json');
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/Validating profile file:.*json/));
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/ERROR: .*the profile contains the following errors/));
            expect(reportErrorSpy).to.have.been.calledOnce;
            expect(reportErrorSpy).to.have.been.calledWith(exp);

        });

        it('should list two errors if the connection profile has a client section with no organization', function() {
            validator.validateProfile('./test/data/connection.client.no.name.no.xtype.json');
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/Validating profile file:.*json/));
            expect(consoleLogSpy).to.have.been.calledWith(sinon.match(/ERROR: .*the profile contains the following errors/));
            expect(reportErrorSpy).to.have.been.calledTwice;
            expect(reportErrorSpy).to.have.been.calledWith(MISSING_NAME);
            expect(reportErrorSpy).to.have.been.calledWith(MISSING_XTYPE);
        });
    });
});
