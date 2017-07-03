import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ConnectionProfileService } from '../../services/connectionprofile.service';
import { WalletService } from '../../services/wallet.service';

@Component({
    selector: 'add-identity-modal',
    templateUrl: './add-identity.component.html',
    styleUrls: ['./add-identity.component.scss'.toString()]
})

export class AddIdentityComponent {

    private userID: string = null;
    private userSecret: string = null;
    private addInProgress: boolean = false;

    constructor(private connectionProfileService: ConnectionProfileService,
                private walletService: WalletService,
                private activeModal: NgbActiveModal) {

    }

    addIdentity() {
        this.addInProgress = true;

        let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        let wallet = this.walletService.getWallet(connectionProfile);

        return wallet.contains(this.userID)
        .then((contains) => {
            if (contains) {
                return wallet.update(this.userID, this.userSecret);
            } else {
                return wallet.add(this.userID, this.userSecret);
            }
        })
        .then(() => {
            this.addInProgress = false;
            this.activeModal.close();
        })
        .catch((error) => {
            this.activeModal.dismiss(error);
            this.addInProgress = false;
        });
    }
}
