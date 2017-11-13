/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { AdminService } from './admin.service';
import { IdCard } from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import { AlertService } from '../basic-modals/alert.service';
import { BusinessNetworkDefinition, ConnectionProfileStore } from 'composer-common';
import { IdentityService } from './identity.service';
import { AdminConnection } from 'composer-admin';
import { ConnectionProfileStoreService } from './connectionProfileStores/connectionprofilestore.service';

describe('AdminService', () => {

    let sandbox;

    let alertMock;
    let businessNetworkDefMock;
    let identityMock;

    let adminConnectionMock;

    let connectionProfileStoreMock;
    let connectionProfileStoreServiceMock;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        alertMock = sinon.createStubInstance(AlertService);
        businessNetworkDefMock = sinon.createStubInstance(BusinessNetworkDefinition);
        identityMock = sinon.createStubInstance(IdentityService);
        identityMock.getCurrentConnectionProfile.returns({name: 'myProfile'});
        identityMock.getCurrentQualifiedProfileName.returns('qpn-myProfile');
        identityMock.getCurrentEnrollmentCredentials.returns({secret: 'mySecret'});
        identityMock.getCurrentUserName.returns('myId');
        adminConnectionMock = sinon.createStubInstance(AdminConnection);

        alertMock.busyStatus$ = {
            next: sinon.stub()
        };

        alertMock.errorStatus$ = {
            next: sinon.stub()
        };

        connectionProfileStoreMock = sinon.createStubInstance(ConnectionProfileStore);
        connectionProfileStoreServiceMock = sinon.createStubInstance(ConnectionProfileStoreService);
        connectionProfileStoreServiceMock.getConnectionProfileStore.returns(connectionProfileStoreMock);

        TestBed.configureTestingModule({
            providers: [AdminService,
                {provide: AlertService, useValue: alertMock},
                {provide: IdentityService, useValue: identityMock},
                {provide: ConnectionProfileStoreService, useValue: connectionProfileStoreServiceMock}]
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getAdminConnection', () => {
        it('should get the admin connection if it exists', inject([AdminService], (service: AdminService) => {
            service['adminConnection'] = adminConnectionMock;

            let result = service.getAdminConnection();

            result.should.deep.equal(adminConnectionMock);
        }));

        it('should create a new admin connection if it does not exist', inject([AdminService], (service: AdminService) => {
            let result = service.getAdminConnection();

            result.should.be.an.instanceOf(AdminConnection);
            (<any> result).connectionProfileStore.should.equal(connectionProfileStoreMock);
        }));
    });

    describe('connect', () => {
        it('should return if connected', fakeAsync(inject([AdminService], (service: AdminService) => {
            service['isConnected'] = true;

            service.connect('myNetwork');

            tick();

            identityMock.getCurrentConnectionProfile.should.not.have.been.called;
        })));

        it('should return if connecting', fakeAsync(inject([AdminService], (service: AdminService) => {
            service['connectingPromise'] = Promise.resolve();

            service.connect('myNetwork');

            tick();

            identityMock.getCurrentConnectionProfile.should.not.have.been.called;
        })));

        it('should connect', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connectWithDetails.returns(Promise.resolve());
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.connect('myNetwork');

            tick();

            identityMock.getCurrentConnectionProfile.should.have.been.called;
            identityMock.getCurrentQualifiedProfileName.should.have.been.called;
            identityMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', 'mySecret', 'myNetwork');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect without enrollment credentials', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connectWithDetails.returns(Promise.resolve());
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);
            identityMock.getCurrentEnrollmentCredentials.returns(null);

            service.connect('myNetwork');

            tick();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', null, 'myNetwork');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect if forced', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connectWithDetails.returns(Promise.resolve());
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service['isConnected'] = true;

            service.connect('myNetwork', true);

            tick();

            identityMock.getCurrentConnectionProfile.should.have.been.called;
            identityMock.getCurrentQualifiedProfileName.should.have.been.called;
            identityMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', 'mySecret', 'myNetwork');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connectWithDetails.returns(Promise.reject('some error'));
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.connect('myNetwork')
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();

            identityMock.getCurrentConnectionProfile.should.have.been.called;
            identityMock.getCurrentQualifiedProfileName.should.have.been.called;
            identityMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', 'mySecret', 'myNetwork');

            service['isConnected'].should.equal(false);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));
    });

    describe('connectWithOutNetwork', () => {
        it('should return if connected', fakeAsync(inject([AdminService], (service: AdminService) => {
            service['isConnected'] = true;

            service.connectWithoutNetwork();

            tick();

            identityMock.getCurrentConnectionProfile.should.not.have.been.called;
        })));

        it('should return if connecting', fakeAsync(inject([AdminService], (service: AdminService) => {
            service['connectingPromise'] = Promise.resolve();

            service.connectWithoutNetwork();

            tick();

            identityMock.getCurrentConnectionProfile.should.not.have.been.called;
        })));

        it('should connect without an id', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);
            adminConnectionMock.connectWithDetails.returns(Promise.resolve());

            service.connectWithoutNetwork();

            tick();

            identityMock.getCurrentConnectionProfile.should.have.been.called;
            identityMock.getCurrentQualifiedProfileName.should.have.been.called;
            identityMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', 'mySecret');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect if forced', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);
            adminConnectionMock.connectWithDetails.returns(Promise.resolve());

            service['isConnected'] = true;

            service.connectWithoutNetwork(true);

            tick();

            identityMock.getCurrentConnectionProfile.should.have.been.called;
            identityMock.getCurrentQualifiedProfileName.should.have.been.called;
            identityMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', 'mySecret');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);
            adminConnectionMock.connectWithDetails.returns(Promise.reject('some error'));

            service.connectWithoutNetwork()
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();

            identityMock.getCurrentConnectionProfile.should.have.been.called;
            identityMock.getCurrentQualifiedProfileName.should.have.been.called;
            identityMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', 'mySecret');

            service['isConnected'].should.equal(false);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));
    });

    describe('createNewBusinessNetwork', () => {
        it('should create a new business network', fakeAsync(inject([AdminService], (service: AdminService) => {
            let stubList = sinon.stub(service, 'list').returns(Promise.resolve(['anotherNetwork']));
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connectWithDetails.returns(Promise.resolve());
            adminConnectionMock.disconnect.returns(Promise.resolve());
            adminConnectionMock.deploy.returns(Promise.resolve());

            identityMock.getCurrentConnectionProfile.returns({name: 'myProfile'});

            let stubGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            service.createNewBusinessNetwork('myNetwork', 'myDescription').then((result: boolean) => {
                result.should.equal(true);
            });

            alertMock.busyStatus$.next.firstCall.should.have.been.calledWith({
                title: 'Checking Business Network',
                text: 'checking if myNetwork exists',
                force: true
            });

            tick();

            stubList.should.have.been.called;

            alertMock.busyStatus$.next.secondCall.should.have.been.calledWith({
                title: 'Creating Business Network',
                text: 'creating business network myNetwork',
                force: true
            });

            identityMock.getCurrentConnectionProfile.should.have.been.called;
            identityMock.getCurrentQualifiedProfileName.should.have.been.called;
            identityMock.getCurrentEnrollmentCredentials.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', 'mySecret');

            stubGenerateBusinessNetwork.should.have.been.calledWith('myNetwork', 'myDescription');

            adminConnectionMock.deploy.should.have.been.calledWith({name: 'myNetwork'});

            adminConnectionMock.disconnect.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', 'mySecret', 'myNetwork');

            alertMock.busyStatus$.next.thirdCall.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile',
                force: true
            });
        })));

        it('should create a new business network without enrollment credentials', fakeAsync(inject([AdminService], (service: AdminService) => {
            let stubList = sinon.stub(service, 'list').returns(Promise.resolve(['anotherNetwork']));
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connectWithDetails.returns(Promise.resolve());
            adminConnectionMock.disconnect.returns(Promise.resolve());
            adminConnectionMock.deploy.returns(Promise.resolve());

            identityMock.getCurrentConnectionProfile.returns({name: 'myProfile'});
            identityMock.getCurrentEnrollmentCredentials.returns(null);

            let stubGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            service.createNewBusinessNetwork('myNetwork', 'myDescription').then((result: boolean) => {
                result.should.equal(true);
            });

            alertMock.busyStatus$.next.firstCall.should.have.been.calledWith({
                title: 'Checking Business Network',
                text: 'checking if myNetwork exists',
                force: true
            });

            tick();

            alertMock.busyStatus$.next.secondCall.should.have.been.calledWith({
                title: 'Creating Business Network',
                text: 'creating business network myNetwork',
                force: true
            });

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', null);

            stubGenerateBusinessNetwork.should.have.been.calledWith('myNetwork', 'myDescription');

            adminConnectionMock.deploy.should.have.been.calledWith({name: 'myNetwork'});

            adminConnectionMock.disconnect.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', null, 'myNetwork');

            alertMock.busyStatus$.next.thirdCall.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile',
                force: true
            });
        })));

        it('should not create if name already exists', fakeAsync(inject([AdminService], (service: AdminService) => {

            let stubList = sinon.stub(service, 'list').returns(Promise.resolve(['myNetwork']));

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connectWithDetails.returns(Promise.resolve());
            adminConnectionMock.deploy.returns(Promise.resolve());

            let stubGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            service.createNewBusinessNetwork('myNetwork', 'myDescription')
                .then(() => {
                    throw new Error('should not have got here');
                })
                .catch((error) => {
                    error.message.should.equal('businessNetwork with name myNetwork already exists');
                });

            tick();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Checking Business Network',
                text: 'checking if myNetwork exists',
                force: true
            });

            stubList.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.not.have.been.called;

            stubGenerateBusinessNetwork.should.not.have.been.called;

            adminConnectionMock.deploy.should.not.have.been.called;

            adminConnectionMock.disconnect.should.not.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([AdminService], (service: AdminService) => {

            let stubList = sinon.stub(service, 'list').returns(Promise.reject(new Error('some error')));

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connectWithDetails.returns(Promise.resolve());
            adminConnectionMock.deploy.returns(Promise.resolve());

            let stubGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            service.createNewBusinessNetwork('myNetwork', 'myDescription');

            tick();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Checking Business Network',
                text: 'checking if myNetwork exists',
                force: true
            });

            stubList.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.not.have.been.called;

            stubGenerateBusinessNetwork.should.not.have.been.called;

            adminConnectionMock.deploy.should.not.have.been.called;

            adminConnectionMock.disconnect.should.not.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith(null);

            alertMock.errorStatus$.next.should.have.been.called;
        })));

    });

    describe('reset', () => {
        it('should reset a business network', fakeAsync(inject([AdminService], (service: AdminService) => {
            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);
            businessNetworkDefMock.getName.returns('myNetwork');

            service.reset('myNetwork');

            tick();

            adminConnectionMock.reset.should.have.been.calledWith('myNetwork');
        })));
    });

    describe('deploy', () => {
        it('should deploy a business network', fakeAsync(inject([AdminService], (service: AdminService) => {
            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);
            businessNetworkDefMock.getName.returns('myNetwork');

            service.deploy(businessNetworkDefMock);

            tick();

            adminConnectionMock.deploy.should.have.been.calledWith(businessNetworkDefMock);
        })));
    });

    describe('install', () => {
        it('should install a business network', fakeAsync(inject([AdminService], (service: AdminService) => {
            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.install('myNetwork');

            tick();

            adminConnectionMock.install.should.have.been.calledWith('myNetwork');
        })));
    });

    describe('start', () => {
        it('should start a business network without options', fakeAsync(inject([AdminService], (service: AdminService) => {
            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.start(businessNetworkDefMock);

            tick();

            adminConnectionMock.start.should.have.been.calledWith(businessNetworkDefMock);
        })));

        it('should start a business network with options', fakeAsync(inject([AdminService], (service: AdminService) => {
            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            const startOptions = { option: 1 };
            service.start(businessNetworkDefMock, startOptions);

            tick();

            adminConnectionMock.start.should.have.been.calledWith(businessNetworkDefMock, startOptions);
        })));
    });

    describe('importIdentity', () => {
        it('should start a business network', fakeAsync(inject([AdminService], (service: AdminService) => {
            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.importIdentity('qpn-myProfile', 'myId', 'myCertificate', 'myPrivateKey');

            tick();

            adminConnectionMock.importIdentity.should.have.been.calledWith('qpn-myProfile', 'myId', 'myCertificate', 'myPrivateKey');
        })));
    });

    describe('exportIdentity', () => {
        it('should start a business network', fakeAsync(inject([AdminService], (service: AdminService) => {
            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.exportIdentity('qpn-myProfile', 'myId');

            tick();

            adminConnectionMock.exportIdentity.should.have.been.calledWith('qpn-myProfile', 'myId');
        })));
    });

    describe('update', () => {
        it('should update a business network', fakeAsync(inject([AdminService], (service: AdminService) => {
            service['adminConnection'] = adminConnectionMock;

            service.update(businessNetworkDefMock);

            tick();

            adminConnectionMock.update.should.have.been.calledWith(businessNetworkDefMock);
        })));
    });

    describe('list', () => {
        it('should list the business networks', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connectWithDetails.returns(Promise.resolve());
            adminConnectionMock.list.returns(Promise.resolve(['myNetwork']));

            let disconnectStub = sinon.stub(service, 'disconnect');

            service.list().then((networks) => {
                networks.should.deep.equal(['myNetwork']);
            });

            tick();

            identityMock.getCurrentConnectionProfile.should.have.been.called;
            identityMock.getCurrentQualifiedProfileName.should.have.been.called;
            identityMock.getCurrentEnrollmentCredentials.should.have.been.called;

            adminConnectionMock.connectWithDetails.should.have.been.calledWith('qpn-myProfile', 'myId', 'mySecret');
            adminConnectionMock.list.should.have.been.called;

            disconnectStub.should.have.been.called;
        })));
    });

    describe('disconnect', () => {
        it('should disconnect', fakeAsync(inject([AdminService], (service: AdminService) => {
            service['isConnected'] = true;

            adminConnectionMock.disconnect.returns(Promise.resolve());
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.disconnect();

            tick();

            service['isConnected'].should.equal(false);
            adminConnectionMock.disconnect.should.have.been.called;
        })));
    });

    describe('generateDefaultBusinessNetwork', () => {
        it('should generate a new business definition', inject([AdminService], (service: AdminService) => {
            sinon.restore(businessNetworkDefMock);

            let defaultBusNet: BusinessNetworkDefinition = service.generateDefaultBusinessNetwork('name', 'desc');
            defaultBusNet.getDescription().should.be.equal('desc');
            defaultBusNet.getName().should.be.equal('name');
            defaultBusNet.getVersion().should.be.equal('0.0.1');
        }));
    });
});
