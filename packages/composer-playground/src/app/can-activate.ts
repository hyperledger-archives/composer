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
