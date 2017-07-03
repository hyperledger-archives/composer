import { NgModule }            from '@angular/core';
import { RouterModule }        from '@angular/router';

import { EditorComponent }    from './editor.component';

@NgModule({
    imports: [RouterModule.forChild([
        { path: '', component: EditorComponent }
    ])],
    exports: [RouterModule]
})
export class EditorRoutingModule {}
