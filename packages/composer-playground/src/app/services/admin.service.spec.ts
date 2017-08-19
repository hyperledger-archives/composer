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
import { BusinessNetworkDefinition } from 'composer-common';
import { IdentityCardService } from './identity-card.service';
import { AdminConnection } from 'composer-admin';

describe('AdminService', () => {

    let sandbox;

    let alertMock;
    let businessNetworkDefMock;
    let identityCardMock;

    let adminConnectionMock;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        alertMock = sinon.createStubInstance(AlertService);
        businessNetworkDefMock = sinon.createStubInstance(BusinessNetworkDefinition);
        identityCardMock = sinon.createStubInstance(IdentityCardService);
        identityCardMock.getCurrentConnectionProfile.returns({name: 'myProfile'});
        identityCardMock.getQualifiedProfileName.returns('xxx-myProfile');
        identityCardMock.getCurrentEnrollmentCredentials.returns({id: 'myId', secret: 'mySecret'});
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
                {provide: IdentityCardService, useValue: identityCardMock}]
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

            identityCardMock.getCurrentConnectionProfile.should.not.have.been.called;
        })));

        it('should return if connecting', inject([AdminService], (service: AdminService) => {
            service['connectingPromise'] = Promise.resolve();

            service.connect('myNetwork');

            identityCardMock.getCurrentConnectionProfile.should.not.have.been.called;
        }));

        it('should connect', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connect.returns(Promise.resolve());
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.activateCurrentIdentityCard.returns(Promise.resolve());

            service.connect('myNetwork');

            tick();

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            identityCardMock.activateCurrentIdentityCard.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret', 'myNetwork');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect if forced', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connect.returns(Promise.resolve());
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.activateCurrentIdentityCard.returns(Promise.resolve());

            service['isConnected'] = true;

            service.connect('myNetwork', true);

            tick();

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            identityCardMock.activateCurrentIdentityCard.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret', 'myNetwork');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect and import the certificates', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connect.returns(Promise.resolve());
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.activateCurrentIdentityCard.returns(Promise.resolve('myCardRef'));

            let importStub = sinon.stub(service, 'importCertificates');

            service.connect('myNetwork');

            tick();

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            identityCardMock.activateCurrentIdentityCard.should.have.been.called;
            importStub.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret', 'myNetwork');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connect.returns(Promise.reject('some error'));
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.activateCurrentIdentityCard.returns(Promise.resolve());

            service.connect('myNetwork')
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            identityCardMock.activateCurrentIdentityCard.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret', 'myNetwork');

            service['isConnected'].should.equal(false);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));
    });

    describe('connectWithOutNetwork', () => {
        it('should return if connected', fakeAsync(inject([AdminService], (service: AdminService) => {
            service['isConnected'] = true;

            service.connectWithoutNetwork();

            identityCardMock.getCurrentConnectionProfile.should.not.have.been.called;
        })));

        it('should return if connecting', inject([AdminService], (service: AdminService) => {
            service['connectingPromise'] = Promise.resolve();

            service.connectWithoutNetwork();

            identityCardMock.getCurrentConnectionProfile.should.not.have.been.called;
        }));

        it('should connect without an id', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.activateCurrentIdentityCard.returns(Promise.resolve());

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.list.returns(Promise.resolve([]));

            let mockGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            adminConnectionMock.deploy.returns(Promise.resolve());

            service.connectWithoutNetwork();

            tick();

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            identityCardMock.activateCurrentIdentityCard.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect without an id and import certificate', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            let importMock = sinon.stub(service, 'importCertificates');

            identityCardMock.activateCurrentIdentityCard.returns(Promise.resolve('cardRef'));

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.list.returns(Promise.resolve([]));

            let mockGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            adminConnectionMock.deploy.returns(Promise.resolve());

            service.connectWithoutNetwork();

            tick();

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            identityCardMock.activateCurrentIdentityCard.should.have.been.called;

            importMock.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect if forced', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.activateCurrentIdentityCard.returns(Promise.resolve());

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.list.returns(Promise.resolve([]));

            let mockGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            adminConnectionMock.deploy.returns(Promise.resolve());

            service['isConnected'] = true;

            service.connectWithoutNetwork(true);

            tick();

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            identityCardMock.activateCurrentIdentityCard.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.activateCurrentIdentityCard.returns(Promise.resolve());

            adminConnectionMock.connect.returns(Promise.reject('some error'));
            adminConnectionMock.list.returns(Promise.resolve([]));

            let mockGenerateBusinessNetwork = sinon.stub(service, 'generateDefaultBusinessNetwork').returns({name: 'myNetwork'});

            adminConnectionMock.deploy.returns(Promise.resolve());

            service.connectWithoutNetwork();

            tick();

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            identityCardMock.activateCurrentIdentityCard.should.have.been.called;

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret');

            service['isConnected'].should.equal(false);
            should.not.exist(service['isConnectingPromise']);
            alertMock.errorStatus$.next.should.have.been.calledWith('some error');
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));
    });

    describe('createNewBusinessNetwork', () => {
        it('should create a new business network', fakeAsync(inject([AdminService], (service: AdminService) => {
            let stubList = sinon.stub(service, 'list').returns(Promise.resolve(['anotherNetwork']));
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.disconnect.returns(Promise.resolve());
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

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret');

            stubGenerateBusinessNetwork.should.have.been.calledWith('myNetwork', 'myDescription');

            adminConnectionMock.deploy.should.have.been.calledWith({name: 'myNetwork'});

            adminConnectionMock.disconnect.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile, connectionProfile'
            });

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret', 'myNetwork');

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
        it('should start a business network', fakeAsync(inject([AdminService], (service: AdminService) => {
            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.start(businessNetworkDefMock);

            tick();

            adminConnectionMock.start.should.have.been.calledWith(businessNetworkDefMock);
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
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.activateCurrentIdentityCard.returns(Promise.resolve());

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.list.returns(Promise.resolve(['myNetwork']));

            let disconnectStub = sinon.stub(service, 'disconnect');

            service.list().then((networks) => {
                networks.should.deep.equal(['myNetwork']);
            });

            tick();

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            identityCardMock.activateCurrentIdentityCard.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret');
            adminConnectionMock.list.should.have.been.called;

            disconnectStub.should.have.been.called;
        })));

        it('should list the business networks and import certificates', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.activateCurrentIdentityCard.returns(Promise.resolve('cardRef'));
            let importStub = sinon.stub(service, 'importCertificates').returns(Promise.resolve());

            adminConnectionMock.connect.returns(Promise.resolve());
            adminConnectionMock.list.returns(Promise.resolve(['myNetwork']));

            let disconnectStub = sinon.stub(service, 'disconnect');

            service.list().then((networks) => {
                networks.should.deep.equal(['myNetwork']);
            });

            tick();

            identityCardMock.getCurrentConnectionProfile.should.have.been.called;
            identityCardMock.getCurrentEnrollmentCredentials.should.have.been.called;

            identityCardMock.activateCurrentIdentityCard.should.have.been.called;
            importStub.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('xxx-myProfile', 'myId', 'mySecret');
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

    describe('importCertificates', () => {
        let mockConnectionProfile;
        let mockIdCard;

        beforeEach(() => {
            mockConnectionProfile = {name: 'myProfile'};
            mockIdCard = sinon.createStubInstance(IdCard);
            mockIdCard.getBusinessNetworkName.returns('myNetwork');
            mockIdCard.getConnectionProfile.returns(mockConnectionProfile);
            mockIdCard.getEnrollmentCredentials.returns({id: 'myId'});
            mockIdCard.getCredentials.returns({public: 'publicKey', private: 'privateKey'});
        });

        it('should import the certificates', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.importIdentity.returns(Promise.resolve());

            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.getCurrentIdentityCard.returns(mockIdCard);
            identityCardMock.getQualifiedProfileName.returns('qpn');

            service.importCertificates();

            identityCardMock.getCurrentIdentityCard.should.have.been.called;
            identityCardMock.getQualifiedProfileName.should.have.been.calledWith(mockConnectionProfile);
            mockIdCard.getEnrollmentCredentials.should.have.been.called;
            mockIdCard.getCredentials.should.have.been.called;

            adminConnectionMock.importIdentity.should.have.been.calledWith('qpn', 'myId', 'publicKey', 'privateKey');
        })));

        it('should do nothing if no certs but is a secret', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.importIdentity.returns(Promise.resolve());

            mockIdCard.getEnrollmentCredentials.returns({id: 'myId', secret: 'mySecret'});
            mockIdCard.getCredentials.returns(null);

            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.getCurrentIdentityCard.returns(mockIdCard);
            identityCardMock.getQualifiedProfileName.returns('qpn');

            service.importCertificates().catch(() => {
                throw new Error('should not have got here');
            });

            identityCardMock.getCurrentIdentityCard.should.have.been.called;
            identityCardMock.getQualifiedProfileName.should.have.been.calledWith(mockConnectionProfile);
            mockIdCard.getEnrollmentCredentials.should.have.been.called;
            mockIdCard.getCredentials.should.have.been.called;

            adminConnectionMock.importIdentity.should.not.have.been.called;
        })));

        it('should give an error if no private key and no secret', fakeAsync(inject([AdminService], (service: AdminService) => {
            mockIdCard.getCredentials.returns({public: 'publicKey'});

            adminConnectionMock.importIdentity.returns(Promise.resolve());

            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.getCurrentIdentityCard.returns(mockIdCard);
            identityCardMock.getQualifiedProfileName.returns('qpn');

            service.importCertificates().catch((error) => {
                error.message.should.equal('No certificates or user secret was specified. An identity card must contain either public and private certificates or an enrollment secret');
            });

            identityCardMock.getCurrentIdentityCard.should.have.been.called;
            identityCardMock.getQualifiedProfileName.should.have.been.calledWith(mockConnectionProfile);
            mockIdCard.getEnrollmentCredentials.should.have.been.called;
            mockIdCard.getCredentials.should.have.been.called;

            adminConnectionMock.importIdentity.should.not.have.been.called;
        })));

        it('should give an error if no public key and no secret', fakeAsync(inject([AdminService], (service: AdminService) => {
            mockIdCard.getCredentials.returns({private: 'privateKey'});

            adminConnectionMock.importIdentity.returns(Promise.resolve());

            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.getCurrentIdentityCard.returns(mockIdCard);
            identityCardMock.getQualifiedProfileName.returns('qpn');

            service.importCertificates().catch((error) => {
                error.message.should.equal('No certificates or user secret was specified. An identity card must contain either public and private certificates or an enrollment secret');
            });

            identityCardMock.getCurrentIdentityCard.should.have.been.called;
            identityCardMock.getQualifiedProfileName.should.have.been.calledWith(mockConnectionProfile);
            mockIdCard.getEnrollmentCredentials.should.have.been.called;
            mockIdCard.getCredentials.should.have.been.called;

            adminConnectionMock.importIdentity.should.not.have.been.called;
        })));

        it('should give an error if no credentials and no secret', fakeAsync(inject([AdminService], (service: AdminService) => {
            mockIdCard.getCredentials.returns(null);

            adminConnectionMock.importIdentity.returns(Promise.resolve());

            sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            identityCardMock.getCurrentIdentityCard.returns(mockIdCard);
            identityCardMock.getQualifiedProfileName.returns('qpn');

            service.importCertificates().catch((error) => {
                error.message.should.equal('No certificates or user secret was specified. An identity card must contain either public and private certificates or an enrollment secret');
            });

            identityCardMock.getCurrentIdentityCard.should.have.been.called;
            identityCardMock.getQualifiedProfileName.should.have.been.calledWith(mockConnectionProfile);
            mockIdCard.getEnrollmentCredentials.should.have.been.called;
            mockIdCard.getCredentials.should.have.been.called;

            adminConnectionMock.importIdentity.should.not.have.been.called;
        })));
    });
});
