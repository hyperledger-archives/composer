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
import { BusinessNetworkDefinition, AclFile } from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import {
    HttpModule,
    Response,
    ResponseOptions,
    XHRBackend
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

describe('SampleBusinessNetworkService', () => {

    let adminMock;
    let clientMock;
    let aclFileMock;
    let alertMock;
    let businessNetworkMock = sinon.createStubInstance(BusinessNetworkDefinition);
    let sandbox;
    let identityCardMock;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        identityCardMock = sinon.createStubInstance(IdentityCardService);
        adminMock = sinon.createStubInstance(AdminService);
        clientMock = sinon.createStubInstance(ClientService);
        aclFileMock = sinon.createStubInstance(AclFile);
        alertMock = sinon.createStubInstance(AlertService);

        alertMock.busyStatus$ = {next: sinon.stub()};

        TestBed.configureTestingModule({
            imports: [HttpModule],
            providers: [SampleBusinessNetworkService,
                {provide: AlertService, useValue: alertMock},
                {provide: AdminService, useValue: adminMock},
                {provide: ClientService, useValue: clientMock},
                {provide: AclFile, useValue: aclFileMock},
                {provide: XHRBackend, useClass: MockBackend},
                {provide: IdentityCardService, useValue: identityCardMock}]
        });
    });

    afterEach(() => {
        sandbox.restore();
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
                    error.message.should.equal('some error');
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
        it('should deploy the business network definition', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let metaData = {getPackageJson: sinon.stub().returns({})};
            businessNetworkMock.getMetadata.returns(metaData);
            let buildStub = sinon.stub(service, 'buildNetwork').returns({getName: sinon.stub()});
            adminMock.connectWithoutNetwork.returns(Promise.resolve());
            adminMock.install.returns(Promise.resolve());
            adminMock.start.returns(Promise.resolve());

            identityCardMock.getCurrentIdentityCard.returns({
                getRoles: sinon.stub().returns(['PeerAdmin']),
                getConnectionProfile: sinon.stub().returns({name: 'myProfile'})
            });

            identityCardMock.getQualifiedProfileName.returns('1234');

            identityCardMock.getIdentityCardRefsWithProfileAndRole.returns('4321');

            identityCardMock.setCurrentIdentityCard.returns(Promise.resolve());

            clientMock.refresh.returns(Promise.resolve());

            service.deployBusinessNetwork(businessNetworkMock, 'myNetwork', 'myDescription');

            tick();

            metaData.getPackageJson.should.have.been.called;

            buildStub.should.have.been.calledWith('myNetwork', 'myDescription', sinon.match.object, sinon.match.any);
            identityCardMock.getIdentityCardRefsWithProfileAndRole.should.have.been.calledWith('1234', 'ChannelAdmin');
            identityCardMock.getCurrentIdentityCard.should.have.been.called;

            adminMock.connectWithoutNetwork.should.have.been.calledTwice;
            adminMock.connectWithoutNetwork.should.have.been.calledWith(true);

            adminMock.install.should.have.been.called;
            adminMock.start.should.have.been.called;

            clientMock.refresh.should.have.been.called;
            clientMock.reset.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let metaData = {getPackageJson: sinon.stub().returns({})};
            businessNetworkMock.getMetadata.returns(metaData);

            let buildStub = sinon.stub(service, 'buildNetwork').returns({getName: sinon.stub()});

            identityCardMock.getCurrentIdentityCard.returns({
                getRoles: sinon.stub().returns(['PeerAdmin']),
            });

            adminMock.connectWithoutNetwork.returns(Promise.reject('some error'));

            service.deployBusinessNetwork(businessNetworkMock, 'myNetwork', 'myDescription')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                    error.should.equal('some error');
                });

            tick();

            metaData.getPackageJson.should.have.been.called;

            buildStub.should.have.been.calledWith('myNetwork', 'myDescription', sinon.match.object, sinon.match.any);
            adminMock.connectWithoutNetwork.should.have.been.calledWith(true);
        })));

        it('should fail if doesn\'t have the current identity set to one with peerAdmin pole', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let metaData = {getPackageJson: sinon.stub().returns({})};

            businessNetworkMock.getMetadata.returns(metaData);

            let buildStub = sinon.stub(service, 'buildNetwork').returns({getName: sinon.stub()});

            identityCardMock.getCurrentIdentityCard.returns({
                getRoles: sinon.stub().returns([]),
            });

            service.deployBusinessNetwork(businessNetworkMock, 'myNetwork', 'myDescription')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.should.equal('The current identity does not have the role PeerAdmin, this role is required to install the business network');
                });

            tick();

            metaData.getPackageJson.should.have.been.called;
            buildStub.should.have.been.calledWith('myNetwork', 'myDescription', sinon.match.object, sinon.match.any);
            adminMock.connectWithoutNetwork.should.not.have.been.called;
        })));
    });

    describe('updateBusinessNetwork', () => {
        it('should update the business network definition', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.update.returns(Promise.resolve());
            adminMock.connect.returns(Promise.resolve());
            clientMock.refresh.returns(Promise.resolve());
            clientMock.getBusinessNetworkName.returns('myNetwork');
            clientMock.getBusinessNetworkDescription.returns('myDescription');

            let buildStub = sinon.stub(service, 'buildNetwork').returns({getName: sinon.stub()});

            let metaData = {getPackageJson: sinon.stub().returns({})};
            businessNetworkMock.getMetadata.returns(metaData);

            service.updateBusinessNetwork(businessNetworkMock);

            tick();

            metaData.getPackageJson.should.have.been.called;

            buildStub.should.have.been.called;

            adminMock.connect.should.have.been.calledWith('myNetwork', true);
            adminMock.update.should.have.been.called;
            clientMock.refresh.should.have.been.called;
            clientMock.reset.should.have.been.called;
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            clientMock.getBusinessNetworkName.returns('myNetwork');
            clientMock.getBusinessNetworkDescription.returns('myDescription');

            let buildStub = sinon.stub(service, 'buildNetwork').returns({getName: sinon.stub()});

            adminMock.connect.returns(Promise.resolve());
            adminMock.update.returns(Promise.reject('some error'));

            service.updateBusinessNetwork(businessNetworkMock).then(() => {
                throw('should not get here');
            })
                .catch((error) => {
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                    error.should.equal('some error');
                });

            tick();

            buildStub.should.have.been.called;

            adminMock.connect.should.have.been.calledWith('myNetwork', true);
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
