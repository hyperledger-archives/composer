import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { IdentityCardService } from './services/identity-card.service';
import { InitializationService } from './services/initialization.service';

@Injectable()
export class CanActivateViaLogin implements CanActivate {

    private isloaded = false;

    constructor(private identityCardService: IdentityCardService,
                private initializationService: InitializationService,
                private router: Router) {

    }

    canActivate(): boolean {
        let loadingPromise;
        if (this.isloaded) {
            loadingPromise = Promise.resolve();
        } else {
            loadingPromise = this.initializationService.initialize();
        }

        return loadingPromise.then(() => {
            this.isloaded = true;
            let cardRef = this.identityCardService.getCurrentCardRef();
            if (cardRef) {
                return true;
            } else {
                this.router.navigate(['login']);
                return false;
            }
        });
    }
}
