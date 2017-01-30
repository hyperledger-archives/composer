import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { <%= currentAsset.name %>Service } from './<%= currentAsset.name %>.service';
@Component({
	selector: 'app-<%= currentAsset.name %>',
	templateUrl: './<%= currentAsset.name %>.component.html',
	styleUrls: ['./<%= currentAsset.name %>.component.css']
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

  ngOnInit():void {
    this.loadAll();
  }

  loadAll(): Promise<any> {
    let tempList = [];
    return this.service<%= currentAsset.name %>.getAll().then((result) => {
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

    return this.service<%= currentAsset.name %>.addAsset(this.asset).then(() => {
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
          "<%= currentAsset.properties[x].name %>":this.<%= currentAsset.properties[x].name %>.value
        <% }else{ %>
          "<%=currentAsset.properties[x].name%>":this.<%= currentAsset.properties[x].name %>.value,
        <% } %>
    <% }%>
    };


    return this.service<%= currentAsset.name %>.updateAsset(this.asset.<%=assetIdentifier%>,this.asset);
  }


  deleteAsset(): Promise<any> {

    return this.service<%= currentAsset.name %>.deleteAsset(this.currentId);
  }

  setId(id:any):void{
    this.currentId = id;
  }

  getForm(id:any):Promise<any>{

    return this.service<%= currentAsset.name %>.getAsset(id).then((result) => {

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

    })

  }

  resetForm():void{
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
