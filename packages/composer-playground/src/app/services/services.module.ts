import { CommonModule }       from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf }       from '@angular/core';

import { AboutService } from './about.service';
import { AdminService } from './admin.service';
import { ClientService } from './client.service';
import { ConnectionProfileService } from './connectionprofile.service';
import { IdentityService } from './identity.service';
import { InitializationService } from './initialization.service';
import { SampleBusinessNetworkService } from './samplebusinessnetwork.service';
import { WalletService } from './wallet.service';
import { AlertService } from '../basic-modals/alert.service';
import { TransactionService } from './transaction.service';

@NgModule({
    imports: [CommonModule],
    declarations: [],
    providers: [AboutService, AlertService, AdminService, ClientService, ConnectionProfileService, IdentityService, InitializationService, SampleBusinessNetworkService, WalletService, TransactionService],
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
