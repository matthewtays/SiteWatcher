
// Saves options to chrome.storage
// there are 102,000 bytes available. This is enough to store like 20 pages of document as string. Enough for this probably, but consider limiting it.

//****************VARIABLES***************
var currentPageIndex=0;
var port=null;

//****************FUNCTIONS**************

//pageID, id
function addBookmarkToDisplayExternal(msg){
  if(msg.pageID==currentPageIndex){
    var newBookmark=jsonToBookmarkItem(msg.bookmark);
    var myNode = document.getElementById("bookMarksList");
    addBookmarkToDisplayInternal(newBookmark,myNode);
  }
  else{
    alert("PageID=="+msg.pageID+" currentPage=="+currentPageIndex);
  }
}

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
function tryInitializeBookmarksPageContent(){
  var url = window.location.toString();
  if (url=="http://localhost:8000/bookmarksPage.html"){
    initializeBookmarksPageContent();
  }
}
function initializeBookmarksPageContent() {
  //variables
  currentPageIndex=0;
  port = chrome.runtime.connect({name: "bookmarkFrontEndPort"});
  port.onMessage.addListener(function(msg) {
    switch(msg.command){
      case("addBookmarkToDisplay"):
        addBookmarkToDisplayExternal(msg);
        break;
      case("addPageToDisplay"):
        addPageToDisplayExternal(msg);
        break;
      case("updatePages"):
        updatePagesExternal(msg);
        break;
      case("updateBookmark"):
        updateBookmark(msg);
        break;
      case("removeBookmark"):
        removeBookmark(msg);
        break;
      case("testURLResponse"):
        testURLListener(msg);
        break;
      case("beginElementSelect"):
        break;
      case("updateBookmarkRules"):
        break;
      case("updateSavedRule"):
        break;
      default:
        alert("content received unknown command:"+msg.command);
    }
  });
  //Get new page button listener
  document.getElementById("submitPageButton").addEventListener("click", function(){
    addNewPage(document.getElementById("tabInputField").value);
  });
  //add listener to change of selected page
  document.getElementById("pageSelect").addEventListener("change",function(){
    updateSelectedPage();
  });
  //Add listener to refresh button
  document.getElementById("refreshButton").addEventListener("click",function(){
    refreshButton();
  });
  document.getElementById("createNewBookmarkButton").addEventListener("click",function(){
    displayBookmarkManipulationModal("addBookmarkModal",addNewBookmark,null)
  });
  document.getElementById("openAllUpdatedGlobalButton").addEventListener("click",function(){
    openAllUpdatedGlobal();
  });
  document.getElementById("markAllUpdatedGlobalButton").addEventListener("click",function(){
    markAllUpdatedGlobal();
  });
  document.getElementById("openAllUpdatedLocalButton").addEventListener("click",function(){
    openAllUpdatedLocal();
  });
  document.getElementById("markAllUpdatedLocalButton").addEventListener("click",function(){
    markAllUpdatedLocal();
  });
  document.getElementById("testURLButton").addEventListener("click",function(){
    displayTestURLModal("testPageModal",undefined,testURL,undefined);
  });
  document.getElementById("deletePageButton").addEventListener("click",function(){
    deletePageListener();
  });
  // When the user clicks anywhere outside of the modal, close it
  var addBookmarkModal=document.getElementById("addBookmarkModal");
  var testURLModal=document.getElementById("testPageModal");
  window.onclick = function(event) {
    if (event.target == addBookmarkModal) {
      cancelAddBookmark("addBookmarkModal");
    }
    else if(event.target==testURLModal){
      cancelTestURL(undefined,"testPageModal");
    }
  }
  //Load in bookmarks
  getData({
    'pages': [],
    'lup': 0
  }, function(data) {
    var pages=data.pages;
    currentPageIndex=data.lup;
    console.assert(pages!==undefined);
    console.assert(pages.length>0);
    if(currentPageIndex>=pages.length){
      currentPageIndex=0;
    }
    refreshPagesAndBookmarksDisplay(pages);
  });
}
function refreshPagesAndBookmarksDisplay(pages){
  refreshPagesHTML(pages,currentPageIndex);
  var currentPageID=pages[currentPageIndex];
  getData(currentPageID,function(pageData){
    console.assert(pageData[currentPageID]!==undefined);
    var currentPage=jsonToPageItem(pageData[currentPageID]);
    refreshBookmarksHTML(currentPage.bm);
  });
}
function addNewBookmark(url,name,pageID){
  var newBookmark=new bookmarkItem(url,name);
  port.postMessage({'command':"addBookMark",
                    'pageID':pageID,
                    'bookmark':newBookmark.jsonVal
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
function updateBookmark(msg){
  var bookmark=jsonToBookmarkItem(msg.bookmark);
  var origID=bookmark.id;
  if(msg.origID!==undefined&&msg.origID!==null){
    origID=msg.origID;
  }
  var bmElement=document.getElementById(origID);
  if(bmElement!==undefined&&bmElement!==null){
    if(msg.destinationPage!==undefined&&msg.destinationPage!==currentPageIndex){
      bmElement.parentNode.removeChild(bmElement);
    }
    else{
      var newNode=bookmark.getHtmlElement(function(){bookmarkStatusListener(bookmark.id);}
                                         ,function(){bookmarkDeleteListener(bookmark.id);}
                                         ,function(){bookmarkEditListener(bookmark);}
                                          );
      document.getElementById("bookMarksList").replaceChild(newNode,bmElement);     
    }
  }
  else{
    if(msg.destinationPage==currentPageIndex){
      updateSelectedPage();
    }
  }
}
function removeBookmark(msg){
  var bookmarkID=msg.bmID;
  var bmElement=document.getElementById(bookmarkID);
  if(bmElement!==undefined&&bmElement!==null){
    bmElement.parentNode.removeChild(bmElement);
  }
}

function addPageToDisplayInternal(page,listNode){
  listNode.append(page.htmlElement);
}
function addBookmarkToDisplayInternal(bookmark,listNode){
  listNode.append(bookmark.getHtmlElement(function(){bookmarkStatusListener(bookmark.id);}
                                         ,function(){bookmarkDeleteListener(bookmark.id);}
                                         ,function(){bookmarkEditListener(bookmark);}
                                          ));
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

function refreshBookmarksHTML(pageBookmarks){
  //clear all child nodes
  console.log("refresh bookmarks called");
  var myNode = document.getElementById("bookMarksList");
  while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
  }
  //insert new bookmarks
  if(pageBookmarks!=null){
    for(var i=0;i<pageBookmarks.length;++i){
      (function(bookmarkID){
        getData(bookmarkID,function(bookmarkData){
          var bookmark=jsonToBookmarkItem(bookmarkData[bookmarkID]);
          addBookmarkToDisplayInternal(bookmark,myNode);
        }); 
      })(pageBookmarks[i]);
    }
  }
}

function refreshButton(){
  port.postMessage({'command':"refreshBookmarks"});
}

function bookmarkStatusListener(bookmarkID){
  port.postMessage({'command':"toggleBMStatus",
                    'bmID':bookmarkID
                  });
}
function bookmarkDeleteListener(bookmarkID){
  port.postMessage({'command':"DeleteBookmark",
                    'bmID':bookmarkID
                  });
}
function confirmEditBookmark(url,name,pageIDX,storedData){
  var tempBookmark=new bookmarkItem(url,name);
  port.postMessage({'command':"editBookmark",
                    'origID':storedData.orig.id,
                    'bookmark':tempBookmark.jsonVal,
                    'pageIDX':pageIDX,
                    'origPageIDX':storedData.page
                  });    
}
function bookmarkEditListener(bookmark){
  displayBookmarkManipulationModal("addBookmarkModal",confirmEditBookmark,undefined,bookmark.url,bookmark.name,currentPageIndex,{'orig':bookmark,'page':currentPageIndex});
}
function openAllUpdatedGlobal(){
  port.postMessage({'command':"openAllUpdated"});
}
function markAllUpdatedGlobal(){
  port.postMessage({'command':"markAllUpToDate"});
}
function openAllUpdatedLocal(){
  port.postMessage({'command':"openAllUpdated",'pageID':currentPageIndex});
}
function markAllUpdatedLocal(){
  port.postMessage({'command':"markAllUpToDate",'pageID':currentPageIndex});
}
function testURLListener(msg){
  var strippedHTML=msg.html;
  document.getElementById("htmlDisplayArea").innerHTML=strippedHTML;
}
function testURL(url){
  port.postMessage({'command':'testURL','url':url});
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
//DO NOT TRY TO ACCESS DOC BEFORE THIS! Access in initializeBookmarksPageContent
document.addEventListener('DOMContentLoaded', tryInitializeBookmarksPageContent);