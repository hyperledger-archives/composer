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

const Concerto = require('..');

require('chai').should();

describe('Concerto', () => {

    it('should export all types required by Go', () => {
        Concerto.Container.should.be.a('function');
        Concerto.Context.should.be.a('function');
        Concerto.DataCollection.should.be.a('function');
        Concerto.DataService.should.be.a('function');
        Concerto.Engine.should.be.a('function');
        Concerto.IdentityService.should.be.a('function');
        Concerto.LoggingService.should.be.a('function');
    });

});
