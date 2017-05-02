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

  <% for(var x=0;x<currentAsset.properties.length;x++){ %>
      <%= currentAsset.properties[x].name %> = new FormControl("", Validators.required);
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
      result.forEach(asset => {
        tempList.push(asset);
      });
      this.allAssets = tempList;
    });
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
      this.myForm.setValue({
      <% for(var x=0;x<currentAsset.properties.length;x++){ %>
        <% if(x == currentAsset.properties.length-1){ %>
          "<%= currentAsset.properties[x].name %>":null %>
        <% }else{ %>
          "<%=currentAsset.properties[x].name%>":null,
        <% } %>
      <% }%>
      });
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

    return this.service<%= currentAsset.name %>.updateAsset(form.get("<%=assetIdentifier%>").value,this.asset).toPromise();
  }


  deleteAsset(): Promise<any> {

    return this.service<%= currentAsset.name %>.deleteAsset(this.currentId).toPromise();
  }

  setId(id: any): void{
    this.currentId = id;
  }

  getForm(id: any): Promise<any>{

    return this.service<%= currentAsset.name %>.getAsset(id)
    .toPromise()
    .then((result) => {

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
          formObject.<%= currentAsset.properties[x].name %> = result.<%= currentAsset.properties[x].name %>;
        }else{
          formObject.<%= currentAsset.properties[x].name %> = null;
        }
      <%}%>

      this.myForm.setValue(formObject);

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
