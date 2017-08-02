import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';

import * as sinon from 'sinon';

import { IdentityCardStorageService } from './identity-card-storage.service';

describe('IdentityCardStorageService', () => {

    beforeEach(() => {
        let identityCardStorageServiceConfig = {
            prefix: 'idcard',
            storageType: 'localStorage'
        };

        TestBed.configureTestingModule({
            providers: [IdentityCardStorageService,
                { provide: 'IDENTITY_CARD_STORAGE_SERVICE_CONFIG', useValue: identityCardStorageServiceConfig }
            ]
        });
    });

    it('should include idcard prefix in keys', inject([IdentityCardStorageService], (service: IdentityCardStorageService) => {
        service.deriveKey('test').should.equal('idcard.test');
    }));
});
