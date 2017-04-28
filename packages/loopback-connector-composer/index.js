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

const BusinessNetworkConnector = require('./lib/businessnetworkconnector');
const debug = require('debug')('loopback:connector:composer');

/**
 * Create a new instance of the connector class.
 * @param {Object} settings the settings provided by Loopback.
 * @return {BusinessNetworkConnector} a new instance of the connector.
 */
function createConnector(settings) {
    debug('createConnector');
    return new BusinessNetworkConnector(settings);
}

module.exports.createConnector = createConnector;

/**
 * Initialize is called by Loopback to create a new instance of the connector and
 * attach it to the specified data source.
 * @param {Object} dataSource the Loopback data source.
 * @param {function} callback the callback to call when complete.
 */
function initialize(dataSource, callback) {
    debug('initialize');
    let settings = dataSource.settings || {};
    let connector = module.exports.createConnector(settings);
    dataSource.connector = connector;
    if (callback) {
        dataSource.connecting = true;
        dataSource.connector.connect(callback);
    }
}

module.exports.initialize = initialize;
