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

    private peerCardRefs: string[] = [];
    private channelCardRefs: string[] = [];
    private selectedPeerCardRef: string;
    private selectedChannelCardRef: string;

    constructor(private activeModal: NgbActiveModal,
                private identityCardService: IdentityCardService) {
    }

    ngOnInit(): void {
        let currentCard = this.identityCardService.getCurrentIdentityCard();

        let qpn = this.identityCardService.getQualifiedProfileName(currentCard.getConnectionProfile());
        this.peerCardRefs = this.identityCardService.getIdentityCardRefsWithProfileAndRole(qpn, 'PeerAdmin');
        this.channelCardRefs = this.identityCardService.getIdentityCardRefsWithProfileAndRole(qpn, 'ChannelAdmin');

        if (this.peerCardRefs.length > 0) {
            this.selectedPeerCardRef = this.peerCardRefs[0];
        }

        if (this.channelCardRefs.length > 0) {
            this.selectedChannelCardRef = this.channelCardRefs[0];
        }
    }

    onPeerCardSelect(cardRef) {
        this.selectedPeerCardRef = cardRef;
    }

    onChannelCardSelect(cardRef) {
        this.selectedChannelCardRef = cardRef;
    }

    upgrade() {
        this.activeModal.close({peerCardRef: this.selectedPeerCardRef, channelCardRef: this.selectedChannelCardRef});
    }
}
