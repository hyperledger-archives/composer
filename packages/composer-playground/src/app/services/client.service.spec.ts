/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { ClientService } from './client.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();
let expect = chai.expect;

import { AdminService } from './admin.service';
import { AlertService } from '../basic-modals/alert.service';
import {
    BusinessNetworkDefinition,
    ModelFile,
    Script,
    AclFile,
    QueryFile,
    ConnectionProfileStore,
    Util
} from 'composer-common';
import { BusinessNetworkConnection } from 'composer-client';
import { FileService } from './file.service';
import { IdentityService } from './identity.service';
import { IdentityCardService } from './identity-card.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { ConnectionProfileStoreService } from './connectionProfileStores/connectionprofilestore.service';

describe('ClientService', () => {

    let sandbox;

    let adminMock;
    let alertMock;
    let businessNetworkDefMock;
    let identityServiceMock;
    let identityCardServiceMock;
    let businessNetworkConMock;
    let modelFileMock;
    let scriptFileMock;
    let aclFileMock;
    let queryFileMock;
    let mockLocalStorage;
    let connectionProfileStoreMock;
    let connectionProfileStoreServiceMock;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        businessNetworkDefMock = sinon.createStubInstance(BusinessNetworkDefinition);
        adminMock = sinon.createStubInstance(AdminService);
        alertMock = sinon.createStubInstance(AlertService);
        identityServiceMock = sinon.createStubInstance(IdentityService);
        identityCardServiceMock = sinon.createStubInstance(IdentityCardService);
        businessNetworkConMock = sinon.createStubInstance(BusinessNetworkConnection);
        modelFileMock = sinon.createStubInstance(ModelFile);
        scriptFileMock = sinon.createStubInstance(Script);
        aclFileMock = sinon.createStubInstance(AclFile);
        queryFileMock = sinon.createStubInstance(QueryFile);
        mockLocalStorage = sinon.createStubInstance(LocalStorageService);

        alertMock.errorStatus$ = {next: sinon.stub()};
        alertMock.busyStatus$ = {next: sinon.stub()};

        connectionProfileStoreMock = sinon.createStubInstance(ConnectionProfileStore);
        connectionProfileStoreServiceMock = sinon.createStubInstance(ConnectionProfileStoreService);
        connectionProfileStoreServiceMock.getConnectionProfileStore.returns(connectionProfileStoreMock);

        TestBed.configureTestingModule({
            providers: [ClientService,
                {provide: AdminService, useValue: adminMock},
                {provide: AlertService, useValue: alertMock},
                {provide: IdentityService, useValue: identityServiceMock},
                {provide: IdentityCardService, useValue: identityCardServiceMock},
                {provide: LocalStorageService, useValue: mockLocalStorage},
                {provide: ConnectionProfileStoreService, useValue: connectionProfileStoreServiceMock}]
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('createBusinessNetwork', () => {
        it('should pass through and call createNewBusinessDefinition from common', inject([ClientService], (service: ClientService) => {
            let name = 'myname';
            let nameversion = 'myname@0.0.1';
            let desc = 'my description';

            let busNetDef = service.createBusinessNetwork(nameversion, desc, null, null);
            busNetDef.getName().should.equal(name);
            busNetDef.getDescription().should.equal(desc);
            busNetDef.getVersion().should.equal('0.0.1');
        }));
    });

    describe('getBusinessNetworkConnection', () => {
        it('should get business network connection if set', inject([ClientService], (service: ClientService) => {
            service['businessNetworkConnection'] = businessNetworkConMock;
            let result = service.getBusinessNetworkConnection();

            result.should.deep.equal(businessNetworkConMock);
        }));

        it('should create a new business network connection if not set', inject([ClientService], (service: ClientService) => {
            let result = service.getBusinessNetworkConnection();

            result.should.be.an.instanceOf(BusinessNetworkConnection);
            (<any> result).connectionProfileStore.should.equal(connectionProfileStoreMock);
        }));
    });

    describe('getBusinessNetwork', () => {
        it('should get the buisness network', inject([ClientService], (service: ClientService) => {
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let result = service.getBusinessNetwork();

            result.should.deep.equal(businessNetworkDefMock);
        }));

        it('should create business network if it doesn\'t exist', inject([ClientService], (service: ClientService) => {
            businessNetworkConMock.getBusinessNetwork.returns(businessNetworkDefMock);
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            let result = service.getBusinessNetwork();

            businessNetworkConnectionMock.should.have.been.called;
            result.should.deep.equal(businessNetworkDefMock);
        }));
    });

    describe('ensureConnected', () => {
        beforeEach(() => {
            identityServiceMock.getCurrentConnectionProfile.returns({name: 'myProfile'});
            identityServiceMock.getCurrentUserName.returns('myId');
        });

        it('should return if connected when not forced', fakeAsync(inject([ClientService], (service: ClientService) => {
            service['isConnected'] = true;

            service.ensureConnected();

            identityServiceMock.getCurrentEnrollmentCredentials.should.not.have.been.called;
        })));

        it('should return if connecting', fakeAsync(inject([ClientService], (service: ClientService) => {
            service['connectingPromise'] = Promise.resolve();

            service.ensureConnected();

            identityServiceMock.getCurrentEnrollmentCredentials.should.not.have.been.called;
        })));

        it('should connect if not connected', fakeAsync(inject([ClientService], (service: ClientService) => {
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.resolve());
            let setBusinessNetworkMock = sinon.stub(service, 'setSavedBusinessNetworkName');
            businessNetworkDefMock.getName.returns('myNetwork');

            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            service.ensureConnected(null, false);

            tick();

            alertMock.busyStatus$.next.should.have.been.calledTwice;
            alertMock.busyStatus$.next.firstCall.should.have.been.calledWith({
                title: 'Establishing connection',
                text: 'Using the connection profile myProfile'
            });

            adminMock.connect.should.have.been.calledWith('myNetwork', false);

            refreshMock.should.have.been.calledWith('myNetwork');

            alertMock.busyStatus$.next.secondCall.should.have.been.calledWith(null);

            setBusinessNetworkMock.should.have.been.calledWith('myId');

            service['isConnected'].should.equal(true);
            should.not.exist(service['connectingPromise']);
        })));

        it('should connect if not connected to specified business network', fakeAsync(inject([ClientService], (service: ClientService) => {
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.resolve());
            let setBusinessNetworkMock = sinon.stub(service, 'setSavedBusinessNetworkName');

            businessNetworkDefMock.getName.returns('myNetwork');

            service.ensureConnected('myNetwork', false);

            tick();

            alertMock.busyStatus$.next.should.have.been.calledTwice;
            alertMock.busyStatus$.next.firstCall.should.have.been.calledWith({
                title: 'Establishing connection',
                text: 'Using the connection profile myProfile'
            });

            adminMock.connect.should.have.been.calledWith('myNetwork', false);

            refreshMock.should.have.been.calledWith('myNetwork');

            alertMock.busyStatus$.next.secondCall.should.have.been.calledWith(null);

            setBusinessNetworkMock.should.have.been.called;

            businessNetworkDefMock.getName.should.not.have.been.called;

            service['isConnected'].should.equal(true);
            should.not.exist(service['connectingPromise']);
        })));

        it('should connect if not connected with business network from local storage', fakeAsync(inject([ClientService], (service: ClientService) => {
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.resolve());

            let setBusinessNetworkMock = sinon.stub(service, 'setSavedBusinessNetworkName');
            let getBusinessNetworkMock = sinon.stub(service, 'getSavedBusinessNetworkName').returns('myNetwork');

            sinon.stub(service, 'getBusinessNetwork').throws();

            service.ensureConnected(null, false);

            tick();

            alertMock.busyStatus$.next.should.have.been.calledTwice;
            alertMock.busyStatus$.next.firstCall.should.have.been.calledWith({
                title: 'Establishing connection',
                text: 'Using the connection profile myProfile'
            });

            getBusinessNetworkMock.should.have.been.calledWith('myId');

            adminMock.connect.should.have.been.calledWith('myNetwork', false);

            refreshMock.should.have.been.calledWith('myNetwork');

            alertMock.busyStatus$.next.secondCall.should.have.been.calledWith(null);

            setBusinessNetworkMock.should.have.been.calledWith('myId');

            service['isConnected'].should.equal(true);
            should.not.exist(service['connectingPromise']);
        })));

        it('should send alert if error thrown', fakeAsync(inject([ClientService], (service: ClientService) => {
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.reject('forced error'));

            service.ensureConnected('myNetwork', false)
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.equal('forced error');
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                });
        })));

        it('should set connection variables if error thrown', fakeAsync(inject([ClientService], (service: ClientService) => {
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.reject('forced error'));
            alertMock.errorStatus$ = {next: sinon.stub()};

            service.ensureConnected('myNetwork', false)
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                    error.should.equal('forced error');
                    service['isConnected'].should.be.false;
                    expect(service['connectingPromise']).to.be.null;
                });
        })));

    });

    describe('refresh', () => {
        beforeEach(() => {
            identityServiceMock.getCurrentConnectionProfile.returns({name: 'myProfile'});
            identityServiceMock.getCurrentQualifiedProfileName.returns('xxx-myProfile');
            identityServiceMock.getCurrentEnrollmentCredentials.returns({secret: 'mySecret'});
            identityServiceMock.getCurrentUserName.returns('myUser');
        });

        it('should diconnect and reconnect the business network connection', fakeAsync(inject([ClientService], (service: ClientService) => {
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            businessNetworkConMock.disconnect.returns(Promise.resolve());

            service.refresh('myNetwork');

            tick();

            businessNetworkConMock.disconnect.should.have.been.calledOnce;
            businessNetworkConMock.connectWithDetails.should.have.been.calledOnce;
            businessNetworkConMock.connectWithDetails.should.have.been.calledWith('xxx-myProfile', 'myNetwork', 'myUser', 'mySecret');
            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Refreshing Connection',
                text: 'refreshing the connection to myProfile'
            });
        })));

        it('should diconnect and reconnect with no enrollment credentials', fakeAsync(inject([ClientService], (service: ClientService) => {
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            businessNetworkConMock.disconnect.returns(Promise.resolve());
            identityServiceMock.getCurrentEnrollmentCredentials.returns(null);

            service.refresh('myNetwork');

            tick();

            businessNetworkConMock.disconnect.should.have.been.calledOnce;
            businessNetworkConMock.connectWithDetails.should.have.been.calledOnce;
            businessNetworkConMock.connectWithDetails.should.have.been.calledWith('xxx-myProfile', 'myNetwork', 'myUser', null);
            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Refreshing Connection',
                text: 'refreshing the connection to myProfile'
            });
        })));
    });

    describe('getBusinessNetworkFromArchive', () => {
        it('should get a business network from an archive', fakeAsync(inject([ClientService], (service: ClientService) => {
            let buffer = Buffer.from('a buffer');

            let businessNetworkFromArchiveMock = sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(Promise.resolve({name: 'myNetwork'}));

            service.getBusinessNetworkFromArchive(buffer).then((result) => {
                result.should.deep.equal({name: 'myNetwork'});
            });

            tick();

            businessNetworkFromArchiveMock.should.have.been.calledWith(buffer);
        })));
    });

    describe('issueIdentity', () => {

        it('should generate and return an identity using internally held state information', fakeAsync(inject([ClientService], (service: ClientService) => {
            identityServiceMock.getCurrentConnectionProfile.returns({name: 'myProfile'});
            businessNetworkConMock.issueIdentity.returns(Promise.resolve({
                participant: 'uniqueName',
                userID: 'userId',
                options: {issuer: false, affiliation: undefined}
            }));
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);

            service.issueIdentity('userId', 'uniqueName', {issuer: false, affiliation: undefined}).then((identity) => {
                let expected = {
                    participant: 'uniqueName',
                    userID: 'userId',
                    options: {issuer: false, affiliation: undefined}
                };
                identity.should.deep.equal(expected);
            });

            tick();

            businessNetworkConnectionMock.should.have.been.called;
        })));

        it('should generate and return an identity, detecting blockchain.ibm.com URLs', fakeAsync(inject([ClientService], (service: ClientService) => {
            identityServiceMock.getCurrentConnectionProfile.returns({
                name: 'myProfile',
                membershipServicesURL: 'memberURL\.blockchain\.ibm\.com',
                peerURL: 'peerURL\.blockchain\.ibm\.com',
                eventHubURL: 'eventURL\.blockchain\.ibm\.com'
            });

            businessNetworkConMock.issueIdentity.returns(Promise.resolve({
                participant: 'uniqueName',
                userID: 'userId',
                options: {issuer: false, affiliation: 'group1'}
            }));

            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);

            service.issueIdentity('userId', 'uniqueName', {issuer: false, affiliation: undefined}).then((identity) => {
                let expected = {
                    participant: 'uniqueName',
                    userID: 'userId',
                    options: {issuer: false, affiliation: 'group1'}
                };
                identity.should.deep.equal(expected);
            });

            tick();

            businessNetworkConnectionMock.should.have.been.called;
        })));
    });

    describe('revokeIdentity', () => {
        it('should call the revokeIdentity() function for the relevant BusinessNetworkConnection', fakeAsync(inject([ClientService], (service: ClientService) => {
            let mockGetBusinessNetwork = sinon.stub(service, 'getBusinessNetworkConnection').returns({
                revokeIdentity: sinon.stub().returns(Promise.resolve())
            });

            service.revokeIdentity({fake: 'identity'});

            tick();

            mockGetBusinessNetwork().revokeIdentity.should.have.been.calledWith({fake: 'identity'});
        })));
    });

    describe('disconnect', () => {
        it('should disconnect', inject([ClientService], (service: ClientService) => {
            let businessNetworkMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            service.disconnect();

            service['isConnected'].should.equal(false);
            adminMock.disconnect.should.have.been.called;
            businessNetworkConMock.disconnect.should.have.been.called;
        }));
    });

    describe('getSavedBusinessNetworkName', () => {
        it('should get saved the business network name', inject([ClientService], (service: ClientService) => {
            service['getSavedBusinessNetworkName']('bob');

            mockLocalStorage.get.should.have.been.calledWith('currentBusinessNetwork:bob');
        }));
    });

    describe('setSavedBusinessNetworkName', () => {
        it('should save the business network name', inject([ClientService], (service: ClientService) => {
            businessNetworkDefMock.getName.returns('myNetwork');
            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);
            service['setSavedBusinessNetworkName']('bob');

            mockLocalStorage.set.should.have.been.calledWith('currentBusinessNetwork:bob', 'myNetwork');
        }));
    });

    describe('revokeIdentity', () => {
        it('should call the revokeIdentity() function for the relevant BusinessNetworkConnection', fakeAsync(inject([ClientService], (service: ClientService) => {
            let mockGetBusinessNetwork = sinon.stub(service, 'getBusinessNetworkConnection').returns({
                revokeIdentity: sinon.stub().returns(Promise.resolve())
            });

            service.revokeIdentity({fake: 'identity'});

            tick();

            mockGetBusinessNetwork().revokeIdentity.should.have.been.calledWith({fake: 'identity'});
        })));
    });

    describe('#filterModelFiles', () => {
        it('should filter passed model files', inject([ClientService], (service: ClientService) => {

            let mockFile0 = sinon.createStubInstance(ModelFile);
            mockFile0.isSystemModelFile.returns(true);
            let mockFile1 = sinon.createStubInstance(ModelFile);
            mockFile1.isSystemModelFile.returns(true);
            let mockFile2 = sinon.createStubInstance(ModelFile);
            mockFile2.isSystemModelFile.returns(false);
            let mockFile3 = sinon.createStubInstance(ModelFile);
            mockFile3.isSystemModelFile.returns(false);
            let mockFile4 = sinon.createStubInstance(ModelFile);
            mockFile4.isSystemModelFile.returns(true);

            let modelManagerMock = {
                getModelFiles: sinon.stub().returns([mockFile0, mockFile1, mockFile2, mockFile3, mockFile4]),
                addModelFiles: sinon.stub()
            };

            let aclManagerMock = {
                setAclFile: sinon.stub(),
                getAclFile: sinon.stub().returns(aclFileMock)
            };

            let scriptManagerMock = {
                getScripts: sinon.stub().returns([scriptFileMock, scriptFileMock]),
                addScript: sinon.stub()
            };

            let queryManagerMock = {
                setQueryFile: sinon.stub(),
                getQueryFile: sinon.stub().returns(queryFileMock)
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);
            businessNetworkDefMock.getAclManager.returns(aclManagerMock);
            businessNetworkDefMock.getQueryManager.returns(queryManagerMock);

            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let mockCreateBusinessNetwork = sinon.stub(service, 'createBusinessNetwork').returns(businessNetworkDefMock);
            mockFile3.isSystemModelFile.returns(true);

            let allFiles = [mockFile0, mockFile1, mockFile2, mockFile3];

            let filteredFiles = service['filterModelFiles'](allFiles);

            filteredFiles.length.should.be.equal(1);
        }));

    });

    describe('resolveTransactionRelationship', () => {
        let mockRegistry;

        beforeEach(() => {
            mockRegistry = {
                get: sinon.stub().returns({$class: 'myTransaction'})
            };

            businessNetworkConMock.getTransactionRegistry.returns(Promise.resolve(mockRegistry));
        });

        it('should resolve the transaction relationship', fakeAsync(inject([ClientService], (service: ClientService) => {
            let getBusinessNetworkConStub = sinon.stub(service, 'getBusinessNetworkConnection');

            let transaction = {
                getIdentifier: sinon.stub().returns('1234')
            };

            getBusinessNetworkConStub.returns(businessNetworkConMock);

            service.resolveTransactionRelationship(transaction).then((result) => {
                result.should.deep.equal({$class: 'myTransaction'});
            });

            tick();

            getBusinessNetworkConStub.should.have.been.called;
            businessNetworkConMock.getTransactionRegistry.should.have.been.called;
        })));
    });
});
