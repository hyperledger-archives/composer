import { Injectable }      from '@angular/core';

@Injectable()
export class EditorService {

    private currentFile: any = null;

    getCurrentFile(): any {
        return this.currentFile;
    }

    setCurrentFile(cf: any) {
        this.currentFile = cf;
    }

}
