import { Component, Input, OnInit } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ConfigService } from '../../services/config.service';
import { IdentityCardService } from '../../services/identity-card.service';
import { InitializationService } from '../../services/initialization.service';

import { IdCard } from 'composer-common';

@Component({
    selector: 'identity-issued-modal',
    templateUrl: './identity-issued.component.html',
    styleUrls: [
        './identity-issued.component.scss'.toString()
    ]
})
export class IdentityIssuedComponent implements OnInit {

    @Input() userID: string;
    @Input() userSecret: string;

    private newCard: IdCard;
    private newIdentity: string;

    constructor(private activeModal: NgbActiveModal,
                private identityCardService: IdentityCardService) {
    }

    ngOnInit() {
        let currentCard = this.identityCardService.getCurrentIdentityCard();
        let connectionProfile = currentCard.getConnectionProfile();
        let businessNetworkName = currentCard.getBusinessNetworkName();

        let newCardData = {
            version: 1,
            userName: this.userID,
            enrollmentSecret: this.userSecret,
            businessNetwork: businessNetworkName
        };

        this.newCard = new IdCard(newCardData, connectionProfile);

        this.newIdentity = this.userID + '\n' + this.userSecret;
    }

    addToWallet(): void {
        this.activeModal.close({
            choice: 'add',
            card: this.newCard
        });
    }

    export(): void {
        this.activeModal.close({
            choice: 'export',
            card: this.newCard
        });
    }
}
