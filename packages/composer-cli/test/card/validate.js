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

const validate = require('../../lib/cmds/card/lib/validate.js');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
chai.use(sinonChai);


describe('Unit test of profiles against schemas', function() {

    it('should return nothing for a valid json connection profile', function() {
        let profile = require('../../test/card/data/connection.json');
        expect(validate.validateProfile(profile)).to.be.undefined;
    });

    it('should return no errors for a yaml profile', function() {
        let profile = yaml.safeLoad(fs.readFileSync(path.resolve('./test/card/data/connection.yaml'), 'utf8'));
        expect(validate.validateProfile(profile)).to.be.undefined;
    });

    it('should return no errors for connection profile in documentation profile', function() {
        let profile = require('../../test/card/data/connection.in.doc.json');
        expect(validate.validateProfile(profile)).to.be.undefined;
    });

    it('should return an error for a json connection profile with no name', function() {
        let EXPECTED = {
            'dataPath': '',
            'keyword': 'required',
            'message': 'should have required property \'name\'',
            'params': {
                'missingProperty': 'name',
            },
            'schemaPath': '#/required'
        };
        let profile = require('../../test/card/data/connection.no.name.json');
        expect(validate.validateProfile(profile)).to.deep.equal([EXPECTED]);
    });

    it('should return 1 error for connection profile with neither name nor xtype', function() {
        let profile = require('../../test/card/data/connection.no.name.no.xtype.json');
        const results = validate.validateProfile(profile);
        expect(results.length).to.equal(1);
        expect(results[0]).to.include('Connection profile has no `x-type` property defined');
    });

    it('should not fail validation if x-type is not hlfv1', function() {
        let profile = {
            'x-type' : 'embedded'
        };
        const results = validate.validateProfile(profile);
        expect(results).to.be.undefined;

    });


    it('should return 2 errors for connection profile in documentation profile', function() {
        let EXPECTED = {
            'dataPath': '.client',
            'keyword': 'required',
            'message': 'should have required property \'organization\'',
            'params': {
                'missingProperty': 'organization',
            },
            'schemaPath': '#/definitions/client/required'
        };
        let profile = require('../../test/card/data/connection.no.org.in.client.json');
        expect(validate.validateProfile(profile)).to.deep.equal([EXPECTED]);
    });

});
