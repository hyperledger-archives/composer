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

/**
 * <p>
 * The ibm-concerto-admin module. Defines the administration API for Concerto.
 * </p>
 * <p>
 * Concerto is a framework for creating blockchain backed digital networks and
 * exchanging assets between participants via processing transactions.
 * </p>
 * @module ibm-concerto-admin
 */
module.exports.AdminConnection = require('./lib/adminconnection');

/**
 * Expose key concerto-common classes to simplify client application dependencies
 * @ignore
 */
module.exports.BusinessNetworkDefinition = require('@ibm/concerto-common').BusinessNetworkDefinition;
