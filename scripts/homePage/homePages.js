//id (id of the page)
function addPageToDisplayExternal(msg){
  var newPage= jsonToPageItem(msg.page);
  var myNode=document.getElementById("pageSelect");
  addPageToDisplayInternal(newPage,myNode);
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
function updateSelectedPage(){
  var selectNode=document.getElementById("pageSelect");
  var newPageIndex=selectNode.selectedIndex;
  if(currentPageIndex!=newPageIndex){
    currentPageIndex=newPageIndex;
    getData(['pages'], function(data) {
      console.assert(data.pages!==undefined&&data.pages.length>0);
      var pageName=data.pages[newPageIndex];
      getData(pageName,function(pageData){
        console.assert(pageData[pageName]!==undefined);
        port.postMessage({'command':"updateLastUsedPage",
                          'pageIDX':newPageIndex
                        });
        var page=jsonToPageItem(pageData[pageName]);
        refreshBookmarksHTML(page.bm);
      });
    });
  }
}
function addPageToDisplayInternal(page,listNode){
  listNode.append(page.htmlElement);
}
//This function is kinda ghetto. IT SHOULD make the list, sort it, and then append the list
function refreshPagesHTML(pages,selectedPage){
  console.log("refreshing html pages:"+pages.length);
  var myNode=document.getElementById("pageSelect");
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
  var pageElementsList=[];
  for(var i=0;i<pages.length;++i){
    (function(pageId,idx){
      getData(pageId,function(pageData){
        var page=jsonToPageItem(pageData[pageId]);
        pageElementsList.push({"ele":page.htmlElement,"idx":idx});
        if(pageElementsList.length>=pages.length){
          sortBy(pageElementsList,["idx"]);
          for(var j=0;j<pageElementsList.length;++j){
            myNode.append(pageElementsList[j].ele);
          }
          myNode.selectedIndex=selectedPage;
        }
      });
    })(pages[i],i);
  }
}

function deletePageListener(){
  var node = document.getElementById("pageSelect");
  var pageName = node.options[node.selectedIndex].value;
  var pageID=pageItem.nameToID(pageName);
  currentPageIndex-= (currentPageIndex<=0? 0:1);
  node.selectedIndex=currentPageIndex;
  port.postMessage({'command':"updateLastUsedPage",
                  'pageIDX':currentPageIndex
                  });
  port.postMessage({'command':'deletePage','pageID':pageID});
}