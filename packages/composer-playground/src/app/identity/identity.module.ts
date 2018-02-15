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
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { IdentityRoutingModule } from './identity-routing.module';
import { ConnectionProfileComponent } from './connection-profile.component';

import { FileImporterModule } from '../common/file-importer/file-importer.module';
import { IdentityIssuedComponent } from './identity-issued/identity-issued.component';
import { IssueIdentityComponent } from './issue-identity/issue-identity.component';
import { IdentityComponent } from './identity.component';
import { IdentityCardModule } from '../common/identity-card/identity-card.module';
import { FooterModule } from '../footer/footer.module';

import { DrawerModule } from '../common/drawer';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, FileImporterModule, IdentityRoutingModule, FooterModule, DrawerModule, IdentityCardModule],
    entryComponents: [IdentityIssuedComponent, IssueIdentityComponent],
    declarations: [IdentityIssuedComponent, IssueIdentityComponent, IdentityComponent],
    providers: [],
    exports: []
})

export class IdentityModule {
}
