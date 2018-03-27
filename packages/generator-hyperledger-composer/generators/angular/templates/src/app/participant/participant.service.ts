import { Injectable } from '@angular/core';
import { DataService } from '../data.service';
import { Observable } from 'rxjs/Observable';
import { <%= participantName %> } from '../<%= namespace %>';
import 'rxjs/Rx';

// Can be injected into a constructor
@Injectable()
export class <%= participantName %>Service {

	<% if(apiNamespace == 'always'){ %>
		private NAMESPACE: string = '<%= namespace %>.<%= participantName %>';
	<% }else{ %>
		private NAMESPACE: string = '<%= participantName %>';
	<% } %>



    constructor(private dataService: DataService<<%= participantName %>>) {
    };

    public getAll(): Observable<<%= participantName %>[]> {
        return this.dataService.getAll(this.NAMESPACE);
    }

    public getparticipant(id: any): Observable<<%= participantName %>> {
      return this.dataService.getSingle(this.NAMESPACE, id);
    }

    public addParticipant(itemToAdd: any): Observable<<%= participantName %>> {
      return this.dataService.add(this.NAMESPACE, itemToAdd);
    }

    public updateParticipant(id: any, itemToUpdate: any): Observable<<%= participantName %>> {
      return this.dataService.update(this.NAMESPACE, id, itemToUpdate);
    }

    public deleteParticipant(id: any): Observable<<%= participantName %>> {
      return this.dataService.delete(this.NAMESPACE, id);
    }

}
