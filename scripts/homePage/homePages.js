//id (id of the page)
function addPageToDisplayExternal(msg){
  var newPage= jsonToPageItem(msg.page);
  var myNode=document.getElementById("pageSelectionList");
  var plusNode=document.getElementById("=addPage");
  addPageToDisplayInternal(newPage,myNode,plusNode);
}
function updatePagesExternal(msg){
  getData(['pages'],function(data){
    refreshPagesAndBookmarksDisplay(data.pages);
  });
}

function addNewPage(pageName){
  console.log("homePages:addNewPage Called");
  getData(['pages'], function(data) {
    console.assert(data.pages!==undefined);
    var newPage = new pageItem(pageName,data.pages.length,[]);
    port.postMessage({'command':"addPage",
                      'page':newPage.jsonVal
                      });
  });
}
function getPageHTML(page){
  return page.getHtmlElement(function(){selectPageListener(page.id);}
                            ,function(){editPageListener(page.id);}
                            ,function(){deletePageListener(page.id);});
}
function addPageToDisplayInternal(page,listNode,plusNode){
  listNode.insertBefore(getPageHTML(page),plusNode);
}
//This function is kinda ghetto. IT SHOULD make the list, sort it, and then append the list
function refreshPagesHTML(pages,selectedPage){
  var myNode=document.getElementById("pageSelectionList");
  var plusNode=document.getElementById("=addPage");
  console.assert(varExists(plusNode));
  for(let i=0;i<myNode.children;){
    if(myNode[i].tagName==plusNode.tagName&&myNode[i].id!==plusNode.id){
      myNode.removeChild(myNode[i]);
    }
    else{
      ++i;
    }
  }
  while (myNode.firstChild.id!=plusNode.id) {
    myNode.removeChild(myNode.firstChild);
  }
  var pageElementsList=[];
  for(var i=0;i<pages.length;++i){
    (function(pageId,idx){
      getData(pageId,function(pageData){
        var page=jsonToPageItem(pageData[pageId]);
        pageElementsList.push({"ele":getPageHTML(page),"idx":idx});
        if(pageElementsList.length>=pages.length){
          sortBy(pageElementsList,["idx"]);
          for(var j=0;j<pageElementsList.length;++j){
            myNode.insertBefore(pageElementsList[j].ele,plusNode);
          }
          myNode.children[selectedPage].classList.add("selectedPage");
        }
      });
    })(pages[i],i);
  }
}

function deletePageListener(pageID){
  /*TODO: add behavior for deleting page and changing INDEX*/
  port.postMessage({'command':'deletePage','pageID':pageID});
}
function editPageListener(pageID){
  //not implemented.
}
function selectPageListener(pageID){
  console.log("select Page Listener called");
  var selectedPageNode=document.getElementById(pageID);
  console.log(selectedPageNode);
  if(!selectedPageNode.classList.contains("selectedPage")){
    console.log("Page isn't selected");
    let previousPages=document.getElementsByClassName("selectedPage");
    while(previousPages.length>0){
      previousPages[0].classList.remove("selectedPage");
    }
    selectedPageNode.classList.add("selectedPage");
    getData([pageID],function(data){
      console.assert(varExists(data[pageID]));
      let page=jsonToPageItem(data[pageID]);
      port.postMessage({'command':"updateLastUsedPage",
                        'pageIDX':page.idx
                      });
      currentPageIndex=page.idx;
      refreshBookmarksHTML(page.bm);
    });
  }
}