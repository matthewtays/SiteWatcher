function addBookmarkToDisplayExternal(msg){
  if(msg.pageID==currentPageID){
    var newBookmark=jsonToBookmarkItem(msg.bookmark);
    var myNode = document.getElementById("bookmarkGrid");
    var plusNode=document.getElementById("=addBookmark");
    addBookmarkToDisplayInternal(newBookmark,myNode,plusNode);
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
  var bmElements=document.getElementsByClassName(origID);
  if(varExists(bmElements)&&bmElements.length>0){
    if(varExists(msg.destinationPage)&&msg.destinationPage!==currentPageID){
      for(let i=0;i<bmElements.length;++i){
        bmElements[i].parentNode.removeChild(bmElements[i]);
      }
    }
    else{
      let newNodes=bookmark.getHtmlElement(function(){bookmarkStatusListener(bookmark.id);}
                                         ,function(){bookmarkDeleteListener(bookmark.id);}
                                         ,function(){bookmarkEditListener(bookmark);}
                                          );
      for(let i=0;i<newNodes.length;++i){
        for(let j=0;j<bmElements.length;++j){
          if(newNodes[i].classList[0]==bmElements[j].classList[0]){
            document.getElementById("bookmarkGrid").replaceChild(newNodes[i],bmElements[j]); 
            break;
          }
        }
      }    
    }
  }
  else{
    if(msg.destinationPage==currentPageID){
      updateSelectedPage();
    }
  }
}
function removeBookmark(msg){
  var bookmarkID=msg.bmID;
  var bmElements=document.getElementsByClassName(bookmarkID);
  while(bmElements.length > 0){
      bmElements[0].parentNode.removeChild(bmElements[0]);
  }
}
function addBookmarkToDisplayInternal(bookmark,listNode,plusNode){
  let htmlItems=bookmark.getHtmlElement(function(){bookmarkStatusListener(bookmark.id);}
                                         ,function(){bookmarkDeleteListener(bookmark.id);}
                                         ,function(){bookmarkEditListener(bookmark);}
                                          );
  console.assert(htmlItems.length==4);
  for(let i=0;i<htmlItems.length;++i){
    listNode.insertBefore(htmlItems[i],plusNode);
  }
}

function refreshBookmarksHTML(pageBookmarks){
  //clear all child nodes
  var myNode = document.getElementById("bookmarkGrid");
  var plusNode=document.getElementById("=addBookmark");
  for(let i=0;i<myNode.children.length;){
    if(myNode.children[i].tagName===plusNode.tagName&&!myNode.children[i].classList.contains("=addBookmarkSpacer")){
      myNode.removeChild(myNode.children[i]);
    }
    else{
      ++i;
    }
  }
  //insert new bookmarks
  if(pageBookmarks!=null){
    for(let i=0;i<pageBookmarks.length;++i){
      (function(bookmarkID){
        getData(bookmarkID,function(bookmarkData){
          var bookmark=jsonToBookmarkItem(bookmarkData[bookmarkID]);
          addBookmarkToDisplayInternal(bookmark,myNode,plusNode);
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
function confirmEditBookmark(url,name,pageID,storedData){
  var tempBookmark=new bookmarkItem(url,name);
  port.postMessage({'command':"editBookmark",
                    'origID':storedData.orig.id,
                    'bookmark':tempBookmark.jsonVal,
                    'pageIDX':pageID,
                    'origPageIDX':storedData.page
                  });    
}
function bookmarkEditListener(bookmark){
  displayBookmarkManipulationModal("addBookmarkModal",confirmEditBookmark,undefined,bookmark.url,bookmark.name,currentPageID,{'orig':bookmark,'page':currentPageID});
}