class bookmarkItem{
  //names are all short because it jsons
  //var url
  //var name
  //var lmd lastMarkedDate
  //var lud lastUpdatedDate
  //var md5
  //var st   state   whether the last check pinged correctly        0 = Unknown 1 = updating 2 = UpToDate (as in, check lmd v lud)
  constructor(url,name,lmd,lud,md5,st){
    if(typeof url === undefined) {
      return;
    }
    if(url.charAt(0)==='_'){
      this.url=url.slice(1);
    }
    else{
      this.url=url;
    }
    this.name=name;
    if(lmd===undefined){
      this.lmd=new Date();
    }
    else{
      this.lmd=lmd;
    }
    if(lud===undefined){
      this.lud=new Date();
    }
    else{
      this.lud=lud;
    }
    if(md5===undefined){
      this.md5=0;//Generates a placeholder value. Will later actually check the url and get the md5
    }
    else{
      this.md5=md5;
    }
    if(st===undefined){
      this.st=0;
    }
    else{
      this.st=st;
    }
  }
  matchState(bookmarkOther){
    this.lmd=bookmarkOther.lmd;
    this.lud=bookmarkOther.lud;
    this.md5=bookmarkOther.md5;
    this.st=bookmarkOther.st;
  }
  get isUpToDate(){
    return this.lmd>this.lud;
  }
  getHtmlElement(statusButtonCallback,deleteButtonCallback,editButtonCallback){
    //returns a list of elements
    var result=[];
    var linkNode=document.createElement("bookmarkItem");
    var statusNode=document.createElement("bookmarkItem");
    var editNode=document.createElement("bookmarkItem");
    var deleteNode=document.createElement("bookmarkItem");
    linkNode.classList.add("link");
    statusNode.classList.add("status");
    editNode.classList.add("edit");
    deleteNode.classList.add("delete");
    linkNode.classList.add(this.id);//Not really a class, but its searchable
    statusNode.classList.add(this.id);
    editNode.classList.add(this.id);
    deleteNode.classList.add(this.id);
    linkNode.innerHTML='<p href="'+this.url+'">'+this.name+'</p>';
    var statusText=document.createElement("p");
    statusText.addEventListener("click",statusButtonCallback);
    if(this.isUpToDate){//Defer to updated if equal
        statusText.innerHTML="Up to date";
        statusText.classList.add("upToDate");
      }
      else{
        statusText.innerHTML="Updated";
        statusText.classList.add("updated");
    }
    if(this.st!==2){
      statusText.innerHTML+=" (?)";//Should be a hoverable object
    }
    statusNode.appendChild(statusText);
    var deleteText=document.createElement('p');
    deleteText.classList.add("delete");//updated is for the red.
    deleteText.addEventListener("click",deleteButtonCallback);
    deleteText.innerHTML="delete";
    deleteNode.append(deleteText);
    var editText=document.createElement('p');
    editText.classList.add("edit");
    editText.addEventListener("click",editButtonCallback);
    editText.innerHTML="edit";
    editNode.append(editText);
    result.push(linkNode);
    result.push(statusNode);
    result.push(editNode);
    result.push(deleteNode);
    return result;
  }
  static idToURL(id){
    if(id.charAt(0)==='_'){
      return id.slice(1);
    }
    else{
      return id;
    }
  }
  static urlToID(url){
    return '_'+url;
  }
  static isBookmarkID(value){
    return value.charAt(0)==='_';
  }
  get id(){
    return '_'+this.url;
  }
  
  get jsonVal(){
    return JSON.stringify(this);
  }
  get state(){
    return this.st;
  }
  get ruleID(){
    //With saved rules this will change
    return bookmarkRulesItem.URLToID(this.url);
  }
  toggleStatus(){
    if(this.isUpToDate){
      this.lmd=new Date(this.lud.getTime());
    }
    else{
      this.lmd=new Date();
    }
  }
  checkSite(callback,htmlCallback){//htmlCallback is primarily for testing purposes. The HTML string is not meant to be preserved.
    var xhr = new XMLHttpRequest();
    if(this.url===undefined){
      this.st=0;
      if(callback!==undefined&&callback!==null){
        callback(this);
      }
      return;
    }
    xhr.open('get',this.url,true);
    xhr.responseType = 'document';
    let thisBm=this;
    xhr.onreadystatechange=function(){
      if (this.readyState == 4){
        if(this.status == 200){//Page is located
          let responseData=this;
          let ruleID=bookmarkRulesItem.URLToID(thisBm.url)
          getData([ruleID],function(ruleData){
            if(!varExists(responseData.responseXML)){
              console.log("Bad HTML: URL="+thisBm.url);
              thisBm.st=0;
            }
            else{
              thisBm.st=2;
              let htmlString=responseData.responseXML.documentElement.outerHTML;
              let md5String=htmlString;
              if(varExists(ruleData[ruleID])){
                let rulesList=[];
                for(let i=0;i<ruleData[ruleID].length;++i){
                  rulesList.push(jsonToRuleItem(ruleData[ruleID][i]));
                }
                md5String=bookmarkRulesItem.executeArray(rulesList,responseData.responseXML);
              }
              let hash=md5(md5String);
              if(htmlCallback!==undefined&&htmlCallback!==null){
                htmlCallback(htmlString);
              }
              if(htmlString!==""&&hash!==thisBm.md5){
                thisBm.md5=hash;
                thisBm.lud=new Date();
              }
              if(callback!==undefined&&callback!==null){
                callback(thisBm);
              }
            }
          });
        }
        else{
          console.log("ErrorCode:"+this.status+" For URL:"+thisBm.url);
          thisBm.st=0;
          if(callback!==undefined&&callback!==null){
            callback(thisBm);
          }
        }

      }
    };
    xhr.send(null);
  }
}
function jsonObjectToBookmarkItem(json){
  return new bookmarkItem(json.url,json.name,new Date(json.lmd),new Date(json.lud),json.md5,json.st);
}
function jsonToBookmarkItem(json){
  return jsonObjectToBookmarkItem(JSON.parse(json));
}