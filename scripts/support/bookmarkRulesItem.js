class bookmarkRulesItem{
  //var cssPath direct storage of querystring path
  //var inc (whether this is an include, or exclude rule)
  //var name name of the rule, usually the url
  //var nickname a name for an individual rule that helps a user identify it
  constructor(name,cssPath,inc,nickname){
    this.name=name;
    if(varExists(cssPath)){
      this.cssPath=cssPath;
    }
    if(varExists(inc)){
      this.inc=inc;
    }
    if(varExists(nickname)){
      this.nickname=nickname;
    }
    else{
      this.nickname="";
    }
  }
  get id(){//One ID corresponds to a whole array of bookmarkRulesItems
    return '+'+this.name;
  }
  static URLToID(url){//Generic rules will have this be their id, but its a good generic
    return '+'+url;
  }
  static isID(id){
    return id.charAt(0)=='+';
  }
  static IDToURL(id){
    return id.slice(1);
  }
  //FROM STACK OVERFLOW
  previousElementSibling (el) {
    if (el.previousElementSibling !== 'undefined') {
      return el.previousElementSibling;
    } else {
      // Loop through ignoring anything not an element
      while (el = el.previousSibling) {
        if (el.nodeType === 1) {
          return el;
        }
      }
    }
  }
  getCSSPath (el) {
    // False on non-elements
    if (!(el instanceof HTMLElement)) { return false; }
    var path = [];
    while (varExists(el)&&el.nodeType === Node.ELEMENT_NODE) {
      var selector = el.nodeName;
      if (el.id) { selector += ('#' + el.id); }
      else {
        // Walk backwards until there is no previous sibling
        var sibling = el;
        // Will hold nodeName to join for adjacent selection
        var siblingSelectors = [];
        while (sibling !== null && sibling.nodeType === Node.ELEMENT_NODE) {
          siblingSelectors.unshift(sibling.nodeName);
          sibling = this.previousElementSibling(sibling);
        }
        // :first-child does not apply to HTML
        if (siblingSelectors[0] !== 'HTML') {
          siblingSelectors[0] = siblingSelectors[0] + ':first-child';
        }
        selector = siblingSelectors.join(' + ');
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(' > ');
  }
  //end from stackoverflow
  setupFromNode(node){
    this.cssPath=this.getCSSPath(node);
  }
  logThis(){
    return this.cssPath;
  }
  locateOnDoc(doc){
    return doc.querySelectorAll(this.cssPath);
  }
  executeOnDoc(doc,addOn){//Includes tack things on to the addOn, excludes remove them from the doc. Includes should ALWAYS process first
    if(this.inc==undefined){
      console.log("Include was no defined for rule item");
      return;
    }
    let nodes=this.locateOnDoc(doc);
    if(this.inc==true){
      for(let i=0;i<nodes.length;++i){
        addOn.push(nodes[i].innerHTML);
      }
    }
    else{
      for(let i=0;i<nodes.length;++i){
        if(nodes[i].parentNode!==undefined&&nodes[i].parentNode!==null){
          nodes[i].parentNode.removeChild(nodes[i]);
        }
        else{
          doc.documentElement.remove();
          break;
        }
      }
    }
    return {"doc":doc,"addOn":addOn};
  }
  static executeArray(listOfRules,doc){
    //first those that include
    if(!varExists(doc)||!varExists(doc.documentElement)){
      return "";
    }
    let dataPacket={"doc":doc,"addOn":[]};
    for(let i=0;i<listOfRules.length;++i){
      if(listOfRules[i].inc){
        dataPacket=listOfRules[i].executeOnDoc(dataPacket.doc,dataPacket.addOn);
      }
    }
    //then those that exclude
    for(let i=0;i<listOfRules.length;++i){
      if(!listOfRules[i].inc){
        dataPacket=listOfRules[i].executeOnDoc(dataPacket.doc,dataPacket.addOn);
      }
    }
    let resultString="";
    if(varExists(dataPacket.doc.documentElement)){
      resultString=dataPacket.doc.documentElement.outerHTML;
    }
    for(let i=0;i<dataPacket.addOn.length;++i){
      resultString+=dataPacket.addOn[i];
    }
    return resultString;
  }
  static locateAllArray(listOfRules,doc){
    let result={"include":[],"exclude":[]};
    for(let i=0;i<listOfRules.length;++i){
      if(listOfRules[i].inc){
        result.include.push(listOfRules[i].locateOnDoc(doc));
      }
      else{
        result.exclude.push(listOfRules[i].locateOnDoc(doc));
      }
    }
    return result;
  }
  getHtmlElement(deleteCallback,selectCallback,id){
    let ruleHTML=document.createElement("SiteWatcherElementSelectorRuleItem");
    let nicknameElement=document.createElement("SiteWatcherElementSelectorRuleNickname");
    nicknameElement.innerHTML=this.nickname;
    let selectActionElement=document.createElement("SiteWatcherElementSelectorRuleSelect");
    selectActionElement.innerHTML="Select";
    selectActionElement.addEventListener("click",selectCallback);
    let deleteActionElement=document.createElement("SiteWatcherElementSelectorRuleDelete");
    deleteActionElement.innerHTML="delete";
    deleteActionElement.addEventListener("click",deleteCallback);
    ruleHTML.appendChild(nicknameElement);
    ruleHTML.appendChild(selectActionElement);
    ruleHTML.appendChild(deleteActionElement);
    ruleHTML.id=id;
    return ruleHTML;
  }
  get jsonVal(){
    return JSON.stringify(this);
  }
}
function jsonObjectToRuleItem(json){
  return new bookmarkRulesItem(json.name,json.cssPath,json.inc,json.nickname);
}
function jsonToRuleItem(json){
  return jsonObjectToRuleItem(JSON.parse(json));
}