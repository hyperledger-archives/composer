import { NgModule }           from '@angular/core';
import { CommonModule } from '@angular/common';

import { IdentityCardComponent } from './identity-card.component';

@NgModule({
    imports: [CommonModule],
    entryComponents: [],
    declarations: [IdentityCardComponent],
    providers: [],
    exports: [IdentityCardComponent]
})

export class IdentityCardModule {
}
