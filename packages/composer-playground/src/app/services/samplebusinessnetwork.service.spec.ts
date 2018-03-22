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
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import { SampleBusinessNetworkService } from './samplebusinessnetwork.service';
import { AlertService } from '../basic-modals/alert.service';
import { IdentityCardService } from './identity-card.service';
import { AdminService } from './admin.service';
import { ClientService } from './client.service';
import { BusinessNetworkDefinition, AclFile, Serializer, Factory, ModelManager, IdCard } from 'composer-common';
import { FileService } from './file.service';

import {
    HttpModule,
    Response,
    ResponseOptions,
    XHRBackend
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

describe('SampleBusinessNetworkService', () => {

    let adminMock;
    let clientMock;
    let aclFileMock;
    let alertMock;
    let businessNetworkMock;
    let sandbox;
    let identityCardMock;
    let mockFileService;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        identityCardMock = sinon.createStubInstance(IdentityCardService);
        adminMock = sinon.createStubInstance(AdminService);
        clientMock = sinon.createStubInstance(ClientService);
        clientMock.filterModelFiles.returns([]);
        aclFileMock = sinon.createStubInstance(AclFile);
        alertMock = sinon.createStubInstance(AlertService);
        businessNetworkMock = new BusinessNetworkDefinition('test-network@1.0.0');
        mockFileService = sinon.createStubInstance(FileService);

        alertMock.busyStatus$ = {next: sinon.stub()};

        TestBed.configureTestingModule({
            imports: [HttpModule],
            providers: [SampleBusinessNetworkService,
                {provide: AlertService, useValue: alertMock},
                {provide: AdminService, useValue: adminMock},
                {provide: ClientService, useValue: clientMock},
                {provide: FileService, useValue: mockFileService},
                {provide: AclFile, useValue: aclFileMock},
                {provide: XHRBackend, useClass: MockBackend},
                {provide: IdentityCardService, useValue: identityCardMock}]
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('createNewBusinessDefinition', () => {
        it('should pass through and call createNewBusinessDefinition from common', inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            sinon.restore(businessNetworkMock);

            let name = 'myname';
            let nameversion = 'myname@0.0.1';
            let desc = 'my description';

            let busNetDef = service.createNewBusinessDefinition(nameversion, desc, null, null);
            busNetDef.getName().should.equal(name);
            busNetDef.getDescription().should.equal(desc);
            busNetDef.getVersion().should.equal('0.0.1');
        }));
    });

    describe('getSampleList', () => {
        it('should get the list of sample networks', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: [{name: 'bob'}]
                })));
            });

            service.getSampleList().then((result) => {
                result.should.deep.equal([{name: 'bob'}]);
            });

            tick();
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            mockBackend.connections.subscribe((connection) => {
                connection.mockError(new Error('some error'));
            });

            service.getSampleList()
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.should.match(/Error connecting to/);
                });

            tick();
        })));
    });

    describe('getChosenSample', () => {
        it('should deploy the chosen sample', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            let businessNetworkFromArchiveMock = sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(Promise.resolve({name: 'myNetwork'}));

            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: '1234'
                })));
            });

            service.getChosenSample({name: 'bob'}).then((result: any) => {
                result.should.deep.equal({name: 'myNetwork'});
            });

            tick();

            businessNetworkFromArchiveMock.should.have.been.called;

        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            let businessNetworkFromArchiveMock = sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(Promise.resolve({name: 'myNetwork'}));

            mockBackend.connections.subscribe((connection) => {
                connection.mockError(new Error('some error'));
            });

            service.getChosenSample({name: 'bob'})
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.message.should.equal('some error');
                });

            tick();

            businessNetworkFromArchiveMock.should.not.have.been.called;
        })));
    });

    describe('deployBusinessNetwork', () => {
        let peerCard;
        let channelCard;
        let metaData;
        let buildStub;
        let getPackageJsonSpy;

        beforeEach(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.connect.returns(Promise.resolve());
            adminMock.install.returns(Promise.resolve());
            adminMock.importCard.returns(Promise.resolve());

            adminMock.hasCard.returns(Promise.resolve(false));

            clientMock.refresh.returns(Promise.resolve());

            identityCardMock.getCurrentCardRef.returns('peerRef');

            identityCardMock.getQualifiedProfileName.returns('1234');

            identityCardMock.getIdentityCardRefsWithProfileAndRole.returns(['channelRef']);

            peerCard = new IdCard({userName: 'peer'}, {'x-type': 'web', 'name': 'myProfile'});
            identityCardMock.getIdentityCard.withArgs('peerRef').returns(peerCard);

            channelCard = new IdCard({userName: 'channel'}, {'x-type': 'web', 'name': 'myProfile'});
            identityCardMock.getIdentityCard.withArgs('channelRef').returns(channelCard);

            getPackageJsonSpy = sinon.spy(businessNetworkMock.getMetadata(), 'getPackageJson');
        }));

        it('should deploy the business network definition with default user', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let createdCardMap = new Map<string, IdCard>();
            let createdCard = new IdCard({
                userName: 'admin',
                enrollmentSecret: 'adminpw',
                businessNetwork: 'my-network'
            }, {'name': 'myProfile', 'x-type': 'hlfv1'});
            createdCardMap.set('admin', createdCard);
            adminMock.start.returns(Promise.resolve(createdCardMap));

            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'my-network', 'myDescription', null, null, null);

            tick();

            getPackageJsonSpy.should.have.been.called;

            identityCardMock.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234', 'ChannelAdmin');

            adminMock.connect.should.have.been.calledTwice;
            adminMock.connect.firstCall.should.have.been.calledWith('peerRef', peerCard, true);
            adminMock.connect.secondCall.should.have.been.calledWith('channelRef', channelCard, true);

            adminMock.install.should.have.been.called;
            adminMock.start.should.have.been.called;
            adminMock.start.should.have.been.calledWith('my-network', sinon.match.string, {
                networkAdmins: [{
                    userName: 'admin',
                    enrollmentSecret : 'adminpw'
                }]
            });
            adminMock.importCard.should.have.been.calledWith('myCardName', createdCard);

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should deploy the business network definition with id and secret', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let createdCardMap = new Map<string, IdCard>();
            let createdCard = new IdCard({
                userName: 'myUserId',
                enrollmentSecret: 'adminpw',
                businessNetwork: 'my-network'
            }, {'name': 'myProfile', 'x-type': 'hlfv1'});
            createdCardMap.set('myUserId', createdCard);
            adminMock.start.returns(Promise.resolve(createdCardMap));

            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'my-network', 'myDescription', 'myUserId', 'mySecret', null);

            tick();

            getPackageJsonSpy.should.have.been.called;

            identityCardMock.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234', 'ChannelAdmin');

            adminMock.connect.should.have.been.calledTwice;
            adminMock.connect.firstCall.should.have.been.calledWith('peerRef', peerCard, true);
            adminMock.connect.secondCall.should.have.been.calledWith('channelRef', channelCard, true);

            adminMock.install.should.have.been.called;
            adminMock.start.should.have.been.called;
            adminMock.start.should.have.been.calledWith('my-network', sinon.match.string, {
                networkAdmins: [{
                    userName: 'myUserId',
                    enrollmentSecret: 'mySecret'
                }]
            });

            adminMock.importCard.should.have.been.calledWith('myCardName', createdCard);

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should deploy the business network definition with credentials', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let createdCardMap = new Map<string, IdCard>();
            let createdCard = new IdCard({
                userName: 'myUserId',
                businessNetwork: 'my-network'
            }, {'name': 'myProfile', 'x-type': 'hlfv1'});

            createdCard.setCredentials({
                certificate: 'myCert',
                privatekey: 'myKey'
            });

            createdCardMap.set('myUserId', createdCard);
            adminMock.start.returns(Promise.resolve(createdCardMap));

            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'my-network', 'myDescription', 'myUserId', null, {
                certificate: 'myCert',
                key: 'myKey'
            });

            tick();

            getPackageJsonSpy.should.have.been.called;

            identityCardMock.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234', 'ChannelAdmin');

            adminMock.connect.should.have.been.calledTwice;
            adminMock.connect.firstCall.should.have.been.calledWith('peerRef', peerCard, true);
            adminMock.connect.secondCall.should.have.been.calledWith('channelRef', channelCard, true);

            adminMock.install.should.have.been.called;
            adminMock.start.should.have.been.called;
            adminMock.start.should.have.been.calledWith('my-network', sinon.match.string, {
                networkAdmins: [{
                    userName: 'myUserId',
                    certificate: 'myCert'
                }]
            });

            adminMock.importCard.should.have.been.calledWith('myCardName', createdCard);

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.install.returns(Promise.reject('some error'));

            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'my-network', 'myDescription', null, null, null)
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                    error.should.deep.equal('some error');
                });

            tick();

            getPackageJsonSpy.should.have.been.called;
        })));

        it('should throw error if card exists', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.hasCard.returns(Promise.resolve(true));

            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'my-network', 'myDescription', 'myUserId', 'mySecret', null)
                .then((cardRef) => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.message.should.equal('Card already exists: myCardName');
                });

            tick();

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));
    });

    describe('updateBusinessNetwork', () => {
        let idCard;
        let getPackageJsonSpy;

        beforeEach(() => {
            idCard = new IdCard({userName: 'banana'}, {'x-type': 'web', 'name': 'myProfile'});
            identityCardMock.getCurrentIdentityCard.returns(idCard);
            identityCardMock.getCurrentCardRef.returns('myCardRef');
            getPackageJsonSpy = sinon.spy(businessNetworkMock.getMetadata(), 'getPackageJson');

            identityCardMock.getIdentityCardRefsWithProfileAndRole.returns(['channelRef']);

            const channelCard = new IdCard({userName: 'channel'}, {'x-type': 'web', 'name': 'myProfile'});
            identityCardMock.getIdentityCard.withArgs('channelRef').returns(channelCard);

        });

        it('should update the business network definition', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.upgrade.returns(Promise.resolve());
            adminMock.connect.returns(Promise.resolve());
            clientMock.refresh.returns(Promise.resolve());
            mockFileService.getBusinessNetworkName.returns('my-network');
            mockFileService.getBusinessNetworkDescription.returns('myDescription');

            service.upgradeBusinessNetwork(businessNetworkMock);

            tick();

            getPackageJsonSpy.should.have.been.called;

            adminMock.connect.should.have.been.calledWith('myCardRef', idCard, true);
            adminMock.upgrade.should.have.been.called;
            clientMock.refresh.should.have.been.called;
            adminMock.reset.should.have.been.calledWith(businessNetworkMock.getName());
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            mockFileService.getBusinessNetworkName.returns('my-network');
            mockFileService.getBusinessNetworkDescription.returns('myDescription');

            adminMock.connect.returns(Promise.resolve());
            adminMock.upgrade.returns(Promise.reject('some error'));

            service.upgradeBusinessNetwork(businessNetworkMock).then(() => {
                throw('should not get here');
            })
                .catch((error) => {
                    console.log(error);
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                    error.should.equal('some error');
                });

            tick();

            getPackageJsonSpy.should.have.been.called;

            adminMock.connect.should.have.been.calledWith('myCardRef', idCard, true);
            adminMock.upgrade.should.have.been.called;
        })));
    });

    describe('buildNetwork', () => {
        let addModelFilesStub;
        let addScriptStub;
        let setAclFileStub;
        let setQueryfileSpy;

        beforeEach(() => {
            sinon.stub(businessNetworkMock.getScriptManager(), 'getScripts').returns(['script']);

            addModelFilesStub = sinon.stub(businessNetworkMock.getModelManager(), 'addModelFiles');
            addScriptStub = sinon.stub(businessNetworkMock.getScriptManager(), 'addScript');
            setAclFileStub = sinon.stub(businessNetworkMock.getAclManager(), 'setAclFile');
            setQueryfileSpy = sinon.stub(businessNetworkMock.getQueryManager(), 'setQueryFile');
        });

        it('should build the network', inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            sinon.stub(businessNetworkMock.getAclManager(), 'getAclFile').returns('acl');
            sinon.stub(businessNetworkMock.getQueryManager(), 'getQueryFile').returns('query');
            let mockCreateBN = sinon.stub(service, 'createNewBusinessDefinition').returns(businessNetworkMock);

            service['buildNetwork']('my-network', 'myDescription', {}, businessNetworkMock);

            mockCreateBN.should.have.been.called;
            clientMock.filterModelFiles.should.have.been.called;

            addModelFilesStub.should.have.been.called;
            addScriptStub.should.have.been.called;
            setAclFileStub.should.have.been.called;
            setQueryfileSpy.should.have.been.called;
        }));

        it('should build the network without query and acl files', inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let mockCreateBN = sinon.stub(service, 'createNewBusinessDefinition').returns(businessNetworkMock);

            service['buildNetwork']('my-network', 'myDescription', {}, businessNetworkMock);

            mockCreateBN.should.have.been.called;
            clientMock.filterModelFiles.should.have.been.called;

            addModelFilesStub.should.have.been.called;
            addScriptStub.should.have.been.called;
            setAclFileStub.should.not.have.been.called;
            setQueryfileSpy.should.not.have.been.called;
        }));
    });
});
