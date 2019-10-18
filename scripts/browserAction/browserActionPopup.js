function goToHomeAction() {
  chrome.tabs.create({ url: "http://localhost:8000/html/bookmarksPage.html" })
  /*chrome.tabs.query({active: true,currentWindow: true}, function (tabs){
    
  });*/
}
var localBookmark=undefined;
var tab;
var port = chrome.runtime.connect({name: "bookmarkFrontEndPort"});
var pathToImage="../../images/";
port.onMessage.addListener(function(msg) {
  switch(msg.command){
    case("addBookmarkToDisplay"):
      checkIfUpdateLocalBookmark(msg);
      break;
    case("addPageToDisplay"):
      break;
    case("updatePages"):
      break;
    case("updateBookmark"):
      checkIfUpdateBookmark(msg);
      break;
    case("removeBookmark"):
      checkIfRemoveLocalBookmark(msg);
      break;
    case("beginElementSelect"):
      break;
    case("updateBookmarkRules"):
      break;
    case("updateSavedRule"):
      break;
    default:
      alert("browser Action received unknown command:"+msg.command);
  }
});
function checkIfUpdateLocalBookmark(msg){
  var bookmark=jsonToBookmarkItem(msg.bookmark);
  if(bookmark.url===tab.url){
    setLocalBookmarkInfo(bookmark);
  }
}
function checkIfUpdateBookmark(msg){
  var bookmarkTemp=jsonToBookmarkItem(msg.bookmark);
  var origID=bookmarkTemp.id;
  if(msg.origID!==undefined&&msg.origID!==null){
    origID=msg.origID;
  }
  if(localBookmark!==undefined&&bookmarkTemp.id==localBookmark.id){
    setLocalBookmarkInfo(bookmarkTemp);
  }
  else if(bookmarkTemp.url===tab.url){
    setLocalBookmarkInfo(bookmarkTemp);
  }
  else if(localBookmark!==undefined&&origID==localBookmark.id){
    localBookmark=undefined;
    document.getElementById("bookmarkToggle").src=pathToImage+"EmptyStar.png";
    document.getElementById("updatedIndicator").style.display="none";
    document.getElementById("elementSelectorButton").style.display="none";
  }
}
function checkIfRemoveLocalBookmark(msg){
  if(localBookmark!==undefined&&msg.bmID===localBookmark.id){
    localBookmark=undefined;
    document.getElementById("bookmarkToggle").src=pathToImage+"EmptyStar.png";
    document.getElementById("updatedIndicator").style.display="none";
    document.getElementById("elementSelectorButton").style.display="none";
  }
}
function queryPage(bookmark){
  if(bookmark===undefined){
    return undefined;
  }
  return undefined;
}
function toggleBookmarkedAction(){
  var nameVal="";
  if(localBookmark!==undefined){
    nameVal=localBookmark.name;
    document.getElementById("cancelAddBookmark").value="remove";
  }
  else{
    nameVal=tab.title;
    document.getElementById("cancelAddBookmark").value="cancel";
  }
  displayBookmarkManipulationModal("addBookmarkModal",confirmBookmark,removeBookmark,tab.url,nameVal,queryPage(localBookmark));
}
function confirmBookmark(url,name,pageIDX){
  if(localBookmark===undefined){
    var newBookmark=new bookmarkItem(url,name);
    port.postMessage({'command':"addBookMark",
                    'pageID':pageIDX,
                    'bookmark':newBookmark.jsonVal
                    });
  }
  else{
    //This is an edit command
  }
}
function removeBookmark(){
  if(localBookmark!==undefined){
    port.postMessage({'command':"DeleteBookmark",
                    'bmID':localBookmark.id
                    });
  }
}
function openAllUpdated(){
  port.postMessage({'command':"openAllUpdated"});
}
function markAllUpdated(){
  port.postMessage({'command':"markAllUpToDate"});
}
function toggleUpdated(){
  if(localBookmark!==undefined){
    port.postMessage({'command':"toggleBMStatus",
                      'bmID':localBookmark.id
                    });
  }
}
function setLocalBookmarkInfo(bookmark){
  var updatedIndicator=document.getElementById("updatedIndicator");
  updatedIndicator.style.display = "block";
  document.getElementById("elementSelectorButton").style.display="block";
  localBookmark=bookmark;
  document.getElementById("bookmarkToggle").src=pathToImage+"star.png";
  if(localBookmark.isUpToDate){
    updatedIndicator.src=pathToImage+"emptyCircle.png";
  }
  else{
    updatedIndicator.src=pathToImage+"filledCircle.png";
  }
}
function startElementSelect(){
  if(localBookmark!==null&&localBookmark!==undefined){
    port.postMessage({'command':"triggerSelect",
                      'url':localBookmark.url
                    });
  }
};
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("goToHomeButton").addEventListener("click", goToHomeAction);
  document.getElementById("bookmarkToggle").addEventListener("click",toggleBookmarkedAction);
  document.getElementById("openAllUpdated").addEventListener("click",openAllUpdated);
  document.getElementById("markAllUpdated").addEventListener("click",markAllUpdated);
  document.getElementById("updatedIndicator").addEventListener("click",toggleUpdated);
  document.getElementById("elementSelectorButton").addEventListener("click",startElementSelect);
  getActiveTab(function (tabs) {
    tab = tabs[0];
    var tempBookmark=new bookmarkItem(tab.url,tab.title);
    var bookmarkID=tempBookmark.id;
    getData(bookmarkID,function(bookmarkData){
      if(bookmarkData[bookmarkID]===undefined){
        var updatedIndicator=document.getElementById("updatedIndicator");
        document.getElementById("bookmarkToggle").src=pathToImage+"EmptyStar.png";
        updatedIndicator.src=pathToImage+"emptyCircle.png";
        updatedIndicator.style.display="none";
        document.getElementById("elementSelectorButton").style.display="none";
      }
      else{
        setLocalBookmarkInfo(jsonToBookmarkItem(bookmarkData[bookmarkID]));
      }
    });
  });
});