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

const config = require('../config/environment');
const express = require('express');
const exec = require('child_process').exec;
const Logger = require('composer-common').Logger;
const request = require('request');
const httpstatus = require('http-status');

const LOG = Logger.getLog('github');

let router = null;

module.exports = (app) => {

    // Did we already create a router?
    if (router !== null) {
        return router;
    }

    // Create a new router.
    router = express.Router();

    app.use('/', router);

    /**
     * Check if environment has client id and secret in
     */
    router.get('/api/isOAuthEnabled', (req, res, next) => {
        const method = 'GET /api/isOAuthEnabled';
        LOG.entry(method);
        let result = false;
        if (config.clientId && config.clientSecret) {
            result = true;
        }
        LOG.exit(method, result);
        res.status(200).json(result);
    });

    /**
     * Run npm view to get the details of a npm module
     */
    router.get('/api/getNpmInfo/:moduleName', (req, res, next) => {
        const method = 'GET /api/getNpmInfo/:moduleName';
        const moduleName = req.params.moduleName;
        LOG.entry(method, moduleName);
        let child = exec('npm view ' + moduleName,
            function (error, stdout, stderr) {
                if (error !== null) {
                    console.log('BANANA');
                    LOG.error(error);
                    LOG.exit(method, null);
                    res.status(httpstatus.INTERNAL_SERVER_ERROR).json({error : error});
                } else {
                    try {
                        let output = stdout.replace(/\n/g, '');
                        let sortOfParsed = JSON.stringify(eval('(' + output + ')'));
                        let result = JSON.parse(sortOfParsed);
                        LOG.exit(method, result);
                        res.status(200).json(result);
                    } catch (error) {
                        LOG.error(error);
                        res.status(httpstatus.INTERNAL_SERVER_ERROR).json({error : error.message});
                    }
                }
            });

        LOG.exit(method, null);
        return child;
    });

    /**
     * Get github client id that the user has set
     */
    router.get('/api/getGithubClientId', (req, res, next) => {
        const method = 'GET /api/getGithubClientId';
        LOG.entry(method);
        res.status(200).json(config.clientId);
    });

    /**
     * Exchange access code for a access token from github
     */
    router.get('/api/getGitHubAccessToken/:accessCode', (req, res, next) => {
        const method = 'GET /api/getGitHubAccessToken/:accessCode';
        const accessCode = req.params.accessCode;
        LOG.entry(method, accessCode);

        let endpoint = config.githubAccessTokenUrl + '?' +
            'code=' + accessCode +
            '&client_id=' + config.clientId +
            '&client_secret=' + config.clientSecret;

        return request({
            method : 'POST',
            url : endpoint,
            json : true
        }, function handleResponse (err, response) {
            if (err || response.body.error) {
                let error = err || response.body.error;
                LOG.error({err : error}, 'Error occurred while attempting to exchange code for access token.');
                return res.status(httpstatus.INTERNAL_SERVER_ERROR).json({error: err});
            }

            res.status(200).json(response.body);
        });

    });

    // Return the router.
    return router;

};
