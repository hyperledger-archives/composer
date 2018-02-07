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
import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';

import { AboutService } from './about.service';
import { AdminService } from './admin.service';
import { ClientService } from './client.service';
import { ConnectionProfileService } from './connectionprofile.service';

;
import { FileService } from './file.service';
import { IdentityCardService } from './identity-card.service';
import { InitializationService } from './initialization.service';
import { SampleBusinessNetworkService } from './samplebusinessnetwork.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConfigService } from './config.service';
import { BusinessNetworkCardStoreService } from './cardStores/businessnetworkcardstore.service';

@NgModule({
    imports: [CommonModule],
    declarations: [],
    providers: [
        AboutService,
        AlertService,
        AdminService,
        ClientService,
        ConnectionProfileService,
        FileService,
        IdentityCardService,
        InitializationService,
        SampleBusinessNetworkService,
        ConfigService,
        BusinessNetworkCardStoreService
    ],
    exports: []
})

export class ServicesModule {
    constructor(@Optional() @SkipSelf() parentModule: ServicesModule) {
        if (parentModule) {
            throw new Error(
                'ServicesModule is already loaded. Import it in the AppModule only');
        }
    }
}
