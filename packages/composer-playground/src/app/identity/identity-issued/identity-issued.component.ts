import { Component, Input } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IdentityCardService } from '../../services/identity-card.service';

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
                private identityCardService: IdentityCardService) {

    }

    addToWallet(): Promise<void> {
        let connectionProfile = this.identityCardService.getCurrentIdentityCard().getConnectionProfile();
        let businessNetworkName = this.identityCardService.getCurrentIdentityCard().getBusinessNetworkName();
        let credentials = this.identityCardService.getCurrentIdentityCard().getCredentials();

        return this.identityCardService.createIdentityCard(this.userID, businessNetworkName, this.userID, this.userSecret, connectionProfile, credentials)
            .then(() => {
                this.activeModal.close();
            })
            .catch((error) => {
                this.activeModal.dismiss(error);
            });
    }
}
