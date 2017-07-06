import { Component, OnInit } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AddIdentityComponent } from './add-identity';
import { IssueIdentityComponent } from './issue-identity';
import { IdentityIssuedComponent } from './identity-issued';
import { AlertService } from '../basic-modals/alert.service';
import { IdentityService } from '../services/identity.service';
import { ClientService } from '../services/client.service';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { WalletService } from '../services/wallet.service';

@Component({
    selector: 'identity',
    templateUrl: './identity.component.html',
    styleUrls: [
        './identity.component.scss'.toString()
    ]
})
export class IdentityComponent implements OnInit {

    identities: string[];
    currentIdentity: string = null;

    constructor(private modalService: NgbModal,
                private alertService: AlertService,
                private identityService: IdentityService,
                private clientService: ClientService,
                private connectionProfileService: ConnectionProfileService,
                private walletService: WalletService) {

    }

    ngOnInit(): Promise<any> {
        return this.loadIdentities();
    }

    loadIdentities() {
        return this.identityService.getCurrentIdentities()
            .then((currentIdentities) => {
                this.identities = currentIdentities;

                return this.identityService.getCurrentIdentity();
            })
            .then((currentIdentity) => {
                this.currentIdentity = currentIdentity;
            })
            .catch((error) => {
                this.alertService.errorStatus$.next(error);
            });
    }

    addId() {
        this.modalService.open(AddIdentityComponent).result.then((result) => {
            return this.loadIdentities();
        }, (reason) => {
            if (reason && reason !== 1) { // someone hasn't pressed escape
                this.alertService.errorStatus$.next(reason);
            }
        });
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
                return this.loadIdentities();
            }, (reason) => {
                this.alertService.errorStatus$.next(reason);
            });
    }

    setCurrentIdentity(newIdentity: string) {
        if (this.currentIdentity === newIdentity) {
            return Promise.resolve();
        }

        this.identityService.setCurrentIdentity(newIdentity);
        this.currentIdentity = newIdentity;

        this.alertService.busyStatus$.next({title: 'Reconnecting...', text: 'Using identity ' + this.currentIdentity});
        return this.clientService.ensureConnected(null, true)
            .then(() => {
                this.alertService.busyStatus$.next(null);
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                this.alertService.errorStatus$.next(error);
            });
    }

    removeIdentity(userID: string) {
        let profileName = this.connectionProfileService.getCurrentConnectionProfile();
        return this.walletService.removeFromWallet(profileName, userID)
            .then(() => {
                return this.loadIdentities();
            })
            .catch((error) => {
                this.alertService.errorStatus$.next(error);
            });
    }
}
