import { Injectable } from '@angular/core';
import { DataService } from '../data.service';
import { Observable } from 'rxjs/Observable';
import { <%= transactionName %> } from '../<%= namespace %>';
import 'rxjs/Rx';

// Can be injected into a constructor
@Injectable()
export class <%= transactionName %>Service {

	<% if(apiNamespace == 'always'){ %>
		private NAMESPACE: string = '<%= namespace %>.<%= transactionName %>';
	<% }else{ %>
		private NAMESPACE: string = '<%= transactionName %>';
	<% } %>



    constructor(private dataService: DataService<<%= transactionName %>>) {
    };

    public getAll(): Observable<<%= transactionName %>[]> {
        return this.dataService.getAll(this.NAMESPACE);
    }

    public getTransaction(id: any): Observable<<%= transactionName %>> {
      return this.dataService.getSingle(this.NAMESPACE, id);
    }

    public addTransaction(itemToAdd: any): Observable<<%= transactionName %>> {
      return this.dataService.add(this.NAMESPACE, itemToAdd);
    }

    public updateTransaction(id: any, itemToUpdate: any): Observable<<%= transactionName %>> {
      return this.dataService.update(this.NAMESPACE, id, itemToUpdate);
    }

    public deleteTransaction(id: any): Observable<<%= transactionName %>> {
      return this.dataService.delete(this.NAMESPACE, id);
    }

}

