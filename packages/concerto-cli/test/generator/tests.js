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

const Client = require('@ibm/concerto-client');
// const Admin = require('@ibm/concerto-admin');
const Common = require('@ibm/concerto-common');
const BusinessNetworkConnection = Client.BusinessNetworkConnection;
const BusinessNetworkDefinition = Common.BusinessNetworkDefinition;
const Serializer = Common.Serializer;
const Resource = Common.Resource;
const ModelManager = Common.ModelManager;
const ModelFile = Common.ModelFile;
const TransactionDeclaration = Common.TransactionDeclaration;

const Tests = require('../../lib/cmds/generator/lib/tests');
const CmdUtil = require('../../lib/cmds/utils/cmdutils');

const path = require('path');
const fs = require('fs');
const sinon = require('sinon');
const chai = require('chai');
require('sinon-as-promised');
let expect = chai.expect;

// const BUSINESS_NETWORK_NAME = 'net.biz.TestNetwork-0.0.1';
// const DEFAULT_PROFILE_NAME = 'defaultProfile';
const ENROLL_ID = 'SuccessKid';
const ENROLL_SECRET = 'SuccessKidWin';

const TEMPLATES_DIR = path.join(__dirname, './../../gen');

describe('concerto generator tests CLI unit tests', () => {

    let sandbox;
    let mockBusinessNetworkConnection;
    let mockBusinessNetworkDefinition;
    let mockBusinessNetwork;
    let mockModelManager;
    let mockModelFile;
    let mockTransactionDeclaration;
    let mockSerializer;
    let mockResource;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockModelManager = sinon.createStubInstance(ModelManager);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockTransactionDeclaration = sinon.createStubInstance(TransactionDeclaration);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockResource = sinon.createStubInstance(Resource);

        mockBusinessNetworkConnection.getBusinessNetwork.returns(mockBusinessNetwork);
        mockBusinessNetworkConnection.connect.resolves();
        mockBusinessNetworkDefinition.getModelManager.resolves(mockModelManager);

        mockBusinessNetwork.getSerializer.returns(mockSerializer);

        mockModelManager.getModelFiles.returns([mockModelFile]);

        mockModelFile.getNamespace.returns('the.namespace');
        mockModelFile.getAssetDeclarations.returns([]);
        mockModelFile.getTransactionDeclarations.returns([mockTransactionDeclaration]);

        mockTransactionDeclaration.getName.returns('transactionName');
        mockTransactionDeclaration.getProperties.returns([]);

        mockSerializer.fromJSON.returns(mockResource);

        mockResource.getIdentifier.returns('SuccessKid');

        sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
        sandbox.stub(CmdUtil, 'createBusinessNetworkConnection').returns(mockBusinessNetworkConnection);

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#readFile()', () => {
        it('should read the correct contents of a file', () => {
            return Tests.readFile(TEMPLATES_DIR + '/ittemplate')
            .then((contents) => {
                contents.should.equal(fs.readFileSync(TEMPLATES_DIR + '/ittemplate', 'utf8'));
            });
        });
    });

    describe('#writeFile()', () => {
        it('should write the correct contents to a file', () => {
            let file = fs.readFileSync(TEMPLATES_DIR + '/ittemplate', 'utf8');

            return Tests.writeFile(TEMPLATES_DIR + '/tmp', file)
            .then(() => {
                let contents = fs.readFileSync(TEMPLATES_DIR + '/tmp', 'utf8');
                contents.should.equal(file);
            })
            .then(() => {
                return fs.unlinkSync(TEMPLATES_DIR + '/tmp');
            });
        });
    });

    describe('#getDescribeBlock()', () => {
        it('should return the correct template', () => {
            Tests.getDescribeBlock('My Describe Block').should.equal('describe(\'My Describe Block\', () => {{{tests}}})');
        });
    });

    describe('#getTransactionItBlock()', () => {
        it('should return the the correct transaction \'it\' block', () => {
            return Tests.getTransactionItBlock('Test', 'test', 'test', 'test', 'test')
            .then((contents) => {
                contents.should.equal(
                    `// TODO: Complete Test unit test
it('Test'/*, function() {
    let transaction = "test";

    let businessNetwork = businessNetworkConnection.getBusinessNetwork();
    let serializer = businessNetwork.getSerializer();

    let resource = serializer.fromJSON(transaction);
    return businessNetworkConnection.submitTransaction(resource)
    .then(() => {
        console.log('transaction complete');
    })
    .catch((err) => {
        console.log(err);
    });
}*/);
`);
            });
        });
    });

    describe('#handler', () => {

        let readFileStub;

        before(() => {
            sinon.stub(Tests, 'readFile').resolves('File');
            sinon.stub(Tests, 'writeFile').resolves();
        });

        beforeEach(() => {
            readFileStub = sandbox.stub(fs, 'readFile');
        });

        afterEach(() => {
            readFileStub.restore();
        });

        it('should not error when all requred params are specified', () => {
            sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);
            readFileStub.onCall(0).callsArgWith(1, null, 'ArchiveFile');

            let argv = {
                projectDir: path.join(__dirname, './../../'),
                networkArchiveLocation: 'test',
                enrollId: ENROLL_ID,
            };

            return Tests.handler(argv)
            .then((res) => {
                sinon.assert.calledWith(CmdUtil.prompt);
            });
        });

        it('should not error when all params are specified', () => {
            sandbox.stub(CmdUtil, 'prompt').resolves(ENROLL_SECRET);
            readFileStub.onCall(0).callsArgWith(1, null, 'ArchiveFile');

            let argv = {
                projectDir: path.join(__dirname, './../../'),
                networkArchiveLocation: 'test',
                enrollId: ENROLL_ID,
                enrollSecret: ENROLL_SECRET
            };

            return Tests.handler(argv)
            .then((res) => {

            })
            .catch((err) => {
                expect(err).to.be.null;
            });
        });
    });
});
