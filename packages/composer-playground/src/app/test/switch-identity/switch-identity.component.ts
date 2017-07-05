import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ConnectionProfileService } from '../../services/connectionprofile.service';
import { WalletService } from '../../services/wallet.service';
import { IdentityService } from '../../services/identity.service';
import { ClientService } from '../../services/client.service';

@Component({
    selector: 'switch-identity-modal',
    templateUrl: './switch-identity.component.html',
    styleUrls: ['./switch-identity.component.scss'.toString()]
})

export class SwitchIdentityComponent implements OnInit {

    @Input()
    connectionProfileName: string;

    private userID: string = null;
    private userSecret: string = null;
    private chosenIdentity = null;
    private switchInProgress: boolean = false;
    private showWalletView: boolean = true;
    private identities = [];

    constructor(private connectionProfileService: ConnectionProfileService,
                private walletService: WalletService,
                private activeModal: NgbActiveModal,
                private identityService: IdentityService,
                private clientService: ClientService) {

    }

    ngOnInit() {
        return this.identityService.getIdentities(this.connectionProfileName)
        .then((identities) => {
            this.identities = identities;
            if (this.identities && this.identities.length > 0) {
                this.chosenIdentity = this.identities[0];
            }
        })
        .catch((error) => {
            this.activeModal.dismiss(error);
        });
    }

    switchIdentity() {
        this.switchInProgress = true;

        let switchIdentityPromise;

        let chosenUser;

        if (this.showWalletView) {
            chosenUser = this.chosenIdentity;
            switchIdentityPromise = Promise.resolve();
        } else {
            let wallet = this.walletService.getWallet(this.connectionProfileName);

            switchIdentityPromise = wallet.contains(this.userID)
            .then((contains) => {
                chosenUser = this.userID;
                if (contains) {
                    return wallet.update(this.userID, this.userSecret);
                } else {
                    return wallet.add(this.userID, this.userSecret);
                }
            });
        }

        switchIdentityPromise.then(() => {
            this.connectionProfileService.setCurrentConnectionProfile(this.connectionProfileName);
            this.identityService.setCurrentIdentity(chosenUser);

            return this.clientService.ensureConnected(true);
        })
        .then(() => {
            this.switchInProgress = false;
            this.activeModal.close();
        })
        .catch((error) => {
            this.switchInProgress = false;
            this.activeModal.dismiss(error);

        });

        return switchIdentityPromise;
    }

    showWallet(showWallet: boolean) {
        this.showWalletView = showWallet;
    }
}
