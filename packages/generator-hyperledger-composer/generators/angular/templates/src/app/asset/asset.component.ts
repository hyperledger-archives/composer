import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { <%= currentAsset.name %>Service } from './<%= currentAsset.name %>.service';
import 'rxjs/add/operator/toPromise';
@Component({
	selector: 'app-<%= currentAsset.name %>',
	templateUrl: './<%= currentAsset.name %>.component.html',
	styleUrls: ['./<%= currentAsset.name %>.component.css'],
  providers: [<%= currentAsset.name %>Service]
})
export class <%= currentAsset.name %>Component implements OnInit {

  myForm: FormGroup;

  private allAssets;
  private asset;
  private currentId;
	private errorMessage;

  <% for(var x=0;x<currentAsset.properties.length;x++){ %>
      <% if(currentAsset.properties[x].array === true && currentAsset.properties[x].enum === true){ %>
          <%= currentAsset.properties[x].name %> = { value: [] };
        <% }else{ %>
          <%= currentAsset.properties[x].name %> = new FormControl("", Validators.required);
        <% } %>
  <%}%>


  constructor(private service<%= currentAsset.name %>:<%= currentAsset.name %>Service, fb: FormBuilder) {
    this.myForm = fb.group({
    <% for(var x=0;x<currentAsset.properties.length;x++){ %>
        <% if(x == currentAsset.properties.length-1){ %>
          <%= currentAsset.properties[x].name %>:this.<%=currentAsset.properties[x].name%>
        <% }else{ %>
          <%=currentAsset.properties[x].name%>:this.<%=currentAsset.properties[x].name%>,
        <% } %>
    <% }%>
    });
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): Promise<any> {
    let tempList = [];
    return this.service<%= currentAsset.name %>.getAll()
    .toPromise()
    .then((result) => {
			this.errorMessage = null;
      result.forEach(asset => {
        tempList.push(asset);
      });
      this.allAssets = tempList;
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
   * @param {String} name - the name of the asset field to update
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
   * only). This is used for checkboxes in the asset updateDialog.
   * @param {String} name - the name of the asset field to check
   * @param {any} value - the enumeration value to check for
   * @return {Boolean} whether the specified asset field contains the provided value
   */
  hasArrayValue(name: string, value: any): boolean {
    return this[name].value.indexOf(value) !== -1;
  }

  addAsset(form: any): Promise<any> {
    this.asset = {
      $class: "<%= namespace %>.<%= currentAsset.name %>",
      <% for(var x=0;x<currentAsset.properties.length;x++){ %>
        <% if(x == currentAsset.properties.length-1){ %>
          "<%= currentAsset.properties[x].name %>":this.<%= currentAsset.properties[x].name %>.value
        <% }else{ %>
          "<%=currentAsset.properties[x].name%>":this.<%= currentAsset.properties[x].name %>.value,
        <% } %>
      <% }%>
    };

    this.myForm.setValue({
      <% for(var x=0;x<currentAsset.properties.length;x++){ %>
        <% if(x == currentAsset.properties.length-1){ %>
          "<%= currentAsset.properties[x].name %>":null
        <% }else{ %>
          "<%=currentAsset.properties[x].name%>":null,
        <% } %>
      <% }%>
    });

    return this.service<%= currentAsset.name %>.addAsset(this.asset)
    .toPromise()
    .then(() => {
			this.errorMessage = null;
      this.myForm.setValue({
      <% for(var x=0;x<currentAsset.properties.length;x++){ %>
        <% if(x == currentAsset.properties.length-1){ %>
          "<%= currentAsset.properties[x].name %>":null %>
        <% }else{ %>
          "<%=currentAsset.properties[x].name%>":null,
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


   updateAsset(form: any): Promise<any> {
    this.asset = {
      $class: "<%= namespace %>.<%= currentAsset.name %>",
      <% for(var x=0;x<currentAsset.properties.length;x++){ %>
        <% if(x == currentAsset.properties.length-1){ %>
          <% if(currentAsset.properties[x].name != currentAsset.identifier){ %>
            "<%= currentAsset.properties[x].name %>":this.<%= currentAsset.properties[x].name %>.value
          <% } %>
        <% }else{ %>
          <% if(currentAsset.properties[x].name != currentAsset.identifier){ %>
            "<%=currentAsset.properties[x].name%>":this.<%= currentAsset.properties[x].name %>.value,
          <% } %>
        <% } %>
    <% }%>
    };

    return this.service<%= currentAsset.name %>.updateAsset(form.get("<%=assetIdentifier%>").value,this.asset)
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


  deleteAsset(): Promise<any> {

    return this.service<%= currentAsset.name %>.deleteAsset(this.currentId)
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

    return this.service<%= currentAsset.name %>.getAsset(id)
    .toPromise()
    .then((result) => {
			this.errorMessage = null;
      let formObject = {
        <% for(var x=0;x<currentAsset.properties.length;x++){ %>
          <% if(x == currentAsset.properties.length-1){ %>
            "<%= currentAsset.properties[x].name %>":null %>
          <% }else{ %>
            "<%=currentAsset.properties[x].name%>":null,
          <% } %>
        <% } %>
      };



      <% for(var x=0;x<currentAsset.properties.length;x++){ %>
        if(result.<%=currentAsset.properties[x].name%>){
          <% if(currentAsset.properties[x].array === true){ %>
            this.<%= currentAsset.properties[x].name %> = { value: result.<%= currentAsset.properties[x].name %> };
          <% }else{ %>
            formObject.<%= currentAsset.properties[x].name %> = result.<%= currentAsset.properties[x].name %>;
          <% } %>
        }else{
          formObject.<%= currentAsset.properties[x].name %> = null;
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
      <% for(var x=0;x<currentAsset.properties.length;x++){ %>
        <% if(x == currentAsset.properties.length-1){ %>
          "<%= currentAsset.properties[x].name %>":null %>
        <% }else{ %>
          "<%=currentAsset.properties[x].name%>":null,
        <% } %>
      <% }%>
      });
  }

}
