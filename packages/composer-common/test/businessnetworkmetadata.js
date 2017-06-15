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

const BusinessNetworkMetadata = require('../lib/businessnetworkmetadata');
require('chai').should();

describe('BusinessNetworkMetadata', () => {

    describe('#constructor', () => {

        it('should throw if package.json not specified', () => {
            (() => {
                new BusinessNetworkMetadata();
            }).should.throw(/package.json is required/);
        });

        it('should throw if readme not specified', () => {
            (() => {
                const packageJson = {name: 'foo'};
                new BusinessNetworkMetadata(packageJson, {});
            }).should.throw(/README must be a string/);
        });

        it('should throw if business network connection name contains upper case', () => {
            (() => {
                const readme = 'TEST README';
                const packageJson = {name: 'fOo'};
                new BusinessNetworkMetadata(packageJson,readme);
            }).should.throw(/business network name can only contain/);
        });

        it('should throw if business network connection name contains dots', () => {
            (() => {
                const readme = 'TEST README';
                const packageJson = {name: 'foo.bar'};
                new BusinessNetworkMetadata(packageJson,readme);
            }).should.throw(/business network name can only contain/);
        });


        it('should store package.json and README', () => {
            const readme = 'TEST README';
            const packageJson = {name: 'foo_bar-v1'};
            let metadata = new BusinessNetworkMetadata(packageJson,readme);
            metadata.getREADME().should.equal(readme);
            metadata.getPackageJson().should.equal(packageJson);
        });
    });
});
