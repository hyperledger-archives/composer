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

const VersionChecker = require('../../lib/tools/versionchecker');
require('chai').should();

describe('VersionChecker', () => {

    describe('#check', () => {
        it('should not throw if api signature digest and versions match', () => {
            const packageJson = { version: '0.0.1'};
            const publicApi = 'class Bogus{}';
            const digest = VersionChecker.getDigest(publicApi);
            VersionChecker.check('Version 0.0.1 {' + digest + '}', publicApi, JSON.stringify(packageJson));
        });

        it('should ignore hash and not throw if api signature digest and versions match', () => {
            const packageJson = { version: '0.0.1'};
            const publicApi = 'class Bogus{}';
            const digest = VersionChecker.getDigest(publicApi);
            VersionChecker.check('#Comment\n\n\nVersion 0.0.1 {' + digest + '}', publicApi, JSON.stringify(packageJson));
        });

        it('should throw if digest does not match', () => {
            (() => {
                const packageJson = { version: '0.0.1'};
                const publicApi = 'class Bogus{}';
                const digest = VersionChecker.getDigest(publicApi + ' foo');
                VersionChecker.check('Version 0.0.1 {' + digest + '}', publicApi, JSON.stringify(packageJson));
            }).should.throw(/.+pubic API changes./);
        });

        it('should not throw if version matches', () => {
            const packageJson = { version: '0.0.2'};
            const publicApi = 'class Bogus{}';
            const digest = VersionChecker.getDigest(publicApi);
            VersionChecker.check('Version 0.0.2 {' + digest + '}', publicApi, JSON.stringify(packageJson));
        });

        it('should not throw if version does not match but is less than package version', () => {
            const packageJson = { version: '0.0.2'};
            const publicApi = 'class Bogus{}';
            const digest = VersionChecker.getDigest(publicApi);
            VersionChecker.check('Version 0.0.1 {' + digest + '}', publicApi, JSON.stringify(packageJson));
        });

        it('should throw if version does not match and is greater than package version', () => {
            (() => {
                const packageJson = { version: '0.0.2'};
                const publicApi = 'class Bogus{}';
                const digest = VersionChecker.getDigest(publicApi);
                VersionChecker.check('Version 0.0.3 {' + digest + '}', publicApi, JSON.stringify(packageJson));
            }).should.throw(/is not less than or equal/);
        });

        it('should throw if version missing from changelog', () => {
            (() => {
                const packageJson = { version: '0.0.2'};
                const publicApi = 'class Bogus{}';
                const digest = VersionChecker.getDigest(publicApi);
                VersionChecker.check('Ver 0.0.1 {' + digest + '}', publicApi, JSON.stringify(packageJson));
            }).should.throw(/Did not find any version in changelog/);
        });

        it('should throw if open brace missing from changelog', () => {
            (() => {
                const packageJson = { version: '0.0.1'};
                const publicApi = 'class Bogus{}';
                const digest = VersionChecker.getDigest(publicApi);
                VersionChecker.check('Version 0.0.1 ' + digest + '}', publicApi, JSON.stringify(packageJson));
            }).should.throw(/.+failed to find {.+/);
        });

        it('should throw if close brace missing from changelog', () => {
            (() => {
                const packageJson = { version: '0.0.1'};
                const publicApi = 'class Bogus{}';
                const digest = VersionChecker.getDigest(publicApi);
                VersionChecker.check('Version 0.0.1 {' + digest, publicApi, JSON.stringify(packageJson));
            }).should.throw(/.+failed to find }.+/);
        });
    });
});
