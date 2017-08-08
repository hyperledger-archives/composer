import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { ClientService } from './client.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConnectionProfileService } from './connectionprofile.service';
import { WalletService } from './wallet.service';
import { IdentityService } from './identity.service';
import { IdentityCardService } from './identity-card.service';

@Injectable()
export class InitializationService {

    private initializingPromise: Promise<any> = null;
    private initialized = false;

    private config;

    constructor(private clientService: ClientService,
                private alertService: AlertService,
                private connectionProfileService: ConnectionProfileService,
                private walletService: WalletService,
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
                return this.identityCardService.loadIdentityCards();
            })
            .then(() => {
                return this.loadConfig();
            })
            .then((config) => {
                this.config = config;
                // TODO pass in array of identity cards via config.json somehow
                return this.identityCardService.addInitialIdentityCards();
            })
            .then((defaultCardRef) => {
                // only need to check about initial sample if not logged in
                if (!this.identityService.getLoggedIn() && defaultCardRef) {
                    return this.deployInitialSample(defaultCardRef);
                }
            })
            .then(() => {
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
        return this.identityCardService.setCurrentIdentityCard(defaultCardRef).then(() => this.clientService.deployInitialSample());
    }

    isWebOnly(): boolean {
        if (!this.config) {
            return false;
        }
        return this.config.webonly;
    }
}
