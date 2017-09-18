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
import { ConfigService } from './config.service';
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
                    userName: 'PeerAdmin',
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
    let mockIdentityService;
    let mockIdentityCardService;
    let mockConfigService;

    beforeEach(() => {

        mockClientService = sinon.createStubInstance(ClientService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockConfigService = sinon.createStubInstance(ConfigService);

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
                {provide: XHRBackend, useClass: MockBackend},
                {provide: ConfigService, useValue: mockConfigService}
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

        it('should initialize', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            mockConfigService.loadConfig.returns(Promise.resolve({}));

            mockIdentityService.getLoggedIn.returns(false);

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());

            mockIdentityCardService.addInitialIdentityCards.returns(Promise.resolve(['cardRef']));

            service.initialize();

            tick();
            mockConfigService.loadConfig.should.be.called;

            mockIdentityCardService.loadIdentityCards.should.have.been.called;
            mockIdentityCardService.addInitialIdentityCards.should.have.been.called;
        })));

        it('should initialize with config data', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            mockConfigService.loadConfig.returns(Promise.resolve(mockConfig));

            mockIdentityService.getLoggedIn.returns(false);

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());

            mockIdentityCardService.addInitialIdentityCards.returns(Promise.resolve(['cardRef']));

            service.initialize();

            tick();
            mockConfigService.loadConfig.should.be.called;

            mockIdentityCardService.loadIdentityCards.should.have.been.called;
            mockIdentityCardService.addInitialIdentityCards.should.have.been.calledWith([sinon.match.instanceOf(IdCard)]);
        })));

        it('should handle errors and revert to uninitialized state', fakeAsync(inject([InitializationService], (service: InitializationService) => {

            mockConfigService.loadConfig.throws();

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());

            service.initialize();
            tick();

            mockAlertService.errorStatus$.next.should.have.been.called;
            service['initialized'].should.be.false;

            sinon.restore(mockConfigService.loadConfig);
        })));
    });
});
