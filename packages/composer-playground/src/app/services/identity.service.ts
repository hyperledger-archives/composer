import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { BehaviorSubject, Observable } from 'rxjs/Rx';

import { IdCard, Logger } from 'composer-common';
import { IdentityCardService } from './identity-card.service';

@Injectable()
export class IdentityService {

    private _currentIdentity: BehaviorSubject<string> = new BehaviorSubject(null);
    private currentQualifiedProfileName: string;
    private currentConnectionProfile: any;
    private currentEnrollmentCredentials: { secret };
    private currentUserName: string;

    // tslint:disable-next-line:member-ordering
    public readonly currentIdentity: Observable<string> = this._currentIdentity.asObservable();

    constructor(private localStorageService: LocalStorageService) {

        Logger.setFunctionalLogger({
            // tslint:disable-next-line:no-empty
            log: () => {
            }
        });
    }

    setCurrentIdentity(qualifiedProfileName: string, card: IdCard) {
        this.currentQualifiedProfileName = qualifiedProfileName;
        this.currentConnectionProfile = card.getConnectionProfile();
        this.currentEnrollmentCredentials = card.getEnrollmentCredentials();
        this.currentUserName = card.getUserName();

        this._currentIdentity.next(card.getUserName());
    }

    getCurrentConnectionProfile(): any {
        return this.currentConnectionProfile;
    }

    getCurrentQualifiedProfileName(): string {
        return this.currentQualifiedProfileName;
    }

    getCurrentEnrollmentCredentials(): { secret } {
        return this.currentEnrollmentCredentials;
    }

    getCurrentUserName(): string {
        return this.currentUserName;
    }

    setLoggedIn(loggedIn: boolean) {
        let key = `loggedIn`;
        this.localStorageService.set(key, loggedIn);
    }

    getLoggedIn() {
        let key = `loggedIn`;
        return this.localStorageService.get<string>(key);
    }
}
