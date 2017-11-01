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
        aclFileMock = sinon.createStubInstance(AclFile);
        alertMock = sinon.createStubInstance(AlertService);
        businessNetworkMock = sinon.createStubInstance(BusinessNetworkDefinition);
        mockFileService = sinon.createStubInstance(FileService);

        const modelManager = new ModelManager();
        const factory = new Factory(modelManager);
        const serializer = new Serializer(factory, modelManager);
        businessNetworkMock.getFactory.returns(factory);
        businessNetworkMock.getSerializer.returns(serializer);

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

    describe('generateBootstrapTransactions', () => {
        const sanitize = (result) => {
            result.forEach((tx) => {
                delete tx.timestamp;
                delete tx.transactionId;
                return tx;
            });
        };

        it('should generate bootstrap transactions for user default', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            const bootstrapTransactions = service.generateBootstrapTransactions(businessNetworkMock, 'doggoship1', null);
            sanitize(bootstrapTransactions);
            bootstrapTransactions.should.deep.equal([
                {
                    $class: 'org.hyperledger.composer.system.AddParticipant',
                    resources: [
                        {
                            $class: 'org.hyperledger.composer.system.NetworkAdmin',
                            participantId: 'doggoship1'
                        }
                    ],
                    targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin'
                },
                {
                    $class: 'org.hyperledger.composer.system.IssueIdentity',
                    participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#doggoship1',
                    identityName: 'doggoship1'
                }
            ]);
        })));

        it('should generate bootstrap transactions for non-default ', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            const bootstrapTransactions = service.generateBootstrapTransactions(businessNetworkMock, 'doggoship1', {certificate: 'myCert'});
            sanitize(bootstrapTransactions);

            bootstrapTransactions.should.deep.equal([
                {
                    $class: 'org.hyperledger.composer.system.AddParticipant',
                    resources: [
                        {
                            $class: 'org.hyperledger.composer.system.NetworkAdmin',
                            participantId: 'doggoship1'
                        }
                    ],
                    targetRegistry: 'resource:org.hyperledger.composer.system.ParticipantRegistry#org.hyperledger.composer.system.NetworkAdmin'
                },
                {
                    $class: 'org.hyperledger.composer.system.BindIdentity',
                    participant: 'resource:org.hyperledger.composer.system.NetworkAdmin#doggoship1',
                    certificate: 'myCert'
                }
            ]);
        })));
    });

    describe('deployBusinessNetwork', () => {
        let peerCard;
        let channelCard;
        let metaData;
        let buildStub;

        beforeEach(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            metaData = {getPackageJson: sinon.stub().returns({})};
            businessNetworkMock.getMetadata.returns(metaData);
            buildStub = sinon.stub(service, 'buildNetwork').returns({getName: sinon.stub().returns('myNetwork')});

            adminMock.connect.returns(Promise.resolve());
            adminMock.install.returns(Promise.resolve());
            adminMock.start.returns(Promise.resolve());

            identityCardMock.createIdentityCard.returns(Promise.resolve('newCardRef'));

            clientMock.refresh.returns(Promise.resolve());
            identityCardMock.createIdentityCard.returns(Promise.resolve('newCardRef'));

            identityCardMock.getCurrentCardRef.returns('peerRef');

            identityCardMock.getQualifiedProfileName.returns('1234');

            identityCardMock.getIdentityCardRefsWithProfileAndRole.returns(['channelRef']);

            peerCard = new IdCard({userName: 'peer'}, {type: 'web', name: 'myProfile'});
            identityCardMock.getIdentityCard.withArgs('peerRef').returns(peerCard);

            channelCard = new IdCard({userName: 'channel'}, {type: 'web', name: 'myProfile'});
            identityCardMock.getIdentityCard.withArgs('channelRef').returns(channelCard);
        }));

        it('should deploy the business network definition with default user', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'myNetwork', 'myDescription', null, null, null).then((cardRef) => {
                cardRef.should.equal('newCardRef');
            });

            tick();

            metaData.getPackageJson.should.have.been.called;

            buildStub.should.have.been.calledWith('myNetwork', 'myDescription', sinon.match.object, sinon.match.any);
            identityCardMock.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234', 'ChannelAdmin');

            adminMock.connect.should.have.been.calledTwice;
            adminMock.connect.firstCall.should.have.been.calledWith('peerRef', peerCard, true);
            adminMock.connect.secondCall.should.have.been.calledWith('channelRef', channelCard, true);

            adminMock.install.should.have.been.called;
            adminMock.start.should.have.been.called;
            adminMock.start.should.have.been.calledWith(sinon.match.object, sinon.match.object);

            identityCardMock.createIdentityCard.should.have.been.calledWith('admin', 'myCardName', 'myNetwork', 'adminpw', {
                name: 'myProfile',
                type: 'web'
            });

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should deploy the business network definition with id and secret', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'myNetwork', 'myDescription', 'myUserId', 'mySecret', null).then((cardRef) => {
                cardRef.should.equal('newCardRef');
            });

            tick();

            metaData.getPackageJson.should.have.been.called;

            buildStub.should.have.been.calledWith('myNetwork', 'myDescription', sinon.match.object, sinon.match.any);
            identityCardMock.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234', 'ChannelAdmin');

            adminMock.connect.should.have.been.calledTwice;
            adminMock.connect.firstCall.should.have.been.calledWith('peerRef', peerCard, true);
            adminMock.connect.secondCall.should.have.been.calledWith('channelRef', channelCard, true);

            adminMock.install.should.have.been.called;
            adminMock.start.should.have.been.called;
            adminMock.start.should.have.been.calledWith(sinon.match.object, sinon.match.object);

            identityCardMock.createIdentityCard.should.have.been.calledWith('myUserId', 'myCardName', 'myNetwork', 'mySecret', {
                name: 'myProfile',
                type: 'web'
            });

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should deploy the business network definition with credentials', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'myNetwork', 'myDescription', 'myUserId', null, {
                certificate: 'myCert',
                key: 'myKey'
            }).then((cardRef) => {
                cardRef.should.equal('newCardRef');
            });

            tick();

            metaData.getPackageJson.should.have.been.called;

            buildStub.should.have.been.calledWith('myNetwork', 'myDescription', sinon.match.object, sinon.match.any);
            identityCardMock.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234', 'ChannelAdmin');

            adminMock.connect.should.have.been.calledTwice;
            adminMock.connect.firstCall.should.have.been.calledWith('peerRef', peerCard, true);
            adminMock.connect.secondCall.should.have.been.calledWith('channelRef', channelCard, true);

            adminMock.install.should.have.been.called;
            adminMock.start.should.have.been.called;
            adminMock.start.should.have.been.calledWith(sinon.match.object, sinon.match.object);

            identityCardMock.createIdentityCard.should.have.been.calledWith('myUserId', 'myCardName', 'myNetwork', null, {
                name: 'myProfile',
                type: 'web'
            }, {
                certificate: 'myCert',
                key: 'myKey'
            });

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error when no card created', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            identityCardMock.createIdentityCard.returns(Promise.reject({message: 'some error'}));

            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'myNetwork', 'myDescription', null, null, null)
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                    error.should.deep.equal({message: 'some error'});
                });

            tick();

            metaData.getPackageJson.should.have.been.called;

            buildStub.should.have.been.calledWith('myNetwork', 'myDescription', sinon.match.object, sinon.match.any);
        })));

        it('should handle error when card created', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.connect.returns(Promise.reject({message: 'some error'}));
            identityCardMock.deleteIdentityCard.returns(Promise.resolve());

            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'myNetwork', 'myDescription', 'myUserId', 'mySecret', null).then((cardRef) => {
                throw new Error('should not get here');
            })
                .catch((error) => {
                    error.should.deep.equal({message: 'some error'});
                });

            tick();

            identityCardMock.createIdentityCard.should.have.been.calledWith('myUserId', 'myCardName', 'myNetwork', 'mySecret', {name: 'myProfile', type : 'web'});

            alertMock.busyStatus$.next.should.have.been.calledWith(null);

            identityCardMock.deleteIdentityCard.should.have.been.calledWith('newCardRef');
        })));

        it('should handle error when card created with delete problem', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.connect.returns(Promise.reject({message: 'some error'}));

            identityCardMock.deleteIdentityCard.returns(Promise.reject({message: 'another error'}));

            service.deployBusinessNetwork(businessNetworkMock, 'myCardName', 'myNetwork', 'myDescription', 'myUserId', 'mySecret', null).then((cardRef) => {
                throw new Error('should not get here');
            })
                .catch((error) => {
                    error.should.deep.equal({message: 'some error'});
                });

            tick();

            identityCardMock.createIdentityCard.should.have.been.calledWith('myUserId', 'myCardName', 'myNetwork', 'mySecret', {name: 'myProfile', type : 'web'});

            alertMock.busyStatus$.next.should.have.been.calledWith(null);

            identityCardMock.deleteIdentityCard.should.have.been.calledWith('newCardRef');
        })));
    });

    describe('updateBusinessNetwork', () => {
        let idCard;

        beforeEach(() => {
            idCard = new IdCard({userName: 'banana'}, {type: 'web', name: 'myProfile'});
            identityCardMock.getCurrentIdentityCard.returns(idCard);
            identityCardMock.getCurrentCardRef.returns('myCardRef');
        });

        it('should update the business network definition', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.update.returns(Promise.resolve());
            adminMock.connect.returns(Promise.resolve());
            clientMock.refresh.returns(Promise.resolve());
            mockFileService.getBusinessNetworkName.returns('myNetwork');
            mockFileService.getBusinessNetworkDescription.returns('myDescription');

            let buildStub = sinon.stub(service, 'buildNetwork').returns({getName: sinon.stub().returns('newname')});

            let metaData = {getPackageJson: sinon.stub().returns({})};
            businessNetworkMock.getMetadata.returns(metaData);
            businessNetworkMock.getMetadata.returns(metaData);

            service.updateBusinessNetwork(businessNetworkMock);

            tick();

            metaData.getPackageJson.should.have.been.called;

            buildStub.should.have.been.called;

            adminMock.connect.should.have.been.calledWith('myCardRef', idCard, true);
            adminMock.update.should.have.been.called;
            clientMock.refresh.should.have.been.called;
            adminMock.reset.should.have.been.calledWith('newname');
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            mockFileService.getBusinessNetworkName.returns('myNetwork');
            mockFileService.getBusinessNetworkDescription.returns('myDescription');

            let buildStub = sinon.stub(service, 'buildNetwork').returns({getName: sinon.stub()});

            adminMock.connect.returns(Promise.resolve());
            adminMock.update.returns(Promise.reject('some error'));

            let metaData = {getPackageJson: sinon.stub().returns({})};
            businessNetworkMock.getMetadata.returns(metaData);

            service.updateBusinessNetwork(businessNetworkMock).then(() => {
                throw('should not get here');
            })
                .catch((error) => {
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                    error.should.equal('some error');
                });

            tick();

            buildStub.should.have.been.called;

            adminMock.connect.should.have.been.calledWith('myCardRef', idCard, true);
            adminMock.update.should.have.been.called;
        })));
    });

    describe('buildNetwork', () => {
        it('should build the network', inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let modalManagerMock = {addModelFiles: sinon.stub(), getModelFiles: sinon.stub().returns(['model'])};
            let scriptManagerMock = {getScripts: sinon.stub().returns(['script']), addScript: sinon.stub()};
            let aclManagerMock = {getAclFile: sinon.stub().returns('acl'), setAclFile: sinon.stub()};
            let queryManagerMock = {getQueryFile: sinon.stub().returns('query'), setQueryFile: sinon.stub()};
            let metaData = {getREADME: sinon.stub()};

            businessNetworkMock.getModelManager.returns(modalManagerMock);
            businessNetworkMock.getScriptManager.returns(scriptManagerMock);
            businessNetworkMock.getAclManager.returns(aclManagerMock);
            businessNetworkMock.getQueryManager.returns(queryManagerMock);
            businessNetworkMock.getMetadata.returns(metaData);

            let mockCreateBN = sinon.stub(service, 'createNewBusinessDefinition').returns(businessNetworkMock);

            service['buildNetwork']('myNetwork', 'myDescription', {}, businessNetworkMock);

            metaData.getREADME.should.have.been.called;
            mockCreateBN.should.have.been.called;
            clientMock.filterModelFiles.should.have.been.called;

            modalManagerMock.addModelFiles.should.have.been.called;
            scriptManagerMock.addScript.should.have.been.called;
            aclManagerMock.setAclFile.should.have.been.called;
            queryManagerMock.setQueryFile.should.have.been.called;
        }));

        it('should build the network without query and acl files', inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let modalManagerMock = {addModelFiles: sinon.stub(), getModelFiles: sinon.stub().returns(['model'])};
            let scriptManagerMock = {getScripts: sinon.stub().returns(['script']), addScript: sinon.stub()};
            let aclManagerMock = {getAclFile: sinon.stub().returns(null), setAclFile: sinon.stub()};
            let queryManagerMock = {getQueryFile: sinon.stub().returns(null), setQueryFile: sinon.stub()};
            let metaData = {getREADME: sinon.stub()};

            businessNetworkMock.getModelManager.returns(modalManagerMock);
            businessNetworkMock.getScriptManager.returns(scriptManagerMock);
            businessNetworkMock.getAclManager.returns(aclManagerMock);
            businessNetworkMock.getQueryManager.returns(queryManagerMock);
            businessNetworkMock.getMetadata.returns(metaData);

            let mockCreateBN = sinon.stub(service, 'createNewBusinessDefinition').returns(businessNetworkMock);

            service['buildNetwork']('myNetwork', 'myDescription', {}, businessNetworkMock);

            metaData.getREADME.should.have.been.called;
            mockCreateBN.should.have.been.called;
            clientMock.filterModelFiles.should.have.been.called;

            modalManagerMock.addModelFiles.should.have.been.called;
            scriptManagerMock.addScript.should.have.been.called;
            aclManagerMock.setAclFile.should.not.have.been.called;
            queryManagerMock.setQueryFile.should.not.have.been.called;
        }));
    });
});
