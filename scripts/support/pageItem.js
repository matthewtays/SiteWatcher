//var SortKeys=new Map([[0,"isUpToDate"],[1,"name"],[2,"url"],[3,"st"],[4,"lud"],[5,"posOnPage"]]);//posOnPage requires an exception. Must be loaded onto the bookmark objects before they are sorted.
/*    <pageDisplayItem id="-defaultPage" class="selectedPage">
        <p class="no-margin">default</p>
        <pageOptionsItem>
          <pageDisplayDropdownBtn>v</pageDisplayDropdownBtn>
          <pageDisplayDropdownContent class="hidden">
            <pageDisplayDropdownItem>Edit</pageDisplayDropdownItem>
            <pageDisplayDropdownItem>Delete</pageDisplayDropdownItem>
            <pageDisplayDropdownItem>mark all</pageDisplayDropdownItem>
            <pageDisplayDropdownItem>open all</pageDisplayDropdownItem>
            <pageDisplayDropdownItem>refresh</pageDisplayDropdownItem>
          </pageDisplayDropdownContent>
        </pageOptionsItem>
      </pageDisplayItem>
      */
class pageItem{
  //var name
  //var bm //bookmarks
  //var idx used for sorting purposes
  //var sort //Sort is an array of sort objects. a sort object is a number represnting sort variable, and a number 0 1 for if its less than or greater than. 0 is less than
  //Sorting options include by marked, by name, by url, by position in page index, and by last updated
  constructor(name,idx,bookmarks){
    if(typeof name === undefined){
      return;
    }
    if(name.charAt(0)==='-'){
      this.name=name.slice(1);
    }
    else{
      this.name=name;
    }
    console.assert(varExists(idx));
    this.idx=idx;
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
  static dropDownItem(callback,innerText,parentNode){
    let newNode=document.createElement("pageDisplayDropdownItem");
    newNode.innerHTML=innerText;
    newNode.addEventListener("click",function(){
      parentNode.classList.add("hidden");
      callback();
    });
    parentNode.appendChild(newNode);
    return newNode;
  }
  getHtmlElement(selectCallback,editCallback,deleteCallback,openAllCallback,markAllCallback,refreshAllCallback){
    var node=document.createElement("pageDisplayItem");
    node.id=this.id;
    node.addEventListener("click",selectCallback);
    var textNode=document.createElement("p");
    textNode.classList.add("no-margin");
    textNode.innerHTML=this.name;
    let optionNode=document.createElement("pageOptionsItem");
    optionNode.addEventListener("click",function(){event.stopPropagation();});//Prevents edit and delete commands from propogating to the select
    let displayBtnNode=document.createElement("pageDisplayDropdownBtn");
    let contentNode=document.createElement("pageDisplayDropdownContent");
    displayBtnNode.innerHTML="v";
    displayBtnNode.addEventListener("click",function(){
      contentNode.classList.toggle("hidden");
    });
    contentNode.classList.add("hidden");
    pageItem.dropDownItem(openAllCallback,"Open All",contentNode);
    pageItem.dropDownItem(markAllCallback,"Mark All",contentNode);
    pageItem.dropDownItem(refreshAllCallback,"Refresh",contentNode);
    pageItem.dropDownItem(editCallback,"Edit",contentNode);
    pageItem.dropDownItem(deleteCallback,"Delete",contentNode);
    optionNode.appendChild(displayBtnNode);
    optionNode.appendChild(contentNode);
    node.appendChild(textNode);
    node.appendChild(optionNode);
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
  get htmlElement(){
    console.assert(false);
    return undefined;
  }
}
function jsonObjectToPageItem(json){
  return new pageItem(json.name,json.idx,json.bm);
}
function jsonToPageItem(json){
  return jsonObjectToPageItem(JSON.parse(json));
}