import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService } from '../services/identity.service';
import { AdminService } from '../services/admin.service';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: [
        './login.component.scss'.toString()
    ]
})
export class LoginComponent implements OnInit {

    private identities = {};
    private connectionProfiles = [];

    constructor(private identityService: IdentityService,
                private router: Router,
                private adminService: AdminService,
                private connectionProfileService: ConnectionProfileService,
                private clientService: ClientService,
                private initializationService: InitializationService) {

    }

    ngOnInit() {
        return this.initializationService.initialize()
            .then(() => {
                return this.connectionProfileService.getAllProfiles();
            })
            .then((profiles) => {
                this.connectionProfiles = Object.keys(profiles);
                this.connectionProfiles.forEach((profile) => {
                    this.identities[profile] = [];
                    return this.identityService.getIdentities(profile)
                        .then((identities) => {
                            identities.forEach((identity) => {
                                this.identities[profile].push({
                                    userId: identity,
                                    connectionProfile: profile,
                                    businessNetwork: 'org-acme-biznet'
                                });
                            });
                        });
                });
            });
    }

    changeIdentity(identity): Promise<boolean> {
        this.connectionProfileService.setCurrentConnectionProfile(identity.connectionProfile);
        this.identityService.setCurrentIdentity(identity.userId);
        return this.adminService.list()
            .then((businessNetworks) => {
                return this.clientService.ensureConnected(businessNetworks[0], true);
            })
            .then(() => {
                this.identityService.setLoggedIn(true);
                return this.router.navigate(['editor']);
            });
    }
}
