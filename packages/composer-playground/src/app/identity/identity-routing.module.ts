import { NgModule }            from '@angular/core';
import { RouterModule }        from '@angular/router';

import { IdentityComponent }    from './identity.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: IdentityComponent }
    ])],
    exports: [RouterModule]
})
export class IdentityRoutingModule {}
