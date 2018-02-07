/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, Input, OnInit } from '@angular/core';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IdentityCardService } from '../../services/identity-card.service';

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
    private newCardRef: string;
    private newIdentity: string;

    private cardName: string = null;
    private cardNameValid: boolean = true;

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

        this.newCardRef = this.identityCardService.currentCard;

        this.newCard = new IdCard(newCardData, connectionProfile);

        this.newIdentity = this.userID + '\n' + this.userSecret;
    }

    addToWallet(): Promise<void> {
        return this.identityCardService.addIdentityCard(this.newCard, this.cardName)
            .then((cardRef: string) => {
                this.activeModal.close({
                    choice: 'add',
                    cardRef: cardRef
                });
            })
            .catch((error) => {
                if (error.message.startsWith('Card already exists: ')) {
                    this.cardNameValid = false;
                } else {
                    this.activeModal.dismiss(error);
                }
            });
    }

    export(): void {
        this.activeModal.close({
            choice: 'export',
            card: this.newCard
        });
    }

    private setCardName(name) {
        if (this.cardName !== name) {
            this.cardName = name;
            this.cardNameValid = true;
        }
    }
}
