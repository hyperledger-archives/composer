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
import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IdentityCardService } from '../../services/identity-card.service';

import { IdCard } from 'composer-common';

@Component({
    selector: 'upgrade-modal',
    templateUrl: './upgrade.component.html',
    styleUrls: ['./upgrade.component.scss'.toString()]
})
export class UpgradeComponent implements OnInit {

    private peerCards: IdCard[] = [];
    private channelCards: IdCard[] = [];
    private selectedPeerCardName: string;
    private selectedChannelCardName: string;
    private selectedPeerCard: IdCard;
    private selectedChannelCard: IdCard;

    constructor(private activeModal: NgbActiveModal,
                private identityCardService: IdentityCardService) {
    }

    ngOnInit(): void {
        let currentCard = this.identityCardService.getCurrentIdentityCard();

        let qpn = this.identityCardService.getQualifiedProfileName(currentCard.getConnectionProfile());
        let peerCardRefs = this.identityCardService.getIdentityCardRefsWithProfileAndRole(qpn, 'PeerAdmin');
        peerCardRefs.forEach((cardRef) => {
            let card = this.identityCardService.getIdentityCard(cardRef);
            this.peerCards.push(card);

        });

        let channelCardRefs = this.identityCardService.getIdentityCardRefsWithProfileAndRole(qpn, 'ChannelAdmin');
        channelCardRefs.forEach((cardRef) => {
            let card = this.identityCardService.getIdentityCard(cardRef);
            this.channelCards.push(card);
        });

        if (this.peerCards.length > 0) {
            this.selectedPeerCard = this.peerCards[0];
            this.selectedPeerCardName = this.selectedPeerCard.getUserName();
        }

        if (this.channelCards.length > 0) {
            this.selectedChannelCard = this.channelCards[0];
            this.selectedChannelCardName = this.selectedChannelCard.getUserName();
        }
    }

    onPeerCardSelect(card) {
        this.selectedPeerCard = card;
        this.selectedPeerCardName = this.selectedPeerCard.getUserName();
    }

    onChannelCardSelect(card) {
        this.selectedChannelCard = card;
        this.selectedChannelCardName = this.selectedChannelCard.getUserName();
    }

    upgrade() {
        this.activeModal.close({peer: this.selectedPeerCard, channel: this.selectedChannelCard});
    }
}
