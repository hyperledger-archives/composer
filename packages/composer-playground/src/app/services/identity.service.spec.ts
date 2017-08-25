/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import { IdentityService } from './identity.service';
import { LocalStorageService } from 'angular-2-local-storage';
import * as sinon from 'sinon';

import { IdCard } from 'composer-common';

describe('IdentityService', () => {

    let mockLocalStorageService;

    beforeEach(() => {
        mockLocalStorageService = sinon.createStubInstance(LocalStorageService);

        TestBed.configureTestingModule({
            providers: [IdentityService,
                {provide: LocalStorageService, useValue: mockLocalStorageService}]
        });
    });

    describe('setCurrentIdentity', () => {
        it('should set current identity', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            let idCardMock = sinon.createStubInstance(IdCard);
            idCardMock.getConnectionProfile.returns({name: 'hlfv1'});
            idCardMock.getEnrollmentCredentials.returns({id: 'admin', secret: 'adminpw'});
            let nextCurrentIdentitySpy = sinon.stub(service['_currentIdentity'], 'next');

            service.setCurrentIdentity('qpn-hlfv1', idCardMock);

            tick();

            nextCurrentIdentitySpy.should.have.been.called;
            service['currentQualifiedProfileName'].should.equal('qpn-hlfv1');
            service['currentConnectionProfile'].should.deep.equal({name: 'hlfv1'});
            service['currentEnrollmentCredentials'].should.deep.equal({id: 'admin', secret: 'adminpw'});
        })));
    });

    describe('getCurrentConnectionProfile', () => {
        it('should get the current connection profile', inject([IdentityService], (service: IdentityService) => {
            service['currentConnectionProfile'] = {name: 'hlfv1'};

            let result = service.getCurrentConnectionProfile();

            result.should.deep.equal({name: 'hlfv1'});
        }));
    });

    describe('getCurrentQualifiedProfileName', () => {
        it('should get the current qualified profile name', inject([IdentityService], (service: IdentityService) => {
            service['currentQualifiedProfileName'] = 'qpn-hlfv1';

            let result = service.getCurrentQualifiedProfileName();

            result.should.equal('qpn-hlfv1');
        }));
    });

    describe('getCurrentEnrollmentCredentials', () => {
        it('should get the current qualified profile name', inject([IdentityService], (service: IdentityService) => {
            service['currentEnrollmentCredentials'] = {id: 'admin', secret: 'adminpw'};

            let result = service.getCurrentEnrollmentCredentials();

            result.should.deep.equal({id: 'admin', secret: 'adminpw'});
        }));
    });

    describe('getLoggedIn', () => {
        it('should get logged in flag from local storage', inject([IdentityService], (service: IdentityService) => {
            mockLocalStorageService.get.returns(true);

            let result = service.getLoggedIn();

            result.should.equal(true);
        }));
    });

    describe('setLoggedIn', () => {
        it('should set logged in flag from local storage', inject([IdentityService], (service: IdentityService) => {
            service.setLoggedIn(true);

            mockLocalStorageService.set.should.have.been.called;
        }));
    });
});
