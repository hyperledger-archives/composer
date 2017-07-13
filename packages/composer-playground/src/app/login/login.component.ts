import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService } from '../services/identity.service';
import { AdminService } from '../services/admin.service';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';
import { AlertService } from '../basic-modals/alert.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: [
        './login.component.scss'.toString()
    ]
})
export class LoginComponent implements OnInit {

    private connectionProfiles = [];
    private editingConectionProfile = null;

    constructor(private identityService: IdentityService,
                private router: Router,
                private adminService: AdminService,
                private connectionProfileService: ConnectionProfileService,
                private clientService: ClientService,
                private initializationService: InitializationService,
                private alertService: AlertService) {

    }

    ngOnInit() {
        return this.initializationService.initialize()
            .then(() => {
                return this.loadConnectionProfiles();
            });
    }

    loadConnectionProfiles(): Promise<void> {
        return this.connectionProfileService.getAllProfiles()
            .then((profiles) => {
                let newConnectionProfiles = [];
                let keys = Object.keys(profiles).sort();
                keys.forEach((key) => {
                    return this.identityService.getIdentities(key)
                        .then((identities) => {
                            let identityList = [];
                            identities.forEach((identity) => {
                                identityList.push({
                                    userId: identity,
                                    businessNetwork: 'org-acme-biznet'
                                });
                            });

                            let connectionProfile = profiles[key];
                            newConnectionProfiles.push({
                                name: key,
                                profile: connectionProfile,
                                default: key === '$default',
                                identities: identityList
                        });
                });
            });

                this.connectionProfiles = newConnectionProfiles;
            });
    }

    changeIdentity(connectionProfile, userId): Promise<boolean | void> {
        this.connectionProfileService.setCurrentConnectionProfile(connectionProfile);
        this.identityService.setCurrentIdentity(userId);
        return this.adminService.list()
            .then((businessNetworks) => {
                return this.clientService.ensureConnected(businessNetworks[0], true);
            })
            .then(() => {
                this.identityService.setLoggedIn(true);
                return this.router.navigate(['editor']);
            })
            .catch((error) => {
                this.alertService.errorStatus$.next(error);
            });

    }

    editConnectionProfile(connectionProfile): void {
        this.editingConectionProfile = connectionProfile;
    }

    finishedEditingConnectionProfile(): Promise<void> {
        delete this.editingConectionProfile;
        return this.loadConnectionProfiles();
    }
}
