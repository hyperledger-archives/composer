import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService } from '../services/identity.service';
import { AdminService } from '../services/admin.service';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';
import { AlertService } from '../basic-modals/alert.service';
import { DeleteComponent } from '../basic-modals/delete-confirm/delete-confirm.component';
import { WalletService } from '../services/wallet.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DrawerService } from '../common/drawer';
import { ImportIdentityComponent } from './import-identity';

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
    private showSubScreen: boolean = false;
    private showDeployNetwork: boolean = false;

    constructor(private identityService: IdentityService,
                private router: Router,
                private adminService: AdminService,
                private connectionProfileService: ConnectionProfileService,
                private clientService: ClientService,
                private initializationService: InitializationService,
                private walletService: WalletService,
                private modalService: NgbModal,
                private drawerService: DrawerService,
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
        this.showSubScreen = true;
        this.editingConectionProfile = connectionProfile;
    }

    finishedEditingConnectionProfile(): Promise<void> {
        this.showSubScreen = false;
        delete this.editingConectionProfile;
        return this.loadConnectionProfiles();
    }

    closeSubView(): void {
        this.showSubScreen = false;
        delete this.editingConectionProfile;
        this.showDeployNetwork = false;
    }

    deployNetwork(connectionProfile) {
        this.connectionProfileService.setCurrentConnectionProfile(connectionProfile.name);
        // TODO this needs to be done dynmaically
        this.identityService.setCurrentIdentity('admin');
        this.showSubScreen = true;
        this.showDeployNetwork = true;
    }

    finishedDeploying() {
        this.showSubScreen = false;
        this.showDeployNetwork = false;
    }

    removeIdentity(connectionProfile, userId): void {
        const confirmModalRef = this.modalService.open(DeleteComponent);
        confirmModalRef.componentInstance.headerMessage = 'Remove ID Card';
        confirmModalRef.componentInstance.fileName = userId;
        confirmModalRef.componentInstance.fileType = 'ID Card';
        confirmModalRef.componentInstance.deleteMessage = 'Are you sure you want to do this?';
        confirmModalRef.componentInstance.deleteFrom = 'My Wallet';
        confirmModalRef.componentInstance.confirmButtonText = 'Remove';

        confirmModalRef.result
            .then((result) => {
                if (result) {
                    this.alertService.busyStatus$.next({
                        title: 'Removing ID card',
                        text: 'removing the ID card ' + userId
                    });
                    this.walletService.removeFromWallet(connectionProfile, userId)
                        .then(() => {
                            this.loadConnectionProfiles();
                            this.alertService.busyStatus$.next(null);
                            this.alertService.successStatus$.next({
                                title: 'ID Card Removed',
                                text: 'The ID card was successfully removed from My Wallet.',
                                icon: '#icon-trash_32'
                            });
                        })
                        .catch((error) => {
                            this.alertService.busyStatus$.next(null);
                            this.alertService.errorStatus$.next(error);
                        });
                }
            }, (reason) => {
                if (reason && reason !== 1) {
                    this.alertService.busyStatus$.next(null);
                    this.alertService.errorStatus$.next(reason);
                }
            });
    }
}
