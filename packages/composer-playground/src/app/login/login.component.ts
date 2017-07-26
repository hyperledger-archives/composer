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
import { IdentityCardService } from '../services/identity-card.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DrawerService } from '../common/drawer';
import { ImportIdentityComponent } from './import-identity';

import { IdCard } from 'composer-common';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: [
        './login.component.scss'.toString()
    ]
})
export class LoginComponent implements OnInit {

    private connectionProfileRefs: string[];
    private connectionProfileNames: Map<string, string>;
    private idCardRefs: Map<string, string[]>;
    private idCards: Map<string, IdCard>;
    private showDeployNetwork: boolean = false;
    private editingConnectionProfile = null;
    private targetProfileName: string = null;
    private addIdCard: boolean = false;
    private creatingIdCard: boolean = false;
    private editingIdCard: boolean = false;
    private creatingIdWithProfile: boolean = false;
    private showSubScreen: boolean = false;

    constructor(private identityService: IdentityService,
                private router: Router,
                private adminService: AdminService,
                private connectionProfileService: ConnectionProfileService,
                private clientService: ClientService,
                private initializationService: InitializationService,
                private walletService: WalletService,
                private identityCardService: IdentityCardService,
                private modalService: NgbModal,
                private drawerService: DrawerService,
                private alertService: AlertService) {

    }

    ngOnInit() {
        return this.initializationService.initialize()
            .then(() => {
                return this.loadIdentityCards();
            });
    }

    loadIdentityCards(): Promise<void> {
        return this.identityCardService.getIdentityCards().then((cards) => {
            this.idCards = cards;
            this.connectionProfileNames = new Map<string, string>();

            let newCardRefs = Array.from(cards.keys())
                .map((cardRef) => {
                    let connectionProfile = cards.get(cardRef).getConnectionProfile();
                    let connectionProfileRef: string = this.identityCardService.getQualifiedProfileName(connectionProfile);
                    if (!this.connectionProfileNames.has(connectionProfileRef)) {
                        this.connectionProfileNames.set(connectionProfileRef, connectionProfile.name);
                    }

                    return [connectionProfileRef, cardRef];
                })
                .reduce((prev, cur) => {
                    let curCardRefs: string[] = prev.get(cur[0]) || [];
                    let cardRef: string = <string> cur[1];
                    return prev.set(cur[0], [...curCardRefs, cardRef]);
                }, new Map<string, string[]>());

            this.idCardRefs = newCardRefs;
            this.connectionProfileRefs = Array.from(this.connectionProfileNames.keys());
        }).catch((error) => {
            this.alertService.errorStatus$.next(error);
        });
    }

    changeIdentity(cardRef: string): Promise<boolean | void> {
        let card = this.idCards.get(cardRef);
        let businessNetworkName = card.getBusinessNetworkName();

        return this.identityCardService.setCurrentIdentityCard(cardRef)
            .then(() => {
                return this.clientService.ensureConnected(businessNetworkName, true);
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
        this.editingConnectionProfile = connectionProfile;
    }

    finishedEditingConnectionProfile(result): Promise<void> {
        if (result.update === false || !this.creatingIdWithProfile) {
            this.closeSubView();
            return this.loadIdentityCards();
        } else {
            delete this.editingConnectionProfile;
            this.addIdToExistingProfileName(result.connectionProfile.name);
        }
    }

    closeSubView(): void {
        this.showSubScreen = false;
        this.showDeployNetwork = false;
        this.creatingIdCard = false;
        this.editingIdCard = false;
        this.creatingIdWithProfile = false;
        delete this.editingConnectionProfile;
        delete this.targetProfileName;
    }

    createIdCard(): void {
        this.showSubScreen = true;
        this.creatingIdCard = true;
    }

    addIdToExistingProfileName(connectionProfileName): void {
        this.targetProfileName = connectionProfileName;
        this.creatingIdCard = false;
        this.editingIdCard = true;
    }

    addIdToNewProfile(connectionProfile): void {
        this.editingConnectionProfile = connectionProfile;
        this.creatingIdCard = false;
        this.creatingIdWithProfile = true;
    }

    completeCardAddition() {
        this.closeSubView();
        return this.loadIdentityCards();
    }

    deployNetwork(connectionProfile) {
        // this.connectionProfileService.setCurrentConnectionProfile(connectionProfile.name);
        // TODO this needs to be done dynmaically
        this.showSubScreen = true;
        this.showDeployNetwork = true;
    }

    finishedDeploying() {
        this.showSubScreen = false;
        this.showDeployNetwork = false;
    }

    removeIdentity(cardRef): void {
        let userId: string = this.idCards.get(cardRef).getName();
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

                    this.identityCardService.deleteIdentityCard(cardRef)
                        .then(() => {
                            this.alertService.busyStatus$.next(null);
                            this.alertService.successStatus$.next({
                                title: 'ID Card Removed',
                                text: 'The ID card was successfully removed from My Wallet.',
                                icon: '#icon-trash_32'
                            });

                            return this.loadIdentityCards();
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
