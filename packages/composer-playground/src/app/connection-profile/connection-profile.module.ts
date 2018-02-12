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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ConnectionProfileComponent } from './connection-profile.component';
import { AddCertificateComponent } from './add-certificate/add-certificate.component';
import { ViewCertificateComponent } from './view-certificate/view-certificate.component';
import { FileImporterModule } from '../common/file-importer/file-importer.module';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, ReactiveFormsModule, FileImporterModule],
    entryComponents: [AddCertificateComponent, ViewCertificateComponent],
    declarations: [ConnectionProfileComponent, AddCertificateComponent, ViewCertificateComponent],
    providers: [],
    exports: [ConnectionProfileComponent]
})

export class ConnectionProfileModule {
}
