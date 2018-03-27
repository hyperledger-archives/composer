import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { <%= currentParticipant.name %>Service } from './<%= currentParticipant.name %>.service';
import 'rxjs/add/operator/toPromise';
@Component({
	selector: 'app-<%= currentParticipant.name %>',
	templateUrl: './<%= currentParticipant.name %>.component.html',
	styleUrls: ['./<%= currentParticipant.name %>.component.css'],
  providers: [<%= currentParticipant.name %>Service]
})
export class <%= currentParticipant.name %>Component implements OnInit {

  myForm: FormGroup;

  private allParticipants;
  private participant;
  private currentId;
	private errorMessage;

  <% for(var x=0;x<currentParticipant.properties.length;x++){ %>
      <% if(currentParticipant.properties[x].array === true && currentParticipant.properties[x].enum === true){ %>
          <%= currentParticipant.properties[x].name %> = { value: [] };
        <% }else{ %>
          <%= currentParticipant.properties[x].name %> = new FormControl("", Validators.required);
        <% } %>
  <%}%>


  constructor(private service<%= currentParticipant.name %>:<%= currentParticipant.name %>Service, fb: FormBuilder) {
    this.myForm = fb.group({
    <% for(var x=0;x<currentParticipant.properties.length;x++){ %>
        <% if(x == currentParticipant.properties.length-1){ %>
          <%= currentParticipant.properties[x].name %>:this.<%=currentParticipant.properties[x].name%>
        <% }else{ %>
          <%=currentParticipant.properties[x].name%>:this.<%=currentParticipant.properties[x].name%>,
        <% } %>
    <% }%>
    });
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): Promise<any> {
    let tempList = [];
    return this.service<%= currentParticipant.name %>.getAll()
    .toPromise()
    .then((result) => {
			this.errorMessage = null;
      result.forEach(participant => {
        tempList.push(participant);
      });
      this.allParticipants = tempList;
    })
    .catch((error) => {
        if(error == 'Server error'){
            this.errorMessage = "Could not connect to REST server. Please check your configuration details";
        }
        else if(error == '404 - Not Found'){
				this.errorMessage = "404 - Could not find API route. Please check your available APIs."
        }
        else{
            this.errorMessage = error;
        }
    });
  }

	/**
   * Event handler for changing the checked state of a checkbox (handles array enumeration values)
   * @param {String} name - the name of the participant field to update
   * @param {any} value - the enumeration value for which to toggle the checked state
   */
  changeArrayValue(name: string, value: any): void {
    const index = this[name].value.indexOf(value);
    if (index === -1) {
      this[name].value.push(value);
    } else {
      this[name].value.splice(index, 1);
    }
  }

	/**
	 * Checkbox helper, determining whether an enumeration value should be selected or not (for array enumeration values
   * only). This is used for checkboxes in the participant updateDialog.
   * @param {String} name - the name of the participant field to check
   * @param {any} value - the enumeration value to check for
   * @return {Boolean} whether the specified participant field contains the provided value
   */
  hasArrayValue(name: string, value: any): boolean {
    return this[name].value.indexOf(value) !== -1;
  }

  addParticipant(form: any): Promise<any> {
    this.participant = {
      $class: "<%= namespace %>.<%= currentParticipant.name %>",
      <% for(var x=0;x<currentParticipant.properties.length;x++){ %>
        <% if(x == currentParticipant.properties.length-1){ %>
          "<%= currentParticipant.properties[x].name %>":this.<%= currentParticipant.properties[x].name %>.value
        <% }else{ %>
          "<%=currentParticipant.properties[x].name%>":this.<%= currentParticipant.properties[x].name %>.value,
        <% } %>
      <% }%>
    };

    this.myForm.setValue({
      <% for(var x=0;x<currentParticipant.properties.length;x++){ %>
        <% if(x == currentParticipant.properties.length-1){ %>
          "<%= currentParticipant.properties[x].name %>":null
        <% }else{ %>
          "<%=currentParticipant.properties[x].name%>":null,
        <% } %>
      <% }%>
    });

    return this.service<%= currentParticipant.name %>.addParticipant(this.participant)
    .toPromise()
    .then(() => {
			this.errorMessage = null;
      this.myForm.setValue({
      <% for(var x=0;x<currentParticipant.properties.length;x++){ %>
        <% if(x == currentParticipant.properties.length-1){ %>
          "<%= currentParticipant.properties[x].name %>":null %>
        <% }else{ %>
          "<%=currentParticipant.properties[x].name%>":null,
        <% } %>
      <% }%>
      });
    })
    .catch((error) => {
        if(error == 'Server error'){
            this.errorMessage = "Could not connect to REST server. Please check your configuration details";
        }
        else{
            this.errorMessage = error;
        }
    });
  }


   updateParticipant(form: any): Promise<any> {
    this.participant = {
      $class: "<%= namespace %>.<%= currentParticipant.name %>",
      <% for(var x=0;x<currentParticipant.properties.length;x++){ %>
        <% if(x == currentParticipant.properties.length-1){ %>
          <% if(currentParticipant.properties[x].name != currentParticipant.identifier){ %>
            "<%= currentParticipant.properties[x].name %>":this.<%= currentParticipant.properties[x].name %>.value
          <% } %>
        <% }else{ %>
          <% if(currentParticipant.properties[x].name != currentParticipant.identifier){ %>
            "<%=currentParticipant.properties[x].name%>":this.<%= currentParticipant.properties[x].name %>.value,
          <% } %>
        <% } %>
    <% }%>
    };

    return this.service<%= currentParticipant.name %>.updateParticipant(form.get("<%=participantIdentifier%>").value,this.participant)
		.toPromise()
		.then(() => {
			this.errorMessage = null;
		})
		.catch((error) => {
            if(error == 'Server error'){
				this.errorMessage = "Could not connect to REST server. Please check your configuration details";
			}
            else if(error == '404 - Not Found'){
				this.errorMessage = "404 - Could not find API route. Please check your available APIs."
			}
			else{
				this.errorMessage = error;
			}
    });
  }


  deleteParticipant(): Promise<any> {

    return this.service<%= currentParticipant.name %>.deleteParticipant(this.currentId)
		.toPromise()
		.then(() => {
			this.errorMessage = null;
		})
		.catch((error) => {
            if(error == 'Server error'){
				this.errorMessage = "Could not connect to REST server. Please check your configuration details";
			}
			else if(error == '404 - Not Found'){
				this.errorMessage = "404 - Could not find API route. Please check your available APIs."
			}
			else{
				this.errorMessage = error;
			}
    });
  }

  setId(id: any): void{
    this.currentId = id;
  }

  getForm(id: any): Promise<any>{

    return this.service<%= currentParticipant.name %>.getparticipant(id)
    .toPromise()
    .then((result) => {
			this.errorMessage = null;
      let formObject = {
        <% for(var x=0;x<currentParticipant.properties.length;x++){ %>
          <% if(x == currentParticipant.properties.length-1){ %>
            "<%= currentParticipant.properties[x].name %>":null %>
          <% }else{ %>
            "<%=currentParticipant.properties[x].name%>":null,
          <% } %>
        <% } %>
      };



      <% for(var x=0;x<currentParticipant.properties.length;x++){ %>
        if(result.<%=currentParticipant.properties[x].name%>){
          <% if(currentParticipant.properties[x].array === true){ %>
            this.<%= currentParticipant.properties[x].name %> = { value: result.<%= currentParticipant.properties[x].name %> };
          <% }else{ %>
            formObject.<%= currentParticipant.properties[x].name %> = result.<%= currentParticipant.properties[x].name %>;
          <% } %>
        }else{
          formObject.<%= currentParticipant.properties[x].name %> = null;
        }
      <%}%>

      this.myForm.setValue(formObject);

    })
    .catch((error) => {
        if(error == 'Server error'){
            this.errorMessage = "Could not connect to REST server. Please check your configuration details";
        }
        else if(error == '404 - Not Found'){
				this.errorMessage = "404 - Could not find API route. Please check your available APIs."
        }
        else{
            this.errorMessage = error;
        }
    });

  }

  resetForm(): void{
    this.myForm.setValue({
      <% for(var x=0;x<currentParticipant.properties.length;x++){ %>
        <% if(x == currentParticipant.properties.length-1){ %>
          "<%= currentParticipant.properties[x].name %>":null %>
        <% }else{ %>
          "<%=currentParticipant.properties[x].name%>":null,
        <% } %>
      <% }%>
      });
  }

}
