import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';

import { AdminConnection } from 'composer-admin';

import { WalletService } from './wallet.service';
import { version } from '../../../package.json';

@Injectable()
export class ConnectionProfileService {

    private adminConnection: AdminConnection;
    private currentCertificate: string;
    private currentHostname: string;

    constructor(private localStorageService: LocalStorageService,
                private walletService: WalletService) {
    }

    getCurrentConnectionProfile(): string {
        let result = this.localStorageService.get<string>('currentConnectionProfile');
        if (result === null) {
            result = '$default';
        }
        return result;
    }

    setCurrentConnectionProfile(connectionProfile: string) {
        this.localStorageService.set('currentConnectionProfile', connectionProfile);
    }

    createProfile(name, connectionProfile): Promise<any> {
        return this.getAdminConnection().createProfile(name, connectionProfile);
    }

    getProfile(name): Promise<any> {
        return this.getAdminConnection().getProfile(name);
    }

    deleteProfile(name): Promise<any> {
        return this.getAdminConnection().deleteProfile(name);
    }

    createDefaultProfile(): Promise<any> {
        // Check to see if the default connection profile exists.
        console.log('Currently running version ' + version);
        console.log('Checking for $default connection profile');
        return this.getAdminConnection().getProfile('$default')
            .catch((error) => {
                // It doesn't exist, so create it.
                console.log('$default connection profile does not exist, creating');
                return this.getAdminConnection().createProfile('$default', {type: 'web'})
                    .then(() => {
                        return this.walletService.getWallet('$default').add('admin', 'adminpw');
                    });
            });
    };

    getAllProfiles(): Promise<any> {
        return this.getAdminConnection().getAllProfiles();
    }

    getCertificate(): string {
        return this.currentCertificate;
    }

    setCertificate(cert: string) {
        this.currentCertificate = cert;
    }

    private getAdminConnection() {
        if (!this.adminConnection) {
            this.adminConnection = new AdminConnection();
        }

        return this.adminConnection;
    }
}
