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

const boot = require('loopback-boot');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const http = require('http');
const https = require('https');
const loopback = require('loopback');
const loopbackPassport = require('loopback-component-passport');
const path = require('path');
const session = require('express-session');
const Util = require('../lib/util');
const WebSocket = require('ws');

module.exports = function (composer) {

    // Ensure that the configuration has been provided.
    if (!composer) {
        throw new Error('composer not specified');
    }

    // Create the LoopBack application.
    const app = loopback();
    return new Promise((resolve, reject) => {

        // Store the composer configuration for the boot script to find
        app.set('composer', composer);

        // Load the model-config.json file; we want to make the visibility of the wallet
        // model dependent on whether or not the multiple user option has been specified.
        const models = require('./model-config.json');
        const multiuser = !!composer.multiuser;
        models.Card.public = multiuser;

        // Allow environment variable overrides for the datasources.json file.
        let dataSources = require('./datasources.json');
        if (process.env.COMPOSER_DATASOURCES) {
            dataSources = JSON.parse(process.env.COMPOSER_DATASOURCES);
        }

        // Call the boot process which will load all models and execute all boot scripts.
        const bootOptions = {
            appRootDir: __dirname,
            models: models,
            dataSources: dataSources,
            components: {
                'loopback-component-explorer': {
                    mountPath: '/explorer',
                    uiDirs: [
                        path.resolve(__dirname, '..', 'public')
                    ]
                }
            }
        };
        boot(app, bootOptions, (error) => {
            if (error) {
                return reject(error);
            }
            resolve(composer);
        });

    })
    .then((composer) => {

        // Set the port if one was specified.
        const protocol = composer.tls ? 'https' : 'http';
        if (composer.port) {
            app.set('port', composer.port);
        }
        const port = app.get('port');
        app.set('url', `${protocol}://localhost:${port}/`);

        // Support JSON encoded bodies.
        app.middleware('parse', bodyParser.json());

        // Support URL encoded bodies.
        app.middleware('parse', bodyParser.urlencoded({
            extended: true,
        }));

        // The following configuration is only required if the authentication option has been specified.
        const authentication = !!composer.authentication;
        if (authentication) {

            // Enable the use of access tokens to identify users.
            app.middleware('auth', loopback.token({
                model: app.models.accessToken
            }));

            // Enable to the use of cookie based sessions.
            app.middleware('session:before', cookieParser(app.get('cookieSecret')));
            app.middleware('session', session({
                secret: 'kitty',
                saveUninitialized: true,
                resave: true,
            }));

            // Initialize Passport.
            const passportConfigurator = new loopbackPassport.PassportConfigurator(app);
            passportConfigurator.init();

            // Configure Passport with our customized user models.
            passportConfigurator.setupModels({
                userModel: app.models.user,
                userIdentityModel: app.models.userIdentity,
                userCredentialModel: app.models.userCredential,
            });

            // Load all of the Passport providers.
            let providers = require('./providers.json');
            if (process.env.COMPOSER_PROVIDERS) {
                providers = JSON.parse(process.env.COMPOSER_PROVIDERS);
            }
            for (let s in providers) {
                let c = providers[s];
                c.session = c.session !== false;
                c.profileToUser = Util.profileToUser;
                passportConfigurator.configureProvider(s, c);
            }

            // Add a GET handler for logging out.
            app.get('/auth/logout', function (req, res, next) {
                return Promise.resolve()
                    .then(() => {
                        if (req.accessToken) {
                            return app.models.user.logout(req.accessToken.id);
                        }
                    })
                    .then(() => {
                        req.logout();
                        res.clearCookie('access_token');
                        res.clearCookie('userId');
                        res.redirect('/');
                    });
            });

        }

        // Create the HTTP server.
        let server;
        const tls = !!composer.tls;
        if (tls) {
            const cert = fs.readFileSync(composer.tlscert, 'utf8');
            const key = fs.readFileSync(composer.tlskey, 'utf8');
            server = https.createServer({ cert, key }, app);
        } else {
            server = http.createServer(app);
        }

        // The following configuration is only required if WebSockets are enabled.
        const websockets = !!composer.websockets;
        if (websockets) {

            // Create a new WebSocket server that manages clients for us.
            const wss = new WebSocket.Server({
                server,
                clientTracking: true
            });

            // Add a broadcast method that sends data to all connected clients.
            wss.broadcast = (data) => {
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
            };

            // Store the WebSocket server for the boot script to find.
            app.set('wss', wss);

        }

        // Return the application and the server (both are needed to start the thing).
        return { app, server };

    });

};

// Start the server if run using `$ node server.js`. The preference
// is to use cli.js, but this will cater for any LoopBack experts.
// Unfortunately this bit is hard to unit test :-(
/* istanbul ignore next */
if (require.main === module) {
    const composerConfig = require('./composer.json');
    module.exports(composerConfig)
        .then((result) => {

            // Start the LoopBack application.
            const app = result.app, server = result.server;
            return server.listen(() => {
                app.emit('started');
                let baseUrl = app.get('url').replace(/\/$/, '');
                console.log('Web server listening at: %s', baseUrl);
                if (app.get('loopback-component-explorer')) {
                    let explorerPath = app.get('loopback-component-explorer').mountPath;
                    console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
                }
            });

        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
