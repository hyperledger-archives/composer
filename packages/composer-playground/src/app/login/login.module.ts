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
import { DeployModule } from '../deploy/deploy.module';
import { FooterModule } from '../footer/footer.module';
import { IdentityCardModule } from '../common/identity-card/identity-card.module';
import { IdentityModule } from '../identity/identity.module';
import { CredentialsModule } from '../common/credentials/credentials.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, LoginRoutingModule, ConnectionProfileModule, FooterModule, FileImporterModule, DrawerModule, DeployModule, IdentityModule, TutorialLinkModule, IdentityCardModule, CredentialsModule],
    entryComponents: [ImportIdentityComponent, CreateIdentityCardComponent, EditCardCredentialsComponent],
    declarations: [LoginComponent, ImportIdentityComponent, CreateIdentityCardComponent, EditCardCredentialsComponent]
})

export class LoginModule {
}
