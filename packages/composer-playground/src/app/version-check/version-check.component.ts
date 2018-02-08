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
import { Component, NgZone } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageService } from 'angular-2-local-storage';
import { IdentityCardService } from '../services/identity-card.service';
import { IdCard } from 'composer-common';

@Component({
    selector: 'version-check-modal',
    templateUrl: './version-check.component.html',
    styleUrls: ['./version-check.component.scss'.toString()]
})
export class VersionCheckComponent {

    constructor(public activeModal: NgbActiveModal,
                private zone: NgZone,
                private localStorageService: LocalStorageService,
                private identityCardService: IdentityCardService) {
    }

    public clearLocalStorage() {
        this.identityCardService.getIdentityCards(true).then((idCards: Map<string, IdCard>) => {
            let cardRefs = Array.from(idCards.keys())
                .filter((cardRef) => {
                    return idCards.get(cardRef).getConnectionProfile()['x-type'] === 'web';
                });

            return cardRefs.reduce((promise, cardRef) => {
                return promise.then(() => {
                    let idCard = idCards.get(cardRef);
                    let bn = idCard.getBusinessNetworkName();
                    if (bn) {
                        return indexedDB.deleteDatabase('_pouch_Composer:' + bn);
                    }
                });
            }, Promise.resolve(null))
                .then(() => {
                    return indexedDB.deleteDatabase('_pouch_Composer');
                })
                .then(() => {
                    if (this.localStorageService.clearAll()) {
                        this.zone.runOutsideAngular(() => {
                            location.reload();
                        });
                    } else {
                        throw new Error('Failed to clear local storage');
                    }
                });
        });
    }
}
