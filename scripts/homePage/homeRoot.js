//****************VARIABLES***************
var currentPageIndex=0;
var port=null;
//****************FUNCTIONS**************
function tryInitializeBookmarksPageContent(){
  var url = window.location.toString();
  if (url=="http://localhost:8000/html/bookmarksPage.html"){
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

//misc listeners
function refreshButton(){
  port.postMessage({'command':"refreshBookmarks"});
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

//DO NOT TRY TO ACCESS DOC BEFORE THIS! Access in initializeBookmarksPageContent
document.addEventListener('DOMContentLoaded', tryInitializeBookmarksPageContent);