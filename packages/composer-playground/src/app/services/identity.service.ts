import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';

import { ConnectionProfileService } from './connectionprofile.service';
import { WalletService } from './wallet.service';

@Injectable()
export class IdentityService {

    constructor(private localStorageService: LocalStorageService,
                private connectionProfileService: ConnectionProfileService,
                private walletService: WalletService) {
    }

    getCurrentIdentities(): Promise<string[]> {
        let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        return this.getIdentities(connectionProfile);
    }

    getIdentities(connectionProfile: string): Promise<string[]> {
        let wallet = this.walletService.getWallet(connectionProfile);
        return wallet.list()
        .then((identities) => {
            return identities.sort();
        });
    }

    getCurrentIdentity(): Promise<string> {
        let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        return this.getIdentity(connectionProfile);
    }

    getIdentity(connectionProfile: string): Promise<string> {
        let key = `currentIdentity:${connectionProfile}`;
        let result = this.localStorageService.get<string>(key);
        return this.getIdentities(connectionProfile)
        .then((identities) => {
            if (identities.indexOf(result) > -1) {
                return result;
            } else if (identities.length > 0) {
                result = identities[0];
                this.setIdentity(connectionProfile, result);
                return result;
            } else {
                return null;
            }
        });
    }

    setCurrentIdentity(identity: string) {
        let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        return this.setIdentity(connectionProfile, identity);
    }

    setIdentity(connectionProfile: string, identity: string) {
        let key = `currentIdentity:${connectionProfile}`;
        this.localStorageService.set(key, identity);
    }

    getUserID(): Promise<string> {
        return this.getCurrentIdentity();
    }

    getUserSecret(): Promise<string> {
        return this.getCurrentIdentity()
        .then((identity) => {
            let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
            let wallet = this.walletService.getWallet(connectionProfile);
            return wallet.get(identity);
        });
    }

}
