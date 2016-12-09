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

exports.command = 'network <subcommand>';
exports.desc = 'Concerto network command';
exports.builder = function (yargs) {
   // apply commands in subdirectories
    return yargs.commandDir('network');
};
exports.handler = function (argv) {};
