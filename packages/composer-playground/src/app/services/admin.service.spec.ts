/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { AdminService } from './admin.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import { AlertService } from '../basic-modals/alert.service';
import { BusinessNetworkDefinition } from 'composer-common';
import { ConnectionProfileService } from './connectionprofile.service';
import { IdentityService } from './identity.service';
import { AdminConnection } from 'composer-admin';

describe('AdminService', () => {

    let sandbox;

    let alertMock;
    let connectionProfileMock;
    let businessNetworkDefMock;
    let identityMock;

    let adminConnectionMock;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        alertMock = sinon.createStubInstance(AlertService);
        connectionProfileMock = sinon.createStubInstance(ConnectionProfileService);
        businessNetworkDefMock = sinon.createStubInstance(BusinessNetworkDefinition);
        identityMock = sinon.createStubInstance(IdentityService);
        adminConnectionMock = sinon.createStubInstance(AdminConnection);

        alertMock.busyStatus$ = {
            next: sinon.stub()
        };

        alertMock.errorStatus$ = {
            next: sinon.stub()
        };

        TestBed.configureTestingModule({
            providers: [AdminService,
                {provide: AlertService, useValue: alertMock},
                {provide: ConnectionProfileService, useValue: connectionProfileMock},
                {provide: IdentityService, useValue: identityMock}]
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
    });

    describe('connect', () => {
        it('should return if connected', fakeAsync(inject([AdminService], (service: AdminService) => {
            service['isConnected'] = true;

            service.connect('myNetwork');

            connectionProfileMock.getCurrentConnectionProfile.should.not.have.been.called;
        })));

        it('should return if connecting', inject([AdminService], (service: AdminService) => {
            service['connectingPromise'] = Promise.resolve();

            service.connect('myNetwork');

            connectionProfileMock.getCurrentConnectionProfile.should.not.have.been.called;
        }));

        it('should connect', fakeAsync(inject([AdminService], (service: AdminService) => {
            connectionProfileMock.getCurrentConnectionProfile.returns('my profile');

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityMock.getUserID.returns(Promise.resolve('myId'));
            identityMock.getUserSecret.returns(Promise.resolve('myPassword'));

            service.connect('myNetwork');

            tick();

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile my profile'
            });

            identityMock.getUserID.should.have.been.called;
            identityMock.getUserSecret.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('my profile', 'myId', 'myPassword', 'myNetwork');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect if forced', fakeAsync(inject([AdminService], (service: AdminService) => {
            connectionProfileMock.getCurrentConnectionProfile.returns('my profile');

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityMock.getUserID.returns(Promise.resolve('myId'));
            identityMock.getUserSecret.returns(Promise.resolve('myPassword'));

            service['isConnected'] = true;

            service.connect('myNetwork', true);

            tick();

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile my profile'
            });

            identityMock.getUserID.should.have.been.called;
            identityMock.getUserSecret.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('my profile', 'myId', 'myPassword', 'myNetwork');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([AdminService], (service: AdminService) => {
            connectionProfileMock.getCurrentConnectionProfile.returns('my profile');

            adminConnectionMock.connect.returns(Promise.reject('some error'));
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityMock.getUserID.returns(Promise.resolve('myId'));
            identityMock.getUserSecret.returns(Promise.resolve('myPassword'));

            service.connect('myNetwork');

            tick();

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile my profile'
            });

            identityMock.getUserID.should.have.been.called;
            identityMock.getUserSecret.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('my profile', 'myId', 'myPassword', 'myNetwork');

            service['isConnected'].should.equal(false);
            should.not.exist(service['isConnectingPromise']);
            alertMock.errorStatus$.next.should.have.been.calledWith('some error');
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));
    });

    describe('connectWithOutNetwork', () => {
        it('should return if connected', fakeAsync(inject([AdminService], (service: AdminService) => {
            service['isConnected'] = true;

            service.connectWithoutNetwork();

            connectionProfileMock.getCurrentConnectionProfile.should.not.have.been.called;
        })));

        it('should return if connecting', inject([AdminService], (service: AdminService) => {
            service['connectingPromise'] = Promise.resolve();

            service.connectWithoutNetwork();

            connectionProfileMock.getCurrentConnectionProfile.should.not.have.been.called;
        }));

        it('should connect without an id', fakeAsync(inject([AdminService], (service: AdminService) => {
            connectionProfileMock.getCurrentConnectionProfile.returns('myProfile');
            identityMock.getUserID.returns(Promise.resolve('myUser'));
            identityMock.getUserSecret.returns(Promise.resolve('mySecret'));

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.list.returns(Promise.resolve([]));

            let mockGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            adminConnectionMock.deploy.returns(Promise.resolve());

            service.connectWithoutNetwork();

            tick();

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            identityMock.getUserID.should.have.been.called;
            identityMock.getUserSecret.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('myProfile', 'myUser', 'mySecret');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect if forced', fakeAsync(inject([AdminService], (service: AdminService) => {
            connectionProfileMock.getCurrentConnectionProfile.returns('myProfile');
            identityMock.getUserID.returns(Promise.resolve('myUser'));
            identityMock.getUserSecret.returns(Promise.resolve('mySecret'));

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.list.returns(Promise.resolve([]));

            let mockGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            adminConnectionMock.deploy.returns(Promise.resolve());

            service['isConnected'] = true;

            service.connectWithoutNetwork(true);

            tick();

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            identityMock.getUserID.should.have.been.called;
            identityMock.getUserSecret.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('myProfile', 'myUser', 'mySecret');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([AdminService], (service: AdminService) => {
            connectionProfileMock.getCurrentConnectionProfile.returns('myProfile');
            identityMock.getUserID.returns(Promise.resolve('myUser'));
            identityMock.getUserSecret.returns(Promise.resolve('mySecret'));

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connect.returns(Promise.reject('some error'));
            adminConnectionMock.list.returns(Promise.resolve([]));

            let mockGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            adminConnectionMock.deploy.returns(Promise.resolve());

            service.connectWithoutNetwork();

            tick();

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            identityMock.getUserID.should.have.been.called;
            identityMock.getUserSecret.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('myProfile', 'myUser', 'mySecret');

            service['isConnected'].should.equal(false);
            should.not.exist(service['isConnectingPromise']);
            alertMock.errorStatus$.next.should.have.been.calledWith('some error');
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));
    });

    describe('createNewBusinessNetwork', () => {
        it('should create a new business network', fakeAsync(inject([AdminService], (service: AdminService) => {

            let stubList = sinon.stub(service, 'list').returns(Promise.resolve(['anotherNetwork']));
            connectionProfileMock.getCurrentConnectionProfile.returns('myProfile');
            identityMock.getUserID.returns(Promise.resolve('myUser'));
            identityMock.getUserSecret.returns(Promise.resolve('mySecret'));

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.deploy.returns(Promise.resolve());

            let stubGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            service.createNewBusinessNetwork('myNetwork', 'myDescription');

            tick();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Checking Business Network',
                text: 'checking if myNetwork exists'
            });

            stubList.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Creating Business Network',
                text: 'creating business network myNetwork'
            });

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;

            identityMock.getUserID.should.have.been.called;
            identityMock.getUserSecret.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('myProfile', 'myUser', 'mySecret');

            stubGenerateBusinessNetwork.should.have.been.calledWith('myNetwork', 'myDescription');

            adminConnectionMock.deploy.should.have.been.calledWith({name: 'myNetwork'});

            adminConnectionMock.disconnect.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile, connectionProfile'
            });

            adminConnectionMock.connect.should.have.been.calledWith('myProfile', 'myUser', 'mySecret', 'myNetwork');

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should not create if name already exists', fakeAsync(inject([AdminService], (service: AdminService) => {

            let stubList = sinon.stub(service, 'list').returns(Promise.resolve(['myNetwork']));

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connect.returns(Promise.resolve());
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
                text: 'checking if myNetwork exists'
            });

            stubList.should.have.been.called;

            connectionProfileMock.getCurrentConnectionProfile.should.not.have.been.called;

            identityMock.getUserID.should.not.have.been.called;
            identityMock.getUserSecret.should.not.have.been.called;

            adminConnectionMock.connect.should.not.have.been.called;

            stubGenerateBusinessNetwork.should.not.have.been.called;

            adminConnectionMock.deploy.should.not.have.been.called;

            adminConnectionMock.disconnect.should.not.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([AdminService], (service: AdminService) => {

            let stubList = sinon.stub(service, 'list').returns(Promise.reject(new Error('some error')));

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.deploy.returns(Promise.resolve());

            let stubGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            service.createNewBusinessNetwork('myNetwork', 'myDescription');

            tick();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Checking Business Network',
                text: 'checking if myNetwork exists'
            });

            stubList.should.have.been.called;

            connectionProfileMock.getCurrentConnectionProfile.should.not.have.been.called;

            identityMock.getUserID.should.not.have.been.called;
            identityMock.getUserSecret.should.not.have.been.called;

            adminConnectionMock.connect.should.not.have.been.called;

            stubGenerateBusinessNetwork.should.not.have.been.called;

            adminConnectionMock.deploy.should.not.have.been.called;

            adminConnectionMock.disconnect.should.not.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith(null);

            alertMock.errorStatus$.next.should.have.been.called;
        })));

    });

    describe('deploy', () => {
        it('should deploy a business network', fakeAsync(inject([AdminService], (service: AdminService) => {
            let connectedMock = sinon.stub(service, 'connect').returns(Promise.resolve());
            businessNetworkDefMock.getName.returns('myNetwork');

            service['adminConnection'] = adminConnectionMock;

            service.deploy(businessNetworkDefMock);

            tick();

            connectedMock.should.have.been.calledWith('myNetwork');
            adminConnectionMock.deploy.should.have.been.calledWith(businessNetworkDefMock);
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

    describe('isInitialDeploy', () => {
        it('should set initial deploy to false after call', inject([AdminService], (service: AdminService) => {
            service['initialDeploy'] = true;

            let result = service.isInitialDeploy();

            service['initialDeploy'].should.equal(false);
        }));
    });

    describe('list', () => {
        it('should list the business networks', fakeAsync(inject([AdminService], (service: AdminService) => {
            connectionProfileMock.getCurrentConnectionProfile.returns('myProfile');
            identityMock.getUserID.returns(Promise.resolve('myUserId'));
            identityMock.getUserSecret.returns(Promise.resolve('mySecret'));

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.list.returns(Promise.resolve(['myNetwork']));

            let disconnectStub = sinon.stub(service, 'disconnect');

            service.list().then((networks) => {
                networks.should.deep.equal(['myNetwork']);
            });

            tick();

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;
            identityMock.getUserID.should.have.been.called;
            identityMock.getUserSecret.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('myProfile', 'myUserId', 'mySecret');
            adminConnectionMock.list.should.have.been.called;

            disconnectStub.should.have.been.called;
        })));
    });

    describe('disconnect', () => {
        it('should disconnect', inject([AdminService], (service: AdminService) => {
            service['isConnected'] = true;

            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.disconnect();

            service['isConnected'].should.equal(false);
            adminConnectionMock.disconnect.should.have.been.called;
        }));
    });
});
