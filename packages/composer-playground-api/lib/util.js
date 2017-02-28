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

const bodyParser = require('body-parser');
const express = require('express');

/**
 * This class contains a set of utility functions for use within Composer API.
 */
class Util {

    /**
     * Create a new instance of Express.
     * @return {Object} a new instance of Express.
     */
    static createApp() {

        // Create a new instance of express.
        const app = express();

        // Enable automatic JSON body parsing.
        app.use(bodyParser.json());

        // Enable Cross-Origin Resource Sharing.
        app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,HEAD');
            next();
        });

        // Set up the default error handler.
        app.use((err, req, res, next) => {
            res.status(500).json({ error: err.message });
        });

        // Return the new instance of express.
        return app;
    }
}

module.exports = Util;
