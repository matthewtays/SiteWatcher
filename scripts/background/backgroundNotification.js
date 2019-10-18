function addUpdatedBookmark(bookmark,page){//If not specified, search and find the parent page
  
  var pageID="";
  if(page===undefined||page===null){
    getData(['pages'],function(pagesData){
      var pages=pagesData.pages;
      console.assert(pages!==undefined&&pages.length>0);
      for(var i=0;i<pages.length;++i){
        (function(pageID){
          getData([pageID],function(pageData){
            console.assert(pageData[pageID]!==undefined&&pageData[pageID]!==null);
            var page=jsonToPageItem(pageData[pageID]);
            for(var j=0;j<page.bm.length;++j){
              if(page.bm[j]==bookmark.id){
                if(updatedBookmarksDictionary[pageID]===undefined||updatedBookmarksDictionary[pageID]===null){
                  updatedBookmarksDictionary[pageID]=new Set([]);
                }
                updatedBookmarksDictionary[pageID].add(bookmark.url);
                updateBadge();
                break;
              }
            }
          });
        })(pages[i]);	
      }
    });
  }
  else{
    pageID=page.id;
    if(updatedBookmarksDictionary[pageID]===undefined||updatedBookmarksDictionary[pageID]===null){
      updatedBookmarksDictionary[pageID]=new Set([]);
    }
    updatedBookmarksDictionary[pageID].add(bookmark.url);
    updateBadge();
  }
}
function removeUpdatedBookmark(bookmark,page){//If page not specified, search
  var url=bookmark.url;
  if(url===undefined){
    url=bookmark;
  }
  if(page!==undefined&&page!==null&&updatedBookmarksDictionary[page.id]!==undefined&&updatedBookmarksDictionary[page.id]!==null){
    updatedBookmarksDictionary[page.id].delete(url);
  }
  else{
    for (var key in updatedBookmarksDictionary){
      updatedBookmarksDictionary[key].delete(url);
    }
  }
  updateBadge();
}
function getUpdatedBookmarkCount(){
  var result=0;
  for (var key in updatedBookmarksDictionary){
    result+=updatedBookmarksDictionary[key].size;
  }
  return result;
}
function updateBadge(){
  var count=getUpdatedBookmarkCount();
  if(count<=0){
    chrome.browserAction.setBadgeText({'text':''});
  }
  else{
    chrome.browserAction.setBadgeText({'text':count.toString()});
  }
}
function respondUpdatedBookmarkCount(msg,port){//Probably don't actually use this lol
  var count=getUpdatedBookmarkCount();
  port.postMessage({'command':'updatedBookmarkCount',
                  'count':count
                  });
}
function isUpdated(url){
  for (var key in updatedBookmarksDictionary){
    if(updatedBookmarksDictionary[key].has(url)){
      return true;
    }
  }
  return false;
}
function processIfUpdated(bookmark,page){
  if(bookmark.isUpToDate){
    removeUpdatedBookmark(bookmark,page);
    }
  else{
    addUpdatedBookmark(bookmark,page);
  }
}
function forAllUpdated(callback,page){//If page is null, or undefined, do all pages
  if(page!==undefined&&page!==null){
    if(updatedBookmarksDictionary[page.id]!==undefined&&updatedBookmarksDictionary[page.id]!==null){
      updatedBookmarksDictionary[page.id].forEach(callback);
    }
  }
  else{
    for (var key in updatedBookmarksDictionary){
      updatedBookmarksDictionary[key].forEach(callback);
    }
  }
  updateBadge();
}
function openTabsCallback(url1,url2,set){
  createTab({ url: url1, active: false });
}

function openAllUpdated(msg,port){
  if(msg.pageID!==undefined){
    getData(['pages'],function(pagesData){
      if(pagesData.pages.length>msg.pageID){
        var pageID=pagesData.pages[msg.pageID];
        getData([pageID],function(pageData){
          var localPage=jsonToPageItem(pageData[pageID]);
          forAllUpdated(openTabsCallback,localPage);
        });
      }
    });
  }
  else{
    forAllUpdated(openTabsCallback);
  }
}
function markUpdatedCallback(url1,url2,set){
  var bmID=bookmarkItem.urlToID(url1);
  getData([bmID],function(bmData){
    var bookmark=jsonToBookmarkItem(bmData[bmID]);
    if(!bookmark.isUpToDate){
      bookmark.toggleStatus();
      setData({[bmID]:bookmark.jsonVal},function(){
        portsSet.forEach(function(portVal,portValCopy,set){
          portVal.postMessage({'command':'updateBookmark','bookmark':bookmark.jsonVal});
        });
      });//just in case
      removeUpdatedBookmark(bookmark);
    }
  });
}
function markAllUpToDate(msg,port){
  if(msg.pageID!==undefined){
    getData(['pages'],function(pagesData){
      if(pagesData.pages.length>msg.pageID){
        var pageID=pagesData.pages[msg.pageID];
        getData([pageID],function(pageData){
          var localPage=jsonToPageItem(pageData[pageID]);
          forAllUpdated(markUpdatedCallback,localPage);
        });
      }
    });
  }
  else{
    forAllUpdated(markUpdatedCallback);
  }
}

function updateLastUsedPage(msg,port){
  setData({"lup":msg.pageIDX},function(){
    //In case we want to respond.
  });
}