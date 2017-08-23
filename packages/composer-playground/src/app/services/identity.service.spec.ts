/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import { IdentityService } from './identity.service';
import { LocalStorageService } from 'angular-2-local-storage';
import * as sinon from 'sinon';

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
            let nextCurrentIdentitySpy = sinon.stub(service['_currentIdentity'], 'next');
            service.setCurrentIdentity('identity1');

            tick();

            nextCurrentIdentitySpy.should.have.been.called;
        })));
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
