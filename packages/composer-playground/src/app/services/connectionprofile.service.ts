import { Injectable } from '@angular/core';

import { ConnectionProfileStoreService } from './connectionProfileStores/connectionprofilestore.service';

import { AdminConnection } from 'composer-admin';
import { version } from '../../../package.json';

@Injectable()
export class ConnectionProfileService {

    private adminConnection: AdminConnection;
    private currentCertificate: string;
    private currentHostname: string;

    constructor(private connectionProfileStoreService: ConnectionProfileStoreService) {
    }

    createProfile(name, connectionProfile): Promise<any> {
        return this.getAdminConnection().getProfile(name)
            .catch(() => {
                // It doesn't exist, so create it.
                return this.getAdminConnection().createProfile(name, connectionProfile);
            });
    }

    getProfile(name): Promise<any> {
        return this.getAdminConnection().getProfile(name);
    }

    deleteProfile(name): Promise<any> {
        return this.getAdminConnection().deleteProfile(name);
    }

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
            this.adminConnection = new AdminConnection({
                connectionProfileStore: this.connectionProfileStoreService.getConnectionProfileStore()
            });
        }

        return this.adminConnection;
    }
}
