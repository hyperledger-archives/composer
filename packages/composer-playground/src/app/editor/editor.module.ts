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
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { CodemirrorModule } from 'ng2-codemirror';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { EditorComponent } from './editor.component';
import { EditorFilesPipe } from './editor-files.pipe';
import { EditorFileComponent } from './editor-file/editor-file.component';
import { EditorService } from './editor.service';
import { EditorRoutingModule } from './editor-routing.module';
import { AddFileComponent } from './add-file/add-file.component';
import { FileImporterModule } from '../common/file-importer/file-importer.module';
import { DirectivesModule } from '../directives/directives.module';
import { DeployModule } from '../deploy/deploy.module';
import { FooterModule } from '../footer/footer.module';
import { UpgradeComponent } from './upgrade/upgrade.component';

@NgModule({
    imports: [CommonModule, FormsModule, NgbModule, PerfectScrollbarModule, CodemirrorModule, DirectivesModule, FileImporterModule, DeployModule, EditorRoutingModule, FooterModule],
    entryComponents: [AddFileComponent, UpgradeComponent],
    declarations: [EditorComponent, EditorFilesPipe, EditorFileComponent, AddFileComponent, UpgradeComponent]
})

export class EditorModule {
}
