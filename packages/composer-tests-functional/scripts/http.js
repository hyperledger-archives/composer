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

const assert = require('assert');
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const http = require('http');

const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach((method) => {

    app[method.toLowerCase()]('/api/basic', (req, res) => {
        res.status(200).json({
            method: req.method
        });
    });

    app[method.toLowerCase()]('/api/error', (req, res) => {
        res.status(500).json({
            method: req.method,
            error: 'such error'
        });
    });

    app[method.toLowerCase()]('/api/assetin', (req, res) => {
        assert.deepStrictEqual(req.body, {
            $class: 'systest.transactions.http.DummyAsset',
            assetId: '1234',
            integerValue: 12345678,
            stringValue: 'hello world'
        });
        res.status(200).json({
            method: req.method
        });
    });

    app[method.toLowerCase()]('/api/assetwithrelationshipin', (req, res) => {
        assert.deepStrictEqual(req.body, {
            $class: 'systest.transactions.http.DummyAsset',
            assetId: '1234',
            integerValue: 12345678,
            stringValue: 'hello world',
            participant: 'resource:systest.transactions.http.DummyParticipant#1234'
        });
        res.status(200).json({
            method: req.method
        });
    });

    app[method.toLowerCase()]('/api/assetwithresolvedrelationshipin', (req, res) => {
        assert.deepStrictEqual(req.body, {
            $class: 'systest.transactions.http.DummyAsset',
            assetId: '1234',
            integerValue: 12345678,
            stringValue: 'hello world',
            participant: {
                $class: 'systest.transactions.http.DummyParticipant',
                participantId: '1234',
                stringValue: 'hello world'
            }
        });
        res.status(200).json({
            method: req.method
        });
    });

    app[method.toLowerCase()]('/api/assetout', (req, res) => {
        res.status(200).json({
            method: req.method,
            asset: {
                $class: 'systest.transactions.http.DummyAsset',
                assetId: '1234',
                integerValue: 12345678,
                stringValue: 'hello world'
            }
        });
    });

});

process.on('SIGINT', function () {
    fs.unlinkSync('http.port');
});

(async () => {
    await new Promise((resolve, reject) => {
        server.on('error', reject);
        server.on('listening', resolve);
        server.listen();
    });
    const port = server.address().port;
    fs.writeFileSync('http.port', port, { encoding: 'utf8' });
    process.send('ready');
})();