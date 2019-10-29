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
  getData(['pages'], function(data) {
    console.assert(data.pages!==undefined);
    var newPage = new pageItem(pageName,data.pages.length,[]);
    port.postMessage({'command':"addPage",
                      'page':newPage.jsonVal
                      });
  });
}
function confirmEditPage(pageName,storedData){
  var newPage=new pageItem(pageName,storedData.orig.idx,storedData.orig.bm);
  potentialPageID=newPage.id;
  port.postMessage({'command':"editPage"
                   ,'origID':storedData.orig.id
                   ,'page':newPage.jsonVal});
}
function getPageHTML(page){
  return page.getHtmlElement(function(){selectPageListener(page.id);}
                            ,function(){editPageListener(page.id);}
                            ,function(){deletePageListener(page.id);}
                            ,function(){openAllUpdatedLocal(page.id);}
                            ,function(){markAllUpdatedLocal(page.id);}
                            ,function(){refreshLocalPage(page.id);}
                            );
}
function addPageToDisplayInternal(page,listNode,plusNode){
  listNode.insertBefore(getPageHTML(page),plusNode);
}
//This function is kinda ghetto. IT SHOULD make the list, sort it, and then append the list
function refreshPagesHTML(pages,selectedPageID){
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
        let localElement=getPageHTML(page);
        if(page.id==selectedPageID){
          localElement.classList.add("selectedPage");
        }
        pageElementsList.push({"ele":localElement,"idx":idx});
        if(pageElementsList.length>=pages.length){
          sortBy(pageElementsList,["idx"]);
          for(var j=0;j<pageElementsList.length;++j){
            myNode.insertBefore(pageElementsList[j].ele,plusNode);
          }
        }
      });
    })(pages[i],i);
  }
}

function deletePageListener(pageID){
  port.postMessage({'command':'deletePage','pageID':pageID});
}
function editPageListener(pageID){
  getData([pageID],function(data){
    let page=jsonToPageItem(data[pageID]);
    displayAddPageModal("addPageModal",confirmEditPage,undefined,page.name,{'orig':page})
  });
}
function selectPageListener(pageID){
  var selectedPageNode=document.getElementById(pageID);
  if(!selectedPageNode.classList.contains("selectedPage")){
    let previousPages=document.getElementsByClassName("selectedPage");
    while(previousPages.length>0){
      previousPages[0].classList.remove("selectedPage");
    }
    selectedPageNode.classList.add("selectedPage");
    getData([pageID],function(data){
      console.assert(varExists(data[pageID]));
      let page=jsonToPageItem(data[pageID]);
      port.postMessage({'command':"updateLastUsedPage",
                        'pageID':page.id
                      });
      currentPageID=page.id;
      refreshBookmarksHTML(page.bm);
    });
  }
}
function refreshLocalPage(pageID){
  port.postMessage({'command':"refreshBookmarks"
                   ,'pageID':pageID});
}