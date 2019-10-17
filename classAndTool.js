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
    var node=document.createElement("bookmarksListItem");
    var linkNode=document.createElement("bookmarkLink");
    var statusNode=document.createElement("bookmarkStatus");
    var actionNode=document.createElement("bookmarkAction");
    linkNode.innerHTML='<a href="'+this.url+'">'+this.name+'</a>';
    var statusButton=document.createElement("button");
    statusButton.className="textOnly";
    statusButton.addEventListener("click",statusButtonCallback);
    if(this.isUpToDate){//Defer to updated if equal
        statusButton.innerHTML="Up to date";
        statusButton.className+=" upToDate";
      }
      else{
        statusButton.innerHTML="Updated";
        statusButton.className+=" updated";
    }
    if(this.st!==2){
      statusButton.innerHTML+=" (?)";//Should be a hoverable object
    }
    statusNode.appendChild(statusButton);
    var deleteButton=document.createElement('button');
    deleteButton.className="textOnly updated";//updated is for the red.
    deleteButton.addEventListener("click",deleteButtonCallback);
    deleteButton.innerHTML="remove";
    var editButton=document.createElement('button');
    editButton.className="textOnly edit";
    var tempURL=this.url;
    var tempName=this.name;
    var tempJSON=this.jsonVal;
    editButton.addEventListener("click",editButtonCallback);
    editButton.innerHTML="edit";
    actionNode.appendChild(deleteButton);
    actionNode.appendChild(editButton);
    node.appendChild(linkNode);
    node.appendChild(statusNode);
    node.appendChild(actionNode);
    node.id=this.id;
    return node;
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
//var SortKeys=new Map([[0,"isUpToDate"],[1,"name"],[2,"url"],[3,"st"],[4,"lud"],[5,"posOnPage"]]);//posOnPage requires an exception. Must be loaded onto the bookmark objects before they are sorted.
class pageItem{
  //var name
  //var bm //bookmarks
  //var sort //Sort is an array of sort objects. a sort object is a number represnting sort variable, and a number 0 1 for if its less than or greater than. 0 is less than
  //Sorting options include by marked, by name, by url, by position in page index, and by last updated
  constructor(name,bookmarks){
    if(typeof name === undefined){
      return;
    }
    if(name.charAt(0)==='-'){
      this.name=name.slice(1);
    }
    else{
      this.name=name;
    }
    if(bookmarks===undefined){
      this.bm=[];
    }
    else{
      this.bm=bookmarks;
    }
  }
  addBookmark(id){
    this.bm.push(id);
  }
  removeBookmark(id){
    var index = this.bm.indexOf(id);
    if (index > -1) {
      this.bm.splice(index, 1);
    }
  }
  get htmlElement(){
    var node=document.createElement("option");
    node.id=this.id;
    node.innerHTML=this.name;
    node.className="pagesBarItem";
    return node;
  }
  get id(){
    return '-'+this.name;
  }
  static nameToID(name){
    return '-'+name;
  }
  get jsonVal(){
    return JSON.stringify(this);
  }
  get idx(){
    console.assert(false);
  }
}
function jsonObjectToPageItem(json){
  return new pageItem(json.name,json.bm);
}
function jsonToPageItem(json){
  return jsonObjectToPageItem(JSON.parse(json));
}
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

function lessThan(x,y,myAttList,equalTo){
  for(var i=0;i<myAttList.length;++i){
    var att=myAttList[i];
    if(x[att]!==undefined&&y[att]!==undefined){
      if(equalTo){
        return x[att]<=y[att];
      }
      else if(x[att]==y[att]){
        continue;
      }
      else{
        return x[att]<y[att];
      }
    }
    else if(x[att]===undefined&&y[att]===undefined){
      continue;
    }
    else if(x[att]===undefined){
      return true;
    }
    else if(y[att]===undefined){
      return false;
    }
  }
  //they are equal
  if(equalTo){
    return true;
  }
  else{
    return false;
  }
  
}
function partition(array, left, right,attList) {
    var pivot = array[(left + right) >>> 1];
    while (left <= right) {
        while (lessThan(array[left],pivot,attList,false)) { left++; }
        while (lessThan(pivot,array[right],attList,false)) { right--; }
        if (left <= right) {
            var temp = array[left];
            array[left++] = array[right];
            array[right--] = temp;
        }
    }
    return left;
}
function quicksort(array, left, right,attList) {
  var mid = partition(array, left, right,attList);
  if (left < mid - 1) {
      quicksort(array, left, mid - 1,attList);
  }
  if (right > mid) {
      quicksort(array, mid, right,attList);
  }
}

function sortBy(myList,myAttList){
  quicksort(myList,0,myList.length-1,myAttList);
  return myList;
}

function varExists(variable){
  return variable!==null&&variable!==undefined;
}







// MD5
function md5cycle(x, k) {
  var a = x[0], b = x[1], c = x[2], d = x[3];

  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17,  606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12,  1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7,  1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7,  1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22,  1236535329);

  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14,  643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9,  38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5,  568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20,  1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14,  1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);

  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16,  1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11,  1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4,  681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23,  76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16,  530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);

  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10,  1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6,  1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6,  1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[13], 21,  1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15,  718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = add32(a, x[0]);
  x[1] = add32(b, x[1]);
  x[2] = add32(c, x[2]);
  x[3] = add32(d, x[3]);

}

function cmn(q, a, b, x, s, t) {
  a = add32(add32(a, q), add32(x, t));
  return add32((a << s) | (a >>> (32 - s)), b);
}

function ff(a, b, c, d, x, s, t) {
  return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function gg(a, b, c, d, x, s, t) {
  return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function hh(a, b, c, d, x, s, t) {
  return cmn(b ^ c ^ d, a, b, x, s, t);
}

function ii(a, b, c, d, x, s, t) {
  return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

function md51(s) {
  txt = '';
  var n = s.length,
  state = [1732584193, -271733879, -1732584194, 271733878], i;
  for (i=64; i<=s.length; i+=64) {
    md5cycle(state, md5blk(s.substring(i-64, i)));
  }
  s = s.substring(i-64);
  var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
  for (i=0; i<s.length; i++) tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
  tail[i>>2] |= 0x80 << ((i%4) << 3);
  if (i > 55) {
    md5cycle(state, tail);
    for (i=0; i<16; i++) tail[i] = 0;
  }
  tail[14] = n*8;
  md5cycle(state, tail);
  return state;
}

/* there needs to be support for Unicode here,
 * unless we pretend that we can redefine the MD-5
 * algorithm for multi-byte characters (perhaps
 * by adding every four 16-bit characters and
 * shortening the sum to 32 bits). Otherwise
 * I suggest performing MD-5 as if every character
 * was two bytes--e.g., 0040 0025 = @%--but then
 * how will an ordinary MD-5 sum be matched?
 * There is no way to standardize text to something
 * like UTF-8 before transformation; speed cost is
 * utterly prohibitive. The JavaScript standard
 * itself needs to look at this: it should start
 * providing access to strings as preformed UTF-8
 * 8-bit unsigned value arrays.
 */
function md5blk(s) { /* I figured global was faster.   */
  var md5blks = [], i; /* Andy King said do it this way. */
  for (i=0; i<64; i+=4) {
    md5blks[i>>2] = s.charCodeAt(i)
    + (s.charCodeAt(i+1) << 8)
    + (s.charCodeAt(i+2) << 16)
    + (s.charCodeAt(i+3) << 24);
  }
  return md5blks;
}

var hex_chr = '0123456789abcdef'.split('');

function rhex(n)
{
  var s='', j=0;
  for(; j<4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]+ hex_chr[(n >> (j * 8)) & 0x0F];
  return s;
}

function hex(x) {
  for (var i=0; i<x.length; i++) x[i] = rhex(x[i]);
  return x.join('');
}

function md5(s) {
  return hex(md51(s));
}

/* this function is much faster,
so if possible we use it. Some IEs
are the only ones I know of that
need the idiotic second function,
generated by an if clause.  */

function add32(a, b) {
  return (a + b) & 0xFFFFFFFF;
}

if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
  function add32(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF),
    msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }
}