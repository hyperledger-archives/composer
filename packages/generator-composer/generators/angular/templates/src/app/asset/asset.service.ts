import { Injectable } from '@angular/core';
import { DataService } from '../data.service';
import { Observable } from 'rxjs/Observable';
import { <%= assetName %> } from '../<%= namespace %>';
import 'rxjs/Rx';

// Can be injected into a constructor
@Injectable()
export class <%= assetName %>Service {
    private NAMESPACE: string = '<%= namespace %>.<%= assetName %>';

    constructor(private dataService: DataService<<%= assetName %>>) {
    };

    public getAll = (): Promise<<%= assetName %>[]> => {
        return this.dataService.getAll(this.NAMESPACE);
    }

    public getAsset = (id:any): Promise<<%= assetName %>> => {
      return this.dataService.getSingle(this.NAMESPACE, id);
    }

    public addAsset = (itemToAdd: any): Promise<<%= assetName %>> => {
      return this.dataService.add(this.NAMESPACE, itemToAdd);
    }

    public updateAsset = (id:any, itemToUpdate: any): Promise<<%= assetName %>> => {
      return this.dataService.update(this.NAMESPACE, id, itemToUpdate);
    }

    public deleteAsset = (id:any): Promise<<%= assetName %>> => {
      return this.dataService.delete(this.NAMESPACE, id);
    }

}
