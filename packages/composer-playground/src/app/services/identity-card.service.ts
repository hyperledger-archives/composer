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
import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { AdminService } from './admin.service';
import { IdCard, Logger, BusinessNetworkCardStore } from 'composer-common';

import { compact } from 'lodash';

/* tslint:disable-next-line:no-var-requires */
const uuid = require('uuid');

/* tslint:disable-next-line:no-var-requires */
const hash = require('object-hash');

const defaultCardProperties = {
    metadata: {
        version: 1,
        userName: 'admin',
        enrollmentSecret: 'adminpw',
        roles: ['PeerAdmin', 'ChannelAdmin'],
    },
    connectionProfile: {
        'name': '$default',
        'x-type': 'web'
    },
    credentials: null
};

@Injectable()
export class IdentityCardService {

    static readonly peerAdminRole = 'PeerAdmin';
    static readonly channelAdminRole = 'ChannelAdmin';

    currentCard: string;

    private idCards: Map<string, IdCard> = new Map<string, IdCard>();

    private indestructibleCards: string[] = [];

    constructor(private adminService: AdminService,
                private localStorageService: LocalStorageService) {
    }

    public getCurrentCardRef(): string {
        return this.currentCard;
    }

    public getIdentityCard(cardRef: string): IdCard {
        return this.idCards.get(cardRef);
    }

    public getCurrentIdentityCard(): IdCard {
        return this.getIdentityCard(this.currentCard);
    }

    public getIndestructibleIdentityCards(): string[] {
        return this.indestructibleCards;
    }

    public getIdentityCardRefsWithProfileAndRole(qualifiedProfileName: string, role: string): string[] {
        let cardRefs: string[] = [];
        this.idCards.forEach((card, key) => {
            let connectionProfile = card.getConnectionProfile();
            if (qualifiedProfileName === this.getQualifiedProfileName(connectionProfile) && card.getRoles().includes(role)) {
                cardRefs.push(key);
            }
        });

        return cardRefs;
    }

    public getAdminCardRef(qualifiedProfileName: string, role: string): string {
        let result;

        if (this.currentCard && this.getCurrentIdentityCard().getRoles().includes(role) && this.getQualifiedProfileName(this.getCurrentIdentityCard().getConnectionProfile()) === qualifiedProfileName) {
            // Prefer the current card if it has the required role
            result = this.getCurrentCardRef();
        } else {
            // Otherwise use the first available card with the required role if there is one
            result = this.getIdentityCardRefsWithProfileAndRole(qualifiedProfileName, role)[0];
        }

        return result;
    }

    public canDeploy(qualifiedProfileName: string): boolean {
        let peerCardRef = this.getIdentityCardRefsWithProfileAndRole(qualifiedProfileName, 'PeerAdmin')[0];

        if (!peerCardRef) {
            return false;
        }

        let channelCardRef = this.getIdentityCardRefsWithProfileAndRole(qualifiedProfileName, 'ChannelAdmin')[0];

        if (!channelCardRef) {
            return false;
        }

        return true;
    }

    public getIdentityCardForExport(cardRef: string): Promise<IdCard> {
        return this.adminService.exportCard(cardRef);
    }

    public loadIdentityCards(): Promise<number> {
        this.currentCard = null;
        this.indestructibleCards = this.getIndestructibleCardRefs();

        return this.adminService.getAllCards()
            .then((result) => {

                this.idCards = result;

                let currentCard = this.getCurrentCardRefLocalStorage();

                if (this.idCards.has(currentCard)) {
                    this.setCurrentIdentityCard(currentCard);
                } else {
                    this.setCurrentCardRefLocalStorage(null);
                }

                return this.idCards.size;

            });
    }

    public getIdentityCards(reload: boolean = false): Promise<Map<string, IdCard>> {
        if (reload) {
            return this.loadIdentityCards().then(() => {
                return this.idCards;
            });
        }
        return Promise.resolve(this.idCards);
    }

    public addInitialIdentityCards(initialCards?: IdCard[]): Promise<string[] | void> {
        initialCards = initialCards || [];

        let defaultCardObject = new IdCard(defaultCardProperties.metadata, defaultCardProperties.connectionProfile);
        defaultCardObject.setCredentials(defaultCardProperties.credentials);

        initialCards.unshift(defaultCardObject);

        let addCardPromises: Promise<any>[] = initialCards.map((card, index) => {
            let qcp = this.getQualifiedProfileName(card.getConnectionProfile());
            if (!this.getCardRefFromIdentity(card.getUserName(), card.getBusinessNetworkName(), qcp)) {
                return this.addIdentityCard(card, null, true).then((cardRef: string) => {
                    return cardRef;
                });
            }
        });

        return Promise.all(addCardPromises).then((cardRefs: string[]) => {
            return compact(cardRefs);
        });
    }

    public createIdentityCard(userName: string, cardName: string, businessNetworkName: string, enrollmentSecret: string, connectionProfile: any, credentials ?: any, roles ?: string[]): Promise<string | void> {
        const metadata: any = {
            version: 1,
            userName: userName,
            businessNetwork: businessNetworkName,
        };

        if (enrollmentSecret !== null) {
            metadata.enrollmentSecret = enrollmentSecret;
        }

        if (roles) {
            metadata.roles = roles;
        }

        let card: IdCard = new IdCard(metadata, connectionProfile);

        if (credentials) {
            card.setCredentials(credentials);
        }

        return this.addIdentityCard(card, cardName);
    }

    public addIdentityCard(card: IdCard, cardRef: string, indestructible: boolean = false): Promise<string | void> {
        if (!cardRef) {
            cardRef = BusinessNetworkCardStore.getDefaultCardName(card);
        }
        return this.adminService.importCard(cardRef, card)
            .then(() => {
                this.idCards.set(cardRef, card);
                if (indestructible) {
                    this.indestructibleCards.push(cardRef);
                    this.setIndestructibleCardRefs(this.indestructibleCards);
                }
            })
            .then(() => {
                return cardRef;
            });
    }

    public deleteIdentityCard(cardRef: string): Promise<void> {
        if (!this.idCards.has(cardRef)) {
            return Promise.reject(new Error('Identity card does not exist'));
        }

        this.idCards.delete(cardRef);
        return this.adminService.deleteCard(cardRef);
    }

    public setCurrentIdentityCard(cardRef): Promise<IdCard | void> {
        if (cardRef === null) {
            this.currentCard = null;
            this.setCurrentCardRefLocalStorage(null);
            return Promise.resolve();
        }

        if (!this.idCards.has(cardRef)) {
            return Promise.reject(new Error('Identity card does not exist'));
        }

        let card: IdCard = this.idCards.get(cardRef);

        this.currentCard = cardRef;
        this.setCurrentCardRefLocalStorage(cardRef);

        return Promise.resolve(card);
    }

    public getQualifiedProfileName(connectionProfile: any): string {
        let prefix = hash(connectionProfile);

        if ('web' === connectionProfile['x-type']) {
            return 'web-' + connectionProfile.name;
        } else {
            return prefix + '-' + connectionProfile.name;
        }
    }

    public getCardRefFromIdentity(identityName: string, businessNetworkName: string, qualifiedConnectionProfile: string): string {
        let wantedCardRef: string;
        this.idCards.forEach((card: IdCard, key: string) => {
            let qpn = this.getQualifiedProfileName(card.getConnectionProfile());
            if (qpn === qualifiedConnectionProfile && card.getBusinessNetworkName() === businessNetworkName && identityName === card.getUserName()) {
                wantedCardRef = key;
            }
        });

        return wantedCardRef;
    }

    public getAllCardsForBusinessNetwork(businessNetworkName: string, qualifiedConnectionProfile: string): Map<string, IdCard> {
        let wantedCards: Map<string, IdCard> = new Map<string, IdCard>();
        this.idCards.forEach((card: IdCard, key: string) => {
            let qpn = this.getQualifiedProfileName(card.getConnectionProfile());
            if (qpn === qualifiedConnectionProfile && card.getBusinessNetworkName() === businessNetworkName) {
                wantedCards.set(key, card);
            }
        });

        return wantedCards;
    }

    public getAllCardRefsForProfile(qualifiedConnectionProfile: string): string[] {
        let wantedCards: string[] = [];
        this.idCards.forEach((card, key) => {
            let qpn = this.getQualifiedProfileName(card.getConnectionProfile());
            if (qpn === qualifiedConnectionProfile) {
                wantedCards.push(key);
            }
        });

        return wantedCards;
    }

    getIndestructibleCardRefs(): Array<string> {
        let key = 'indestructibleCards';
        let cardRefs = JSON.parse(this.localStorageService.get(key));
        return cardRefs || [];
    }

    setIndestructibleCardRefs(cardRefs: Array<string>): void {
        let key = 'indestructibleCards';

        this.localStorageService.set(key, JSON.stringify(cardRefs));
    }

    getCurrentCardRefLocalStorage(): string {
        let key = 'currentCard';
        return this.localStorageService.get(key);
    }

    setCurrentCardRefLocalStorage(cardRef: string): void {
        let key = 'currentCard';
        this.localStorageService.set(key, cardRef);
    }
}
