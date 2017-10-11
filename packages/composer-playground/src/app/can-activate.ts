import { Injectable }             from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { IdentityService } from './services/identity.service';

@Injectable()
export class CanActivateViaLogin implements CanActivate {

    constructor(private identityService: IdentityService,
                private router: Router) {

    }

    canActivate(): boolean {
        let loggedIn = this.identityService.getLoggedIn();
        if (loggedIn) {
            return true;
        } else {
            this.router.navigate(['login']);
            return false;
        }
    }
}
