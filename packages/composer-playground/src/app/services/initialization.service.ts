import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { ClientService } from './client.service';
import { AlertService } from '../basic-modals/alert.service';
import { IdentityService } from './identity.service';
import { IdentityCardService } from './identity-card.service';
import { IdCard } from 'composer-common';

@Injectable()
export class InitializationService {

    private initializingPromise: Promise<any> = null;
    private initialized = false;

    private config;

    constructor(private clientService: ClientService,
                private alertService: AlertService,
                private identityService: IdentityService,
                private identityCardService: IdentityCardService,
                private http: Http) {
    }

    initialize(): Promise<any> {
        if (this.initialized) {
            return Promise.resolve();
        } else if (this.initializingPromise) {
            return this.initializingPromise;
        }

        this.initializingPromise = Promise.resolve()
            .then(() => {
                return this.loadConfig();
            })
            .then((config) => {
                let force = !this.identityService.getLoggedIn();
                this.alertService.busyStatus$.next({
                    title: 'Initializing Playground',
                    force: force
                });
                this.config = config;
                return this.identityCardService.loadIdentityCards(this.isWebOnly());
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
            .then((cardRefs: string[]) => {
                // only need to check about initial sample if not logged in
                if (!this.identityService.getLoggedIn() && cardRefs && cardRefs.length > 0) {
                    return cardRefs.reduce((promise, cardRef) => {
                        return promise.then(() => {
                            return this.deployInitialSample(cardRef);
                        });
                    }, Promise.resolve());
                }
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

    loadConfig(): Promise<any> {
        // Load the config data.
        return this.http.get('/config.json')
            .map((res: Response) => res.json())
            .toPromise();
    }

    deployInitialSample(defaultCardRef) {
        return this.identityCardService.setCurrentIdentityCard(defaultCardRef)
            .then(() => {
                return this.clientService.deployInitialSample();
            });
    }

    isWebOnly(): boolean {
        if (!this.config) {
            return false;
        }
        return this.config.webonly;
    }
}
