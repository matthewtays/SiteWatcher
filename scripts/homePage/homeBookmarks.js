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
function addNewBookmark(url,name,pageID){
  var newBookmark=new bookmarkItem(url,name);
  port.postMessage({'command':"addBookMark",
                    'pageID':pageID,
                    'bookmark':newBookmark.jsonVal
                    });

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
function addBookmarkToDisplayInternal(bookmark,listNode){
  listNode.append(bookmark.getHtmlElement(function(){bookmarkStatusListener(bookmark.id);}
                                         ,function(){bookmarkDeleteListener(bookmark.id);}
                                         ,function(){bookmarkEditListener(bookmark);}
                                          ));
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