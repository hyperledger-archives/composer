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
        let nextCurrentIdentitySpy;
        const setupTest = (service: IdentityService) => {
            let idCardMock = sinon.createStubInstance(IdCard);
            idCardMock.getConnectionProfile.returns({name: 'hlfv1'});
            idCardMock.getEnrollmentCredentials.returns({secret: 'adminpw'});
            idCardMock.getUserName.returns('admin');
            nextCurrentIdentitySpy = sinon.stub(service['_currentIdentity'], 'next');

            service.setCurrentIdentity('qpn-hlfv1', idCardMock);

            tick();
        };

        it('should update _currentIdentity', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            setupTest(service);
            nextCurrentIdentitySpy.should.have.been.calledWith('admin');
        })));

        it('should update qualified profile name', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            setupTest(service);
            service.getCurrentQualifiedProfileName().should.equal('qpn-hlfv1');
        })));

        it('should update connection profile', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            setupTest(service);
            service.getCurrentConnectionProfile().should.deep.equal({name: 'hlfv1'});
        })));

        it('should update enrollment credentials', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            setupTest(service);
            service.getCurrentEnrollmentCredentials().should.deep.equal({secret: 'adminpw'});
        })));

        it('should update user name', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            setupTest(service);
            service.getCurrentUserName().should.equal('admin');
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
