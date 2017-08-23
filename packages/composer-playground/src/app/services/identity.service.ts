import { Injectable } from '@angular/core';
import { LocalStorageService } from 'angular-2-local-storage';
import { BehaviorSubject, Observable } from 'rxjs/Rx';

import { Logger } from 'composer-common';
import { IdentityCardService } from './identity-card.service';

@Injectable()
export class IdentityService {

    private _currentIdentity: BehaviorSubject<string> = new BehaviorSubject(null);

    // tslint:disable-next-line:member-ordering
    public readonly currentIdentity: Observable<string> = this._currentIdentity.asObservable();

    constructor(private localStorageService: LocalStorageService) {

        Logger.setFunctionalLogger({
            // tslint:disable-next-line:no-empty
            log: () => {
            }
        });
    }

    setCurrentIdentity(identity: string) {
        this._currentIdentity.next(identity);
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
