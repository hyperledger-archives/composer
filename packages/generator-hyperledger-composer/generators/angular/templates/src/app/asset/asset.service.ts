import { Injectable } from '@angular/core';
import { DataService } from '../data.service';
import { Observable } from 'rxjs/Observable';
import { <%= assetName %> } from '../<%= namespace %>';
import 'rxjs/Rx';

// Can be injected into a constructor
@Injectable()
export class <%= assetName %>Service {

	<% if(apiNamespace == 'always'){ %>
		private NAMESPACE: string = '<%= namespace %>.<%= assetName %>';
	<% }else{ %>
		private NAMESPACE: string = '<%= assetName %>';
	<% } %>



    constructor(private dataService: DataService<<%= assetName %>>) {
    };

    public getAll(): Observable<<%= assetName %>[]> {
        return this.dataService.getAll(this.NAMESPACE);
    }

    public getAsset(id: any): Observable<<%= assetName %>> {
      return this.dataService.getSingle(this.NAMESPACE, id);
    }

    public addAsset(itemToAdd: any): Observable<<%= assetName %>> {
      return this.dataService.add(this.NAMESPACE, itemToAdd);
    }

    public updateAsset(id: any, itemToUpdate: any): Observable<<%= assetName %>> {
      return this.dataService.update(this.NAMESPACE, id, itemToUpdate);
    }

    public deleteAsset(id: any): Observable<<%= assetName %>> {
      return this.dataService.delete(this.NAMESPACE, id);
    }

}
