/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
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

        it('should throw if version does not match', () => {
            (() => {
                const packageJson = { version: '0.0.2'};
                const publicApi = 'class Bogus{}';
                const digest = VersionChecker.getDigest(publicApi);
                VersionChecker.check('Version 0.0.1 {' + digest + '}', publicApi, JSON.stringify(packageJson));
            }).should.throw(/.+changelog file do not match./);
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
