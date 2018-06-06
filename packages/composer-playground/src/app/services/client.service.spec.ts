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
/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { ClientService } from './client.service';

import * as sinon from 'sinon';
import * as chai from 'chai';
import { AdminService } from './admin.service';
import { AlertService } from '../basic-modals/alert.service';
import {
    AclFile,
    BusinessNetworkCardStore,
    BusinessNetworkDefinition,
    IdCard,
    ModelFile,
    QueryFile,
    Script
} from 'composer-common';
import { BusinessNetworkConnection } from 'composer-client';
import { IdentityService } from './identity.service';
import { IdentityCardService } from './identity-card.service';
import { BusinessNetworkCardStoreService } from './cardStores/businessnetworkcardstore.service';

let should = chai.should();
let expect = chai.expect;

describe('ClientService', () => {

    let sandbox;

    let adminMock;
    let alertMock;
    let businessNetworkDefMock;
    let identityCardServiceMock;
    let businessNetworkConMock;
    let modelFileMock;
    let scriptFileMock;
    let aclFileMock;
    let queryFileMock;
    let mockCardStoreService;
    let idCard;
    let mockCardStore;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        businessNetworkDefMock = sinon.createStubInstance(BusinessNetworkDefinition);
        adminMock = sinon.createStubInstance(AdminService);
        alertMock = sinon.createStubInstance(AlertService);
        identityCardServiceMock = sinon.createStubInstance(IdentityCardService);
        businessNetworkConMock = sinon.createStubInstance(BusinessNetworkConnection);
        modelFileMock = sinon.createStubInstance(ModelFile);
        scriptFileMock = sinon.createStubInstance(Script);
        aclFileMock = sinon.createStubInstance(AclFile);
        queryFileMock = sinon.createStubInstance(QueryFile);
        mockCardStoreService = sinon.createStubInstance(BusinessNetworkCardStoreService);
        mockCardStore = sinon.createStubInstance(BusinessNetworkCardStore);

        alertMock.errorStatus$ = {next: sinon.stub()};
        alertMock.busyStatus$ = {next: sinon.stub()};

        idCard = new IdCard({userName: 'banana'}, {'x-type': 'web', 'name': '$default'});
        identityCardServiceMock.getCurrentIdentityCard.returns(idCard);
        identityCardServiceMock.getCurrentCardRef.returns('cardRef');

        mockCardStoreService.getBusinessNetworkCardStore.returns(mockCardStore);

        TestBed.configureTestingModule({
            providers: [ClientService,
                {provide: AdminService, useValue: adminMock},
                {provide: AlertService, useValue: alertMock},
                {provide: IdentityCardService, useValue: identityCardServiceMock},
                {provide: BusinessNetworkCardStoreService, useValue: mockCardStoreService}]
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
            (<any> result).cardStore.should.equal(mockCardStore);
        }));
    });

    describe('getBusinessNetwork', () => {
        it('should get the buisness network', inject([ClientService], (service: ClientService) => {
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let result = service.getBusinessNetwork();

            result.should.deep.equal(businessNetworkDefMock);
        }));

        it('should create business network if it doesn\'t exist', inject([ClientService], (service: ClientService) => {
            let metadataMock = {
                getVersion: sinon.stub().returns('1.0.0')
            };
            businessNetworkConMock.getBusinessNetwork.returns(businessNetworkDefMock);
            businessNetworkDefMock.getMetadata.returns(metadataMock);
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);

            let result = service.getBusinessNetwork();

            businessNetworkConnectionMock.should.have.been.called;
            result.should.deep.equal(businessNetworkDefMock);
        }));

        it('should retrieve the deployed business network version if it doesn\'t exist', inject([ClientService], (service: ClientService) => {
            let metadataMock = {
                getVersion: sinon.stub().returns('1.0.0')
            };
            businessNetworkConMock.getBusinessNetwork.returns(businessNetworkDefMock);
            businessNetworkDefMock.getMetadata.returns(metadataMock);
            sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);

            let result = service.getBusinessNetwork();

            metadataMock.getVersion.should.have.been.called;
            result.should.deep.equal(businessNetworkDefMock);
        }));
    });

    describe('getDeployedBusinessNetworkVersion', () => {
        it('should get the deployed business network version', inject([ClientService], (service: ClientService) => {
            service['deployedBusinessNetworkVersion'] = 'deployedVersion';

            let result = service.getDeployedBusinessNetworkVersion();

            result.should.equal('deployedVersion');
        }));

        it('should create business network if it doesn\'t exist', inject([ClientService], (service: ClientService) => {
            let metadataMock = {
                getVersion: sinon.stub().returns('deployedVersion')
            };
            businessNetworkConMock.getBusinessNetwork.returns(businessNetworkDefMock);
            businessNetworkDefMock.getMetadata.returns(metadataMock);
            sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);

            let result = service.getDeployedBusinessNetworkVersion();

            metadataMock.getVersion.should.have.been.called;
            result.should.equal('deployedVersion');
        }));
    });

    describe('ensureConnected', () => {
        it('should return if connected when not forced', fakeAsync(inject([ClientService], (service: ClientService) => {
            service['isConnected'] = true;

            service.ensureConnected();

            adminMock.connect.should.not.have.been.called;
        })));

        it('should return if connecting', fakeAsync(inject([ClientService], (service: ClientService) => {
            service['connectingPromise'] = Promise.resolve();

            service.ensureConnected();

            adminMock.connect.should.not.have.been.called;
        })));

        it('should connect if not connected', fakeAsync(inject([ClientService], (service: ClientService) => {
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.resolve());

            service.ensureConnected(false);

            tick();

            alertMock.busyStatus$.next.should.have.been.calledTwice;
            alertMock.busyStatus$.next.firstCall.should.have.been.calledWith({
                title: 'Establishing connection',
                text: 'Using the connection profile web',
                force: true
            });

            adminMock.connect.should.have.been.calledWith('cardRef', idCard, false);

            refreshMock.should.have.been.called;

            alertMock.busyStatus$.next.secondCall.should.have.been.calledWith(null);

            service['isConnected'].should.equal(true);
            should.not.exist(service['connectingPromise']);
        })));

        it('should connect if not connected to hlfv1 connection', fakeAsync(inject([ClientService], (service: ClientService) => {
            idCard = new IdCard({userName: 'banana'}, {'x-type': 'hlfv1', 'name': 'myProfile'});
            identityCardServiceMock.getCurrentIdentityCard.returns(idCard);

            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.resolve());

            service.ensureConnected(false);

            tick();

            alertMock.busyStatus$.next.should.have.been.calledTwice;
            alertMock.busyStatus$.next.firstCall.should.have.been.calledWith({
                title: 'Establishing connection',
                text: 'Using the connection profile myProfile',
                force: true
            });

            adminMock.connect.should.have.been.calledWith('cardRef', idCard, false);

            refreshMock.should.have.been.called;

            alertMock.busyStatus$.next.secondCall.should.have.been.calledWith(null);

            service['isConnected'].should.equal(true);
            should.not.exist(service['connectingPromise']);
        })));

        it('should send alert if error thrown', fakeAsync(inject([ClientService], (service: ClientService) => {
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.reject('forced error'));

            service.ensureConnected(false)
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

            service.ensureConnected(false)
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
        it('should diconnect and reconnect the business network connection', fakeAsync(inject([ClientService], (service: ClientService) => {
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            businessNetworkConMock.disconnect.returns(Promise.resolve());

            service.refresh();

            tick();

            businessNetworkConMock.disconnect.should.have.been.calledOnce;
            businessNetworkConMock.connect.should.have.been.calledOnce;
            businessNetworkConMock.connect.should.have.been.calledWith('cardRef');
            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Refreshing Connection',
                text: 'refreshing the connection to web',
                force: true
            });
        })));

        it('should diconnect and reconnect the business network connection with hlfv1 connection', fakeAsync(inject([ClientService], (service: ClientService) => {
            idCard = new IdCard({userName: 'banana'}, {'x-type': 'hlfv1', 'name': 'myProfile'});
            identityCardServiceMock.getCurrentIdentityCard.returns(idCard);

            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            businessNetworkConMock.disconnect.returns(Promise.resolve());

            service.refresh();

            tick();

            businessNetworkConMock.disconnect.should.have.been.calledOnce;
            businessNetworkConMock.connect.should.have.been.calledOnce;
            businessNetworkConMock.connect.should.have.been.calledWith('cardRef');
            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Refreshing Connection',
                text: 'refreshing the connection to myProfile',
                force: true
            });
        })));

        it('should diconnect and reconnect with no enrollment credentials', fakeAsync(inject([ClientService], (service: ClientService) => {
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            businessNetworkConMock.disconnect.returns(Promise.resolve());

            service.refresh();

            tick();

            businessNetworkConMock.disconnect.should.have.been.calledOnce;
            businessNetworkConMock.connect.should.have.been.calledOnce;
            businessNetworkConMock.connect.should.have.been.calledWith('cardRef');
            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Refreshing Connection',
                text: 'refreshing the connection to web',
                force: true
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
            idCard.connectionProfile = {
                name: 'myProfile',
                membershipServicesURL: 'memberURL\.blockchain\.ibm\.com',
                peerURL: 'peerURL\.blockchain\.ibm\.com',
                eventHubURL: 'eventURL\.blockchain\.ibm\.com'
            };

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
