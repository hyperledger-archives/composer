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
import { BusinessNetworkDefinition, BusinessNetworkCardStore } from 'composer-common';
import { AdminConnection } from 'composer-admin';
import { BusinessNetworkCardStoreService } from './cardStores/businessnetworkcardstore.service';

describe('AdminService', () => {

    let sandbox;

    let alertMock;
    let businessNetworkDefMock;

    let adminConnectionMock;

    let businessNetworkCardStoreServiceMock;
    let businessNetworkCardStoreMock;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        businessNetworkCardStoreMock = sinon.createStubInstance(BusinessNetworkCardStore);
        alertMock = sinon.createStubInstance(AlertService);
        businessNetworkDefMock = sinon.createStubInstance(BusinessNetworkDefinition);
        adminConnectionMock = sinon.createStubInstance(AdminConnection);
        businessNetworkCardStoreServiceMock = sinon.createStubInstance(BusinessNetworkCardStoreService);

        alertMock.busyStatus$ = {
            next: sinon.stub()
        };

        alertMock.errorStatus$ = {
            next: sinon.stub()
        };

        businessNetworkCardStoreServiceMock.getBusinessNetworkCardStore.returns(businessNetworkCardStoreMock);

        TestBed.configureTestingModule({
            providers: [AdminService,
                {provide: AlertService, useValue: alertMock},
                {provide: BusinessNetworkCardStoreService, useValue: businessNetworkCardStoreServiceMock}]
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
            (<any> result).cardStore.should.equal(businessNetworkCardStoreMock);
        }));
    });

    describe('connect', () => {
        let mockIdCard;
        let mockIdCard1;
        beforeEach(() => {
            mockIdCard = new IdCard({userName: 'banana', businessNetwork: 'myNetwork'}, {
                type: 'web',
                name: 'myProfile'
            });
            mockIdCard1 = new IdCard({userName: 'banana'}, {type: 'web', name: 'myProfile'});
        });

        it('should return if connected', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);
            service['isConnected'] = true;

            service.connect('myName', mockIdCard);

            tick();

            adminConnectionMock.connect.should.not.have.been.called;
        })));

        it('should return if connecting', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);
            service['connectingPromise'] = Promise.resolve();

            service.connect('myName', mockIdCard);

            tick();

            adminConnectionMock.connect.should.not.have.been.called;
        })));

        it('should connect', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connect.returns(Promise.resolve());
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.connect('myName', mockIdCard);

            tick();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('myName');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect with no network', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connect.returns(Promise.resolve());
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.connect('myName', mockIdCard1);

            tick();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting without a business network',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('myName');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should connect if forced', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connect.returns(Promise.resolve());
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service['isConnected'] = true;

            service.connect('myName', mockIdCard, true);

            tick();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('myName');

            service['isConnected'].should.equal(true);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([AdminService], (service: AdminService) => {
            adminConnectionMock.connect.returns(Promise.reject('some error'));
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.connect('myName', mockIdCard)
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Connecting to Business Network myNetwork',
                text: 'using connection profile myProfile'
            });

            mockGetAdminConnection.should.have.been.called;

            adminConnectionMock.connect.should.have.been.calledWith('myName');

            service['isConnected'].should.equal(false);
            should.not.exist(service['isConnectingPromise']);
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
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

            const startOptions = {option: 1};
            service.start(businessNetworkDefMock, startOptions);

            tick();

            adminConnectionMock.start.should.have.been.calledWith(businessNetworkDefMock, startOptions);
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

    describe('importCard', () => {
        it('should import a card', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.importCard.returns(Promise.resolve());

            let idCard1 = new IdCard({
                version: 1,
                userName: 'card1',
                businessNetworkName: 'assassin-network',
                enrollmentSecret: 'adminpw'
            }, {name: 'hlfv1'});

            service.importCard('myCard', idCard1);

            tick();

            adminConnectionMock.importCard.should.have.been.calledWith('myCard', idCard1);
        })));
    });

    describe('exportCard', () => {
        it('should export a card', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            let idCard1 = new IdCard({
                version: 1,
                userName: 'card1',
                businessNetworkName: 'assassin-network',
                enrollmentSecret: 'adminpw'
            }, {name: 'hlfv1'});

            adminConnectionMock.exportCard.returns(Promise.resolve(idCard1));

            service.exportCard('myCard').then((result) => {
                result.should.deep.equal(idCard1);
            });

            tick();

            adminConnectionMock.exportCard.should.have.been.calledWith('myCard');
        })));
    });

    describe('getAllCards', () => {
        it('should get all the cards', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            let idCard1 = new IdCard({
                version: 1,
                userName: 'card1',
                businessNetworkName: 'assassin-network',
                enrollmentSecret: 'adminpw'
            }, {name: 'hlfv1'});

            let cardMap: Map<string, IdCard> = new Map<string, IdCard>();

            cardMap.set('myCard', idCard1);

            adminConnectionMock.getAllCards.returns(Promise.resolve(cardMap));

            service.getAllCards().then((result: Map<string, IdCard>) => {
                result.size.should.equal(1);
                result.get('myCard').should.deep.equal(idCard1);
            });

            tick();

            adminConnectionMock.getAllCards.should.have.been.called;
        })));
    });

    describe('deleteCard', () => {
        it('should delete a card', fakeAsync(inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            adminConnectionMock.deleteCard.returns(Promise.resolve());

            service.deleteCard('myCard');

            tick();

            adminConnectionMock.deleteCard.should.have.been.calledWith('myCard');
        })));
    });

    describe('undeploy', () => {
        it('should undeploy the businessNetwork', inject([AdminService], (service: AdminService) => {
            let mockGetAdminConnection = sinon.stub(service, 'getAdminConnection').returns(adminConnectionMock);

            service.undeploy('myNetwork');

            adminConnectionMock.undeploy.should.have.been.calledWith('myNetwork');
        }));
    });
});
