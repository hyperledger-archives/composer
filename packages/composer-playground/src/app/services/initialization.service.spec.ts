/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import {
    HttpModule,
    Response,
    ResponseOptions,
    XHRBackend
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { InitializationService } from './initialization.service';

import { ClientService } from './client.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConnectionProfileService } from './connectionprofile.service';
import { WalletService } from './wallet.service';
import { IdCard } from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import { IdentityService } from './identity.service';
import { IdentityCardService } from './identity-card.service';

describe('InitializationService', () => {

    let mockConfig = {
        cards: [
            {
                metadata: {
                    name: 'PeerAdmin',
                    enrollmentId: 'PeerAdmin',
                    enrollmentSecret: 'NOTUSED',
                    roles: [
                        'PeerAdmin',
                        'ChannelAdmin'
                    ]
                },
                connectionProfile: {
                    name: 'hlfabric',
                    description: 'Hyperledger Fabric v1.0',
                    type: 'hlfv1',
                    keyValStore: '/home/composer/.composer-credentials',
                    timeout: 300,
                    orderers: [
                        {
                            url: 'grpc://orderer.example.com:7050'
                        }
                    ],
                    channel: 'composerchannel',
                    mspID: 'Org1MSP',
                    ca: {
                        url: 'http://ca.org1.example.com:7054',
                        name: 'ca.org1.example.com'
                    },
                    peers: [
                        {
                            requestURL: 'grpc://peer0.org1.example.com:7051',
                            eventURL: 'grpc://peer0.org1.example.com:7053'
                        }
                    ]
                },
                credentials: null
            }
        ]
    };

    let mockClientService;
    let mockAlertService;
    let mockConnectionProfileService;
    let mockWalletService;
    let mockIdentityService;
    let mockIdentityCardService;

    beforeEach(() => {

        mockClientService = sinon.createStubInstance(ClientService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockWalletService = sinon.createStubInstance(WalletService);
        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);

        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        TestBed.configureTestingModule({
            imports: [HttpModule],
            providers: [
                InitializationService,
                {provide: ClientService, useValue: mockClientService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: IdentityService, useValue: mockIdentityService},
                {provide: IdentityCardService, useValue: mockIdentityCardService},
                {provide: WalletService, useValue: mockWalletService},
                {provide: XHRBackend, useClass: MockBackend}
            ]
        });
    });

    describe('initialize', () => {
        it('should return if initialized', fakeAsync(inject([InitializationService], (service: InitializationService) => {

            service['initialized'] = true;
            let result = service.initialize();
            tick();
            result.should.deep.equal(Promise.resolve());

        })));

        it('should return initialized promise', fakeAsync(inject([InitializationService], (service: InitializationService) => {

            service['initializingPromise'] = Promise.resolve();
            let result = service.initialize();
            tick();
            result.should.deep.equal(Promise.resolve());
        })));

        it('should initialize and deploy sample', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            let mockCreateSample = sinon.stub(service, 'deployInitialSample');
            mockCreateSample.returns(Promise.resolve());

            let stubLoadConfig = sinon.stub(service, 'loadConfig');
            stubLoadConfig.returns(Promise.resolve({}));

            mockIdentityService.getLoggedIn.returns(false);

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());

            mockIdentityCardService.addInitialIdentityCards.returns(Promise.resolve(['cardRef']));

            service.initialize();

            tick();
            stubLoadConfig.should.be.called;

            mockIdentityCardService.loadIdentityCards.should.have.been.called;
            mockIdentityCardService.addInitialIdentityCards.should.have.been.called;
            mockCreateSample.should.be.called;
        })));

        it('should initialize and deploy sample with config data', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            let mockCreateSample = sinon.stub(service, 'deployInitialSample');
            mockCreateSample.returns(Promise.resolve());

            let stubLoadConfig = sinon.stub(service, 'loadConfig');
            stubLoadConfig.returns(Promise.resolve(mockConfig));

            mockIdentityService.getLoggedIn.returns(false);

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());

            mockIdentityCardService.addInitialIdentityCards.returns(Promise.resolve(['cardRef']));

            service.initialize();

            tick();
            stubLoadConfig.should.be.called;

            mockIdentityCardService.loadIdentityCards.should.have.been.called;
            mockIdentityCardService.addInitialIdentityCards.should.have.been.calledWith([sinon.match.instanceOf(IdCard)]);
            mockCreateSample.should.be.called;
        })));

        it('should initialize and not deploy sample as logged in', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            let mockCreateSample = sinon.stub(service, 'deployInitialSample');
            mockCreateSample.returns(Promise.resolve());

            let stubLoadConfig = sinon.stub(service, 'loadConfig');
            stubLoadConfig.returns(Promise.resolve({}));

            mockIdentityService.getLoggedIn.returns(true);

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());
            mockIdentityCardService.addInitialIdentityCards.returns(Promise.resolve(['cardRef']));

            service.initialize();

            tick();
            stubLoadConfig.should.be.called;

            mockIdentityCardService.loadIdentityCards.should.have.been.called;
            mockIdentityCardService.addInitialIdentityCards.should.have.been.called;
            mockCreateSample.should.not.have.been.called;
        })));

        it('should handle errors and revert to uninitialized state', fakeAsync(inject([InitializationService], (service: InitializationService) => {

            let loadConfigStub = sinon.stub(service, 'loadConfig').throws();

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());

            service.initialize();
            tick();

            mockAlertService.errorStatus$.next.should.have.been.called;
            service['initialized'].should.be.false;

            sinon.restore(service.loadConfig);
        })));
    });

    describe('loadConfig', () => {
        it('should load config', fakeAsync(inject([InitializationService, XHRBackend], (service: InitializationService, mockBackend) => {
            // setup a mocked response
            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: JSON.stringify({result: 'a result'})
                })));
            });

            service.loadConfig().then((config) => {
                config.should.deep.equal({result: 'a result'});
            });
            tick();
        })));

        it('should load config and ignore 404', fakeAsync(inject([InitializationService, XHRBackend], (service: InitializationService, mockBackend) => {
            // setup a mocked response
            mockBackend.connections.subscribe((connection) => {
                connection.mockError(new Response(new ResponseOptions({
                    status: 404,
                    statusText: 'URL not Found',
                })));
            });

            service.loadConfig()
                .then((config) => {
                    should.not.exist(config);
                })
                .catch((error) => {
                    throw new Error('should not get here');
                });
            tick();
        })));

        it('should handle error', fakeAsync(inject([InitializationService, XHRBackend], (service: InitializationService, mockBackend) => {
            // setup a mocked response
            mockBackend.connections.subscribe((connection) => {
                connection.mockError(new Response(new ResponseOptions({
                    status: 500,
                    statusText: 'internal server error',
                })));
            });

            service.loadConfig()
                .then((config) => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.status.should.equal(500);
                    error.statusText.should.equal('internal server error');
                });
            tick();
        })));
    });

    describe('isWebOnly', () => {
        it('should return false if web only', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            let result = service.isWebOnly();
            tick();
            result.should.equal(false);
        })));

        it('should return true if not web only', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            service['config'] = {webonly: true};
            let result = service.isWebOnly();
            tick();
            result.should.equal(true);
        })));
    });

    describe('deployInitialSample', () => {
        it('should deploy the initial sample', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            mockIdentityCardService.setCurrentIdentityCard.returns(Promise.resolve());

            service.deployInitialSample('xxxx');

            tick();

            mockClientService.deployInitialSample.should.have.been.called;
        })));
    });
})
;
