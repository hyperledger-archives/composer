import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { FooterComponent } from './footer.component';

@NgModule({
    imports: [CommonModule],
    entryComponents: [],
    declarations: [FooterComponent],
    providers: [],
    exports: [FooterComponent]
})

export class FooterModule {
}
