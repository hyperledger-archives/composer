import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login-routing.module';
import { ImportIdentityComponent } from './import-identity/import-identity.component';
import { CreateIdentityCardComponent } from './create-identity-card';
import { EditCardCredentialsComponent } from './edit-card-credentials';
import { DrawerModule } from '../common/drawer';
import { TutorialLinkModule } from '../common/tutorial-link';
import { FileImporterModule } from '../common/file-importer/file-importer.module';
import { ConnectionProfileModule } from '../connection-profile/connection-profile.module';
import { ImportModule } from '../import/import.module';
import { FooterModule } from '../footer/footer.module';
import { IdentityCardModule } from '../common/identity-card/identity-card.module';
import { IdentityModule } from '../identity/identity.module';
import { CredentialsModule } from '../common/credentials/credentials.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, LoginRoutingModule, ConnectionProfileModule, FooterModule, FileImporterModule, DrawerModule, ImportModule, IdentityModule, TutorialLinkModule, IdentityCardModule, CredentialsModule],
    entryComponents: [ImportIdentityComponent, CreateIdentityCardComponent, EditCardCredentialsComponent],
    declarations: [LoginComponent, ImportIdentityComponent, CreateIdentityCardComponent, EditCardCredentialsComponent]
})

export class LoginModule {
}
