import { Inject, Injectable } from '@angular/core';

import { LocalStorageService, ILocalStorageServiceConfig } from 'angular-2-local-storage';

@Injectable()
export class IdentityCardStorageService extends LocalStorageService {
    constructor (@Inject('IDENTITY_CARD_STORAGE_SERVICE_CONFIG') config: ILocalStorageServiceConfig) {
        super(config);
    }
}
