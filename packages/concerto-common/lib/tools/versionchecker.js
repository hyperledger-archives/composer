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

const crypto = require('crypto');

/**
 * Checks that a change log file takes into account
 * the signature of a public API (tracks API breakage)
 * and that the version number in package.json is in sync
 * with the contents of the changelog.
 * @private
 * @class
 * @memberof module:ibm-concerto-common
 */
class VersionChecker {

    /**
     * @param {string} changelog - the text of a changelog file
     * @param {string} publicApi - the text of a public API description
     * @param {string} packageJson - the text of a package.json file
     * @returns {boolean} true if the version check passes
     * @throws {Error} if there is an issue with the version check
     */
    static check(changelog, publicApi, packageJson) {
        const changelogLines = changelog.split('\n');
        const digest = VersionChecker.getDigest(publicApi);
        let result = false;

        for (let n = 0; n < changelogLines.length; n++) {
            const line = changelogLines[n];

            if (!line.startsWith('#')) {
                // find the first instance of 'Version'
                const versionIndex = line.indexOf('Version');
                if (versionIndex >= 0) {
                    // find the version number
                    const openBraceIndex = line.indexOf('{', versionIndex);

                    if (openBraceIndex < 0) {
                        throw new Error('Invalid changelog, failed to find { in line ' + line);
                    }

                    const version = line.substring(versionIndex + 'Version'.length, openBraceIndex).trim();

                    // check the version in package.json is up to date
                    const packageObj = JSON.parse(packageJson);

                    if (packageObj.version !== version) {
                        throw new Error('The version in package.json and in the changelog file do not match.');
                    }

                    // get MD5
                    const closeBraceIndex = line.indexOf('}', openBraceIndex);

                    if (closeBraceIndex < 0) {
                        throw new Error('Invalid changelog, failed to find } in line ' + line);
                    }

                    const md5 = line.substring(openBraceIndex + 1, closeBraceIndex).trim();

                    if (digest !== md5) {
                        throw new Error('Computed public API digest did not match the digest in the changelog for the most recent version. ' +
                        'Increment the version number and add a new entry to the changelog (explaining your public API change) using the digest ' + digest +
                        '. Run \'git diff api.txt\' to understand the pubic API changes.');
                    }

                    // we're done here...
                    result = true;
                    break;
                }
            }

        }
        if (!result) {
            throw new Error('Did not find any version in changelog');
        }
        else {
            console.log('SUCCESS: validated public API against package.json and changelog.txt.');
        }

        return true;
    }

    /**
     * Gets the digest (hash) for an input string
     * @param {string} data - the data to hash
     * @returns {string} the hash in hex format
     */
    static getDigest(data) {
        return crypto.createHash('md5').update(data).digest('hex');
    }
}

module.exports = VersionChecker;
