//var SortKeys=new Map([[0,"isUpToDate"],[1,"name"],[2,"url"],[3,"st"],[4,"lud"],[5,"posOnPage"]]);//posOnPage requires an exception. Must be loaded onto the bookmark objects before they are sorted.
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
}
function jsonObjectToPageItem(json){
  return new pageItem(json.name,json.idx,json.bm);
}
function jsonToPageItem(json){
  return jsonObjectToPageItem(JSON.parse(json));
}