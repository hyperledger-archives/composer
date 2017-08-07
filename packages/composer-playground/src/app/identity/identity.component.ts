import { Component, OnInit } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteComponent } from '../basic-modals/delete-confirm/delete-confirm.component';

import { AddIdentityComponent } from './add-identity';
import { IssueIdentityComponent } from './issue-identity';
import { IdentityIssuedComponent } from './identity-issued';
import { AlertService } from '../basic-modals/alert.service';
import { IdentityCardService } from '../services/identity-card.service';
import { ClientService } from '../services/client.service';
import { WalletService } from '../services/wallet.service';

@Component({
    selector: 'identity',
    templateUrl: './identity.component.html',
    styleUrls: [
        './identity.component.scss'.toString()
    ]
})
export class IdentityComponent implements OnInit {

    myIdentities: string[] = [];
    allIdentities: Object[]; // array of all IDs
    currentIdentity: string = null;
    private deployedPackageName;

    constructor(private modalService: NgbModal,
                private alertService: AlertService,
                private identityCardService: IdentityCardService,
                private clientService: ClientService,
                private walletService: WalletService) {

    }

    ngOnInit(): Promise<any> {
        this.deployedPackageName = this.clientService.getMetaData().getName();
        return this.loadAllIdentities();
    }

    loadAllIdentities() {
        return this.loadMyIdentities()
            .then(() => {
                return this.clientService.ensureConnected();
            }).then(() => {
                return this.clientService.getBusinessNetworkConnection().getIdentityRegistry();
            }).then((registry) => {
                return registry.getAll();
            }).then((ids) => {
                this.allIdentities = ids;
            }).catch((error) => {
                this.alertService.errorStatus$.next(error);
            });
    }

    loadMyIdentities() {
        let enrollmentCredentials = this.identityCardService.getCurrentEnrollmentCredentials();

        if (enrollmentCredentials) {
            this.currentIdentity = enrollmentCredentials.id;
        }

        return Promise.resolve();
    }

    issueNewId() {
        this.modalService.open(IssueIdentityComponent).result.then((result) => {
            if (result) {
                const modalRef = this.modalService.open(IdentityIssuedComponent);
                modalRef.componentInstance.userID = result.userID;
                modalRef.componentInstance.userSecret = result.userSecret;

                return modalRef.result;
            }
        }, (reason) => {
            if (reason && reason !== 1) { // someone hasn't pressed escape
                this.alertService.errorStatus$.next(reason);
            }
        })
            .then(() => {
                return this.loadAllIdentities();
            }, (reason) => {
                this.alertService.errorStatus$.next(reason);
            });
    }

    setCurrentIdentity(newIdentity: string) {
        this.currentIdentity = newIdentity;

        return Promise.resolve();
    }

    removeIdentity(userID: string) {

        // show confirm/delete dialog first before taking action
        const confirmModalRef = this.modalService.open(DeleteComponent);
        confirmModalRef.componentInstance.headerMessage = 'Remove ID';
        confirmModalRef.componentInstance.fileAction = 'remove';
        confirmModalRef.componentInstance.fileType = 'ID';
        confirmModalRef.componentInstance.fileName = userID;
        confirmModalRef.componentInstance.deleteMessage = 'Take care when removing IDs: you usually cannot re-add them. Make sure you leave at least one ID that can be used to issue new IDs.';
        confirmModalRef.componentInstance.confirmButtonText = 'Remove';

        let connectionProfile = this.identityCardService.getCurrentConnectionProfile();
        let profileName = this.identityCardService.getQualifiedProfileName(connectionProfile);

        confirmModalRef.result
            .then((result) => {
                if (result) {
                    this.alertService.busyStatus$.next({
                        title: 'Removing ID',
                        text: 'Removing identity ' + userID + ' from your wallet'
                    });

                    return this.walletService.removeFromWallet(profileName, userID)
                        .then(() => {
                            return this.loadAllIdentities();
                        })
                        .then(() => {
                            // Send alert
                            this.alertService.busyStatus$.next(null);
                            this.alertService.successStatus$.next({
                                title: 'Removal Successful',
                                text: userID + ' was successfully removed.',
                                icon: '#icon-trash_32'
                            });
                        })
                        .catch((error) => {
                            this.alertService.errorStatus$.next(error);
                        });
                }
            }, (reason) => {
                // runs this when user presses 'cancel' button on the modal
                if (reason && reason !== 1) {
                    this.alertService.busyStatus$.next(null);
                    this.alertService.errorStatus$.next(reason);
                }
            });
    }

    revokeIdentity(identity) {

        // show confirm/delete dialog first before taking action
        const confirmModalRef = this.modalService.open(DeleteComponent);
        confirmModalRef.componentInstance.headerMessage = 'Revoke Identity';
        confirmModalRef.componentInstance.fileAction = 'revoke the permissions for';
        confirmModalRef.componentInstance.fileType = 'identity';
        confirmModalRef.componentInstance.fileName = identity.name;
        confirmModalRef.componentInstance.deleteMessage = 'Are you sure you want to do this?';
        confirmModalRef.componentInstance.confirmButtonText = 'Revoke';

        confirmModalRef.result
            .then((result) => {
                if (result) {
                    this.alertService.busyStatus$.next({
                        title: 'Revoking identity within business network',
                        text: 'Revoking identity ' + identity.name
                    });

                    return this.clientService.revokeIdentity(identity)
                        .then(() => {
                            return this.removeIdentity(identity.name);
                        })
                        .then(() => {
                            return this.loadAllIdentities();
                        })
                        .then(() => {
                            // Send alert
                            this.alertService.busyStatus$.next(null);
                            this.alertService.successStatus$.next({
                                title: 'Revoke Successful',
                                text: identity.name + ' was successfully revoked.',
                                icon: '#icon-trash_32'
                            });
                        })
                        .catch((error) => {
                            this.alertService.busyStatus$.next(null);
                            this.alertService.errorStatus$.next(error);
                        });
                }
            }, (reason) => {
                // runs this when user presses 'cancel' button on the modal
                if (reason && reason !== 1) {
                    this.alertService.busyStatus$.next(null);
                    this.alertService.errorStatus$.next(reason);
                }
            });
    }
}
