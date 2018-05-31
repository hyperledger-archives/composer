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

const RegClient = require('npm-registry-client');
const npmClientConfig = {
    retry : {
        count : 1,
        minTimeout : 2000,
        maxTimeout : 5000
    }
};
const client = new RegClient(npmClientConfig);
const semver = require('semver');
const tar = require('tar');
const url = require('url');
const async = require('async');
const httpstatus = require('http-status');

const composerVersion = require('composer-common/package.json').version;

const express = require('express');
const Logger = require('composer-common').Logger;

const LOG = Logger.getLog('NPM');

const sampleList = [{name : 'basic-sample-network'}];
const fs = require('fs');

module.exports = (app, testMode) => {

    // Create a new router.
    const router = express.Router();

    app.use('/', router);


    /**
     * Get the names of the sample network
     * @param {function} callback the function to call when done
     */
    function getSampleNames (callback) {
        const method = 'getSampleNames';
        LOG.entry(method, null);
        const search = url.parse('https://registry.npmjs.org/-/v1/search');
        search.query = {
            text : 'keywords:composer-network maintainer:hyperledger-ci'
        };
        const urlToGet = url.format(search);
        client.get(urlToGet, {}, (error, data) => {
            if (error) {
                LOG.error(method, error);
                LOG.exit(method, null);
                return callback(error);
            }

            LOG.exit(method, data);
            return callback(null, data);

        });
    }

    /**
     * Get the data about the sample
     * @param {object} packageName The package name
     * @param {function} callback The function to call when done
     */
    function extractMetaData (packageName, callback) {
        const method = 'extractMetaData';
        LOG.entry(method, packageName);
        const urlToGet = 'https://registry.npmjs.org/' + packageName.package.name;
        client.get(urlToGet, {}, (error, data) => {
            if (error) {
                LOG.error(method, error);
                LOG.exit(method, null);
                return callback(error);
            }
            LOG.exit(method, data);
            return callback(null, data);
        });
    }

    /**
     * Get the sample meta data
     * @param {Array} packageNames the names of the samples
     * @param {function} callback the function to call when done
     */
    function getSampleMetaData (packageNames, callback) {
        const method = 'getSampleMetaData';
        LOG.entry(method, packageNames);

        async.map(packageNames.objects, extractMetaData, function (err, results) {
            if (err) {
                return callback(err);
            }

            return callback(null, results);
        });
    }

    /**
     * Download the sample metadata
     * @param {Array} packages the array of sample metadata
     * @param {function} callback the function to call when done
     * @returns {Array} The array of sample metadata
     */
    function downloadMetaData (packages, callback) {
        const method = 'downloadMetaData';
        LOG.entry(method, null);
        // For each matching package (using the downloaded short package metadata) ...
        let options = [];
        packages.forEach((thePackage) => {

            // For each published version of the package ...
            const versions = Object.keys(thePackage.versions)

            // Sort in descending semantic versioning order (1.0.0, 0.1.0, 0.0.1).
                .sort(semver.rcompare)

                // Remove any prelease versions.
                // TODO: For prelease/unstable Composer versions, we might want to include these.
                // .filter((version) => {
                //     return semver.prerelease(version) === null;
                // })

                // Validate that the package.json includes a "engines" stanza that includes a
                // "composer" property, with a semantic version range of supported Composer versions.
                // Once we have validated that, use that information to check that the package is
                // supported by the current version of Composer
                .filter((version) => {
                    const metadata = thePackage.versions[version];
                    if (!metadata.engines) {
                        return false;
                    } else if (!metadata.engines.composer) {
                        return false;
                    }
                    let composerVersionToUse = composerVersion;
                    if (semver.prerelease(composerVersionToUse)) {
                        composerVersionToUse = semver.inc(composerVersionToUse, 'patch');
                    }
                    return semver.satisfies(composerVersionToUse, metadata.engines.composer);
                });

            // If we found multiple versions of the package, we want the first (newest).
            if (versions.length) {
                const version = versions.shift();
                const metadata = thePackage.versions[version];
                options.push({
                    name : metadata.name,
                    description : metadata.description,
                    version : metadata.version,
                    networkImage : metadata.networkImage,
                    networkImageanimated : metadata.networkImageanimated,
                    tarball : metadata.dist.tarball
                });
            }
        });

        LOG.exit(method, options);
        return callback(null, options);
    }

    /**
     * Sort the samples into the correct order
     * @param {Array} samples the array of samples
     * @param {function} callback the function to call when done
     * @returns {Array} The array of sorted samples
     */
    function sortSamples (samples, callback) {
        const method = 'sortSamples';

        // Define primary networks.
        let primarySampleNames = ['basic-sample-network'];
        let sorted = [];

        // Append primary networks to the list.
        for (let i = 0; i < primarySampleNames.length; i++) {
            let primaryName = primarySampleNames[i];
            for (let j = 0; j < samples.length; j++) {
                let network = samples[j];
                if (primaryName === network.name) {
                    sorted.push(network);
                }
            }
        }

        // Create an array of networks that are not classed as primary.
        let nonPrimaryNetworks = [];
        for (let i = 0; i < samples.length; i++) {
            let network = samples[i];
            if (primarySampleNames.indexOf(network.name) === -1) {
                nonPrimaryNetworks.push(network);
            }
        }

        // Sort non primary networks alphabetically.
        let sortedNonPrimarySamples = nonPrimaryNetworks.sort((a, b) => {
            let businessNetworkA = a.name.toLowerCase();
            let businessNetworkB = b.name.toLowerCase();
            if (businessNetworkA < businessNetworkB) {
                return -1;
            }
            if (businessNetworkA > businessNetworkB) {
                return 1;
            } else {
                return 0;
            }
        });

        // Append non primary networks to list.
        for (let i = 0; i < sortedNonPrimarySamples.length; i++) {
            let network = sortedNonPrimarySamples[i];
            sorted.push(network);
        }

        LOG.exit(method, sorted);
        return callback(null, sorted);
    }

    /**
     * Check if environment has client id and secret in
     */
    router.get('/api/getSampleList', (req, res, next) => {
        const method = '/api/getSampleList';
        LOG.entry(method, null);

        if (testMode) {
            LOG.debug(method, 'in test mode - getting sample list');
            return res.status(200).json(sampleList);
        } else {
            async.waterfall([
                getSampleNames,
                getSampleMetaData,
                downloadMetaData,
                sortSamples
            ], function (err, result) {
                if (err) {
                    return res.status(httpstatus.INTERNAL_SERVER_ERROR).json({error : err});
                }
                LOG.exit(method, result);
                return res.status(200).json(result);
            });
        }
    });

    /**
     * Download the chosen sample
     * @param {stream} stream the stream of data
     * @param {object} res response object
     */
    function downloadSample (stream, res) {
        const method = 'downloadSample';
        LOG.entry(method, null);

        // Set up a tar parser that selects BNA files.
        const tarParse = new tar.Parse({
            filter : (path) => {
                return path.match(/\.bna$/);
            }
        });

        // Go through every entry.
        const pipe = stream.pipe(tarParse);
        pipe.on('entry', (entry) => {
            LOG.debug(method, 'Found business network archive in package', entry.path);
            let buffer = Buffer.alloc(0);
            entry.on('data', (data) => {
                // Collect the data.
                buffer = Buffer.concat([buffer, data]);
            });
            entry.on('end', () => {
                LOG.exit(method, null);
                res.set({
                    'Content-Type' : 'text/plain; charset=x-user-defined',
                });
                return res.send(buffer);
            });
        });
    }

    /**
     * Download sample
     */
    router.get('/api/downloadSample', (req, res, next) => {
        let chosenSample = req.query;
        const method = 'GET /api/downloadSample';
        LOG.entry(method, chosenSample);


        if (testMode) {
            let readStream = fs.createReadStream(__dirname + '/../basic-sample-network-0.2.2.tgz');

            return downloadSample(readStream, res);
        }
        // Download the package tarball.
        client.fetch(chosenSample.tarball, {}, (error, stream) => {
            if (error) {
                return res.status(httpstatus.INTERNAL_SERVER_ERROR).json({error : error});
            }

            downloadSample(stream, res);
        });
    });
};



