/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto CLI - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

exports.command = 'deploy <name> <url>';
exports.desc = 'Deploy a business network';
exports.builder = {};
exports.handler = function (argv) {
    console.log('Deploying a business network', argv.name, argv.url);
};
