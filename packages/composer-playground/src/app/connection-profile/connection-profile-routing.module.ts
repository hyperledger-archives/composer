import { NgModule }            from '@angular/core';
import { RouterModule }        from '@angular/router';

import { ConnectionProfileComponent }    from './connection-profile.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: ConnectionProfileComponent }
    ])],
    exports: [RouterModule]
})
export class ConnectionProfileRoutingModule {}
