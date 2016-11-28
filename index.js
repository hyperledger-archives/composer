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
 * IBM Concerto module. IBM Concerto is a framework for creating
 * blockchain backed digital networks and exchanging assets between participants
 * via processing transactions.
 * @module ibm-concerto-admin
 */
module.exports.AdminConnection = require('./lib/adminconnection');

/**
 * Expose key concerto-common classes to make simplify client application dependencies
 */
module.exports.BusinessNetworkDefinition = require('@ibm/ibm-concerto-common').BusinessNetworkDefinition;
