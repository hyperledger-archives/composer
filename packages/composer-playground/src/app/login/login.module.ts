import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login-routing.module';
import { IdentityCardComponent } from './identity-card';
import { DrawerModule } from '../common/drawer';
import { FileImporterModule } from '../common/file-importer/file-importer.module';
import { ConnectionProfileModule } from '../connection-profile/connection-profile.module';
import { FooterModule } from '../footer/footer.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, LoginRoutingModule, ConnectionProfileModule, FooterModule, FileImporterModule, DrawerModule],
    entryComponents: [IdentityCardComponent],
    declarations: [LoginComponent, IdentityCardComponent]
})

export class LoginModule {
}
