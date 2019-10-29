//****************VARIABLES***************
var currentPageID="";
var potentialPageID=undefined;
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
  currentPageID="-default";
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
  document.getElementById("=addPage").addEventListener("click",function(){
    displayAddPageModal("addPageModal",addNewPage);
  });
  //Add listener to refresh button
  document.getElementById("refreshButtonGlobal").addEventListener("click",function(){
    refreshButtonGlobal();
  });
  document.getElementById("refreshButtonLocal").addEventListener("click",function(){
    refreshLocalPage();
  });
  document.getElementById("=addBookmark").children[0].addEventListener("click",function(){
    displayBookmarkManipulationModal("addBookmarkModal",addNewBookmark,null)
  });
  document.getElementById("openAllButtonGlobal").addEventListener("click",function(){
    openAllUpdatedGlobal();
  });
  document.getElementById("markAllButtonGlobal").addEventListener("click",function(){
    markAllUpdatedGlobal();
  });
  document.getElementById("openAllButtonLocal").addEventListener("click",function(){
    openAllUpdatedLocal();
  });
  document.getElementById("markAllButtonLocal").addEventListener("click",function(){
    markAllUpdatedLocal();
  });
  document.getElementById("testUrlGlobal").addEventListener("click",function(){
    displayTestURLModal("testURLModal",undefined,testURL,undefined);
  });
  // When the user clicks anywhere outside of the modal, close it
  var addBookmarkModal=document.getElementById("addBookmarkModal");
  var testURLModal=document.getElementById("testURLModal");
  var addPageModal=document.getElementById("addPageModal");
  window.onclick = function(event) {
    if (event.target == addBookmarkModal) {
      cancelAddBookmark("addBookmarkModal");
    }
    else if(event.target==testURLModal){
      cancelTestURL(undefined,"testURLModal");
    }
    else if(event.target==addPageModal){
      hideAddPageModal("addPageModal");
    }
    else if(event.target.tagName!=='pageDisplayDropdownContent'){
      closeAllDropdowns();
    }
  }
  //Load in bookmarks
  getData({'pages': []}, function(data) {
    var pages=data.pages;
    getData(['lup'],function(lupData){
      currentPageID=lupData.lup;
      if(currentPageID==undefined){
        currentPageID=pages[0];
      }
      console.assert(pages!==undefined);
      console.assert(pages.length>0);
      refreshPagesAndBookmarksDisplay(pages);
    });
  });
}
function refreshPagesAndBookmarksDisplay(pages){
  var temp=currentPageID;
  currentPageID=pages[0];
  console.log("pages =="+pages);
  let exists=false;
  for(let i=0;i<pages.length;++i){
    if(pages[i]==temp){
      currentPageID=temp;
      exists=true;
      break;
    }
  }
  if(!exists){
    for(let i=0;i<pages.length;++i){
      if(pages[i]==potentialPageID){
        currentPageID=potentialPageID;
        break;
      }
    }
  }
  refreshPagesHTML(pages,currentPageID);
  getData(currentPageID,function(pageData){
    console.log("refreshing: currentPageID="+currentPageID);
    console.assert(pageData[currentPageID]!==undefined);
    var currentPage=jsonToPageItem(pageData[currentPageID]);
    refreshBookmarksHTML(currentPage.bm);
  });
}

//misc listeners
function refreshButtonGlobal(){
  port.postMessage({'command':"refreshBookmarks"});
}
function openAllUpdatedGlobal(){
  port.postMessage({'command':"openAllUpdated"});
}
function markAllUpdatedGlobal(){
  port.postMessage({'command':"markAllUpToDate"});
}
function openAllUpdatedLocal(){
  port.postMessage({'command':"openAllUpdated",'pageID':currentPageID});
}
function markAllUpdatedLocal(){
  port.postMessage({'command':"markAllUpToDate",'pageID':currentPageID});
}
function testURLListener(msg){
  var strippedHTML=msg.html;
  document.getElementById("htmlDisplayArea").innerHTML=strippedHTML;
}
function testURL(url){
  port.postMessage({'command':'testURL','url':url});
}
function closeAllDropdowns(){
  var dropdowns = document.getElementsByTagName("pageDisplayDropdownContent");
  var i;
  for (i = 0; i < dropdowns.length; i++) {
    let openDropdown = dropdowns[i];
    if (!openDropdown.classList.contains('hidden')) {
      openDropdown.classList.add('hidden');
    }
  }
}
//DO NOT TRY TO ACCESS DOC BEFORE THIS! Access in initializeBookmarksPageContent
document.addEventListener('DOMContentLoaded', tryInitializeBookmarksPageContent);