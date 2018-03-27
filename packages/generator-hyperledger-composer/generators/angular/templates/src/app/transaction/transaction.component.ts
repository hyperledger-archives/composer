import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { <%= currentTransaction.name %>Service } from './<%= currentTransaction.name %>.service';
import 'rxjs/add/operator/toPromise';
@Component({
	selector: 'app-<%= currentTransaction.name %>',
	templateUrl: './<%= currentTransaction.name %>.component.html',
	styleUrls: ['./<%= currentTransaction.name %>.component.css'],
  providers: [<%= currentTransaction.name %>Service]
})
export class <%= currentTransaction.name %>Component implements OnInit {

  myForm: FormGroup;

  private allTransactions;
  private Transaction;
  private currentId;
	private errorMessage;

  <% for(var x=0;x<currentTransaction.properties.length;x++){ %>
      <% if(currentTransaction.properties[x].array === true && currentTransaction.properties[x].enum === true){ %>
          <%= currentTransaction.properties[x].name %> = { value: [] };
        <% }else{ %>
          <%= currentTransaction.properties[x].name %> = new FormControl("", Validators.required);
        <% } %>
  <%}%>


  constructor(private service<%= currentTransaction.name %>:<%= currentTransaction.name %>Service, fb: FormBuilder) {
    this.myForm = fb.group({
    <% for(var x=0;x<currentTransaction.properties.length;x++){ %>
        <% if(x == currentTransaction.properties.length-1){ %>
          <%= currentTransaction.properties[x].name %>:this.<%=currentTransaction.properties[x].name%>
        <% }else{ %>
          <%=currentTransaction.properties[x].name%>:this.<%=currentTransaction.properties[x].name%>,
        <% } %>
    <% }%>
    });
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): Promise<any> {
    let tempList = [];
    return this.service<%= currentTransaction.name %>.getAll()
    .toPromise()
    .then((result) => {
			this.errorMessage = null;
      result.forEach(transaction => {
        tempList.push(transaction);
      });
      this.allTransactions = tempList;
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
   * @param {String} name - the name of the transaction field to update
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
   * only). This is used for checkboxes in the transaction updateDialog.
   * @param {String} name - the name of the transaction field to check
   * @param {any} value - the enumeration value to check for
   * @return {Boolean} whether the specified transaction field contains the provided value
   */
  hasArrayValue(name: string, value: any): boolean {
    return this[name].value.indexOf(value) !== -1;
  }

  addTransaction(form: any): Promise<any> {
    this.Transaction = {
      $class: "<%= namespace %>.<%= currentTransaction.name %>",
      <% for(var x=0;x<currentTransaction.properties.length;x++){ %>
        <% if(x == currentTransaction.properties.length-1){ %>
          "<%= currentTransaction.properties[x].name %>":this.<%= currentTransaction.properties[x].name %>.value
        <% }else{ %>
          "<%=currentTransaction.properties[x].name%>":this.<%= currentTransaction.properties[x].name %>.value,
        <% } %>
      <% }%>
    };

    this.myForm.setValue({
      <% for(var x=0;x<currentTransaction.properties.length;x++){ %>
        <% if(x == currentTransaction.properties.length-1){ %>
          "<%= currentTransaction.properties[x].name %>":null
        <% }else{ %>
          "<%=currentTransaction.properties[x].name%>":null,
        <% } %>
      <% }%>
    });

    return this.service<%= currentTransaction.name %>.addTransaction(this.Transaction)
    .toPromise()
    .then(() => {
			this.errorMessage = null;
      this.myForm.setValue({
      <% for(var x=0;x<currentTransaction.properties.length;x++){ %>
        <% if(x == currentTransaction.properties.length-1){ %>
          "<%= currentTransaction.properties[x].name %>":null %>
        <% }else{ %>
          "<%=currentTransaction.properties[x].name%>":null,
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


   updateTransaction(form: any): Promise<any> {
    this.Transaction = {
      $class: "<%= namespace %>.<%= currentTransaction.name %>",
      <% for(var x=0;x<currentTransaction.properties.length;x++){ %>
        <% if(x == currentTransaction.properties.length-1){ %>
          <% if(currentTransaction.properties[x].name != currentTransaction.identifier){ %>
            "<%= currentTransaction.properties[x].name %>":this.<%= currentTransaction.properties[x].name %>.value
          <% } %>
        <% }else{ %>
          <% if(currentTransaction.properties[x].name != currentTransaction.identifier){ %>
            "<%=currentTransaction.properties[x].name%>":this.<%= currentTransaction.properties[x].name %>.value,
          <% } %>
        <% } %>
    <% }%>
    };

    return this.service<%= currentTransaction.name %>.updateTransaction(form.get("<%=transactionIdentifier%>").value,this.Transaction)
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


  deleteTransaction(): Promise<any> {

    return this.service<%= currentTransaction.name %>.deleteTransaction(this.currentId)
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

    return this.service<%= currentTransaction.name %>.getTransaction(id)
    .toPromise()
    .then((result) => {
			this.errorMessage = null;
      let formObject = {
        <% for(var x=0;x<currentTransaction.properties.length;x++){ %>
          <% if(x == currentTransaction.properties.length-1){ %>
            "<%= currentTransaction.properties[x].name %>":null %>
          <% }else{ %>
            "<%=currentTransaction.properties[x].name%>":null,
          <% } %>
        <% } %>
      };



      <% for(var x=0;x<currentTransaction.properties.length;x++){ %>
        if(result.<%=currentTransaction.properties[x].name%>){
          <% if(currentTransaction.properties[x].array === true){ %>
            this.<%= currentTransaction.properties[x].name %> = { value: result.<%= currentTransaction.properties[x].name %> };
          <% }else{ %>
            formObject.<%= currentTransaction.properties[x].name %> = result.<%= currentTransaction.properties[x].name %>;
          <% } %>
        }else{
          formObject.<%= currentTransaction.properties[x].name %> = null;
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
      <% for(var x=0;x<currentTransaction.properties.length;x++){ %>
        <% if(x == currentTransaction.properties.length-1){ %>
          "<%= currentTransaction.properties[x].name %>":null %>
        <% }else{ %>
          "<%=currentTransaction.properties[x].name%>":null,
        <% } %>
      <% }%>
      });
  }

}

