import { Component, Input } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IdentityCardService } from '../../services/identity-card.service';
import { WalletService } from '../../services/wallet.service';

@Component({
    selector: 'identity-issued-modal',
    templateUrl: './identity-issued.component.html',
    styleUrls: [
        './identity-issued.component.scss'.toString()
    ]
})
export class IdentityIssuedComponent {

    @Input() userID: string;
    @Input() userSecret: string;

    constructor(private activeModal: NgbActiveModal,
                private identityCardService: IdentityCardService,
                private walletService: WalletService) {

    }

    addToWallet() {
        let connectionProfile = this.identityCardService.getCurrentConnectionProfile();
        let connectionProfileRef = this.identityCardService.getQualifiedProfileName(connectionProfile);
        let wallet = this.walletService.getWallet(connectionProfileRef);

        return wallet.contains(this.userID)
        .then((inWallet) => {
            if (inWallet) {
                return wallet.update(this.userID, this.userSecret);
            } else {
                return wallet.add(this.userID, this.userSecret);
            }
        })
        .then(() => {
            this.activeModal.close();
        })
        .catch((error) => {
            this.activeModal.dismiss(error);
        });
    }
}
