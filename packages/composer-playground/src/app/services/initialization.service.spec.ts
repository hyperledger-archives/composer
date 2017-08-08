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
import { FileWallet } from 'composer-common';

import * as sinon from 'sinon';
import { IdentityService } from './identity.service';
import { IdentityCardService } from './identity-card.service';

describe('InitializationService', () => {

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

            mockAlertService.busyStatus$ = {next: sinon.stub()};

            mockIdentityService.getLoggedIn.returns(false);

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());
            mockIdentityCardService.addInitialIdentityCards.returns(Promise.resolve('cardRef'));

            service.initialize();

            tick();
            stubLoadConfig.should.be.called;

            mockIdentityCardService.loadIdentityCards.should.have.been.called;
            mockIdentityCardService.addInitialIdentityCards.should.have.been.called;
            mockCreateSample.should.be.called;
        })));

        it('should initialize and not deploy sample as logged in', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            let mockCreateSample = sinon.stub(service, 'deployInitialSample');
            mockCreateSample.returns(Promise.resolve());

            let stubLoadConfig = sinon.stub(service, 'loadConfig');
            stubLoadConfig.returns(Promise.resolve({}));

            mockAlertService.busyStatus$ = {next: sinon.stub()};

            mockIdentityService.getLoggedIn.returns(true);

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());
            mockIdentityCardService.addInitialIdentityCards.returns(Promise.resolve('cardRef'));

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

            mockAlertService.busyStatus$ = {next: sinon.stub()};
            mockAlertService.errorStatus$ = {next: sinon.stub()};

            service.initialize();
            tick();

            mockAlertService.errorStatus$.next.should.be.called;
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
});
