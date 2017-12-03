import { Injectable } from '@angular/core';

import { ClientService } from './client.service';
import { AlertService } from '../basic-modals/alert.service';
import { IdentityService } from './identity.service';
import { IdentityCardService } from './identity-card.service';
import { ConfigService } from './config.service';
import { IdCard } from 'composer-common';

@Injectable()
export class InitializationService {

    private initializingPromise: Promise<any> = null;
    private initialized = false;

    private config;

    constructor(private alertService: AlertService,
                private identityCardService: IdentityCardService,
                private configService: ConfigService) {
    }

    initialize(): Promise<any> {
        if (this.initialized) {
            return Promise.resolve();
        } else if (this.initializingPromise) {
            return this.initializingPromise;
        }

        this.initializingPromise = Promise.resolve()
            .then(() => {
                return this.configService.loadConfig();
            })
            .then((config) => {
                let force = !this.identityCardService.getCurrentIdentityCard();
                this.alertService.busyStatus$.next({
                    title: 'Initializing Playground',
                    force: force
                });
                this.config = config;
                return this.identityCardService.loadIdentityCards();
            })
            .then(() => {
                let idCards: IdCard[] = [];
                if (this.config && this.config.cards) {
                    this.config.cards.forEach((card) => {
                        let newIdCard = new IdCard(card.metadata, card.connectionProfile);
                        newIdCard.setCredentials(card.credentials);
                        idCards.push(newIdCard);
                    });
                }
                return this.identityCardService.addInitialIdentityCards(idCards);
            })
            .then(() => {
                this.alertService.busyStatus$.next(null);
                this.initialized = true;
                this.initializingPromise = null;
            })
            .catch((error) => {
                this.alertService.errorStatus$.next(error);
                this.initialized = false;
                this.initializingPromise = null;
            });

        return this.initializingPromise;
    }
}
