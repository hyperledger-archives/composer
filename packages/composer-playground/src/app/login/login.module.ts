import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login-routing.module';
import { IdentityCardComponent } from './identity-card';
import { ImportIdentityComponent } from './import-identity/import-identity.component';
import { DrawerModule } from '../common/drawer';
import { FileImporterModule } from '../common/file-importer/file-importer.module';
import { ConnectionProfileModule } from '../connection-profile/connection-profile.module';
import { ImportModule } from '../import/import.module';
import { FooterModule } from '../footer/footer.module';
import { IdentityModule } from '../identity/identity.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, LoginRoutingModule, ConnectionProfileModule, FooterModule, FileImporterModule, DrawerModule, ImportModule, IdentityModule],
    entryComponents: [IdentityCardComponent, ImportIdentityComponent],
    declarations: [LoginComponent, IdentityCardComponent, ImportIdentityComponent]
})

export class LoginModule {
}
