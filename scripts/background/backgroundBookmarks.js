//Requires
//msg.id = id of new bookmark
//msg.pageID = id of page
//Adds the bookmark id to the page list in memory, and sets the bookmark in memory, and tells content to display it
function addNewBookmark(msg,port){
  //Confirm bookmark does not exist;
  var bookmark=jsonToBookmarkItem(msg.bookmark);
  var bookmarkID=bookmark.id;
  getData(bookmarkID,function(bookmarkData){
    if(bookmarkData[bookmarkID]!==undefined){
      alert("cannot create duplicate URL");
    }
    else{
      //Bookmark does not exist, get and update the stored page
      getData(['pages'],function(pagesData){
        console.assert(pagesData.pages!==undefined&&pagesData.pages.length>0);
        var pages=pagesData.pages;
        console.assert(pages!=null);
        console.assert(pages.length>0);
        var pageName=pages[msg.pageID];
        getData(pageName,function(pageData){
          console.assert(pageData[pageName]!==undefined);
          var page=jsonToPageItem(pageData[pageName]);
          page.addBookmark(bookmarkID);
          bookmark.checkSite(function(){
            //Update display
            portsSet.forEach(function(portVal,portValCopy,set){
              portVal.postMessage({'command':'addBookmarkToDisplay',
                  'bookmark':bookmark.jsonVal,
                  'pageID':msg.pageID
                  });
            });
            setData({
              [pageName]: page.jsonVal,
              [bookmarkID]:bookmark.jsonVal
            },function(){
              maintainContextMenu();
            });
            if(!bookmark.isUpToDate){
              addUpdatedBookmark(bookmark,page);
            }
          });
        });
      });
    }
  });
}
function editBookmark(msg,port){
  var origID=msg.origID;
  var newBookmark=jsonToBookmarkItem(msg.bookmark);
  var newPageIDX=msg.pageIDX;
  var origPageIDX=msg.origPageIDX;
  if(origID!==newBookmark.id||newPageIDX!==origPageIDX){
    getData(['pages'],function(pagesData){
      console.assert(pagesData.pages.length>origPageIDX);
      var pageID=pagesData.pages[origPageIDX];
      getData([pageID],function(pageData){
        var pageTemp=jsonToPageItem(pageData[pageID]);
        pageTemp.removeBookmark(origID);
        if(newPageIDX==origPageIDX){
          pageTemp.addBookMark(newBookmark.id);
        }
        setData({[pageID]:pageTemp.jsonVal},function(){
          
        });
      });
      if(newPageIDX!==origPageIDX){
        console.assert(pagesData.pages.length>newPageIDX);
        var newPageID=pagesData.pages[newPageIDX];
        getData([newPageID],function(pageData){
          var pageTemp2=jsonToPageItem(pageData[newPageID]);
          pageTemp2.addBookmark(newBookmark.id);
          setData({[newPageID]:pageTemp2.jsonVal},function(data){
            if(typeof data===REMOVEERRORSTRING){
              alert("Error editing:"+data.message);
            }
          });
        });
      }
    });
  }
  getData([origID],function (origData){
    console.assert(origData[origID]!==null&&origData[origID]!==undefined);
    var tempBookmark=jsonToBookmarkItem(origData[origID]);
    newBookmark.matchState(tempBookmark);
    setData({[newBookmark.id]:newBookmark.jsonVal},function(){
      portsSet.forEach(function(portVal,portValCopy,set){
        portVal.postMessage({'command':'updateBookmark',
                            'bookmark':newBookmark.jsonVal,
                            'origID':origID,
                            'destinationPage':newPageIDX
        });
      });
      maintainContextMenu();
    });
    if(origID!==newBookmark.id){
      removeData([origID], function(data){
        if(typeof data===REMOVEERRORSTRING){
          alert("Error deleting:"+origID+"--"+data.message);
        }
      });
    }
  });
}
function moveBookmark(msg,port){
  var origPageIdx=msg.origPageIdx;
  var newPageIdx=msg.newPageIdx;
  var bookmarkID=msg.bmID;
  console.assert(origPageIdx!==undefined&&newPageIdx!==undefined&&bookmarkID!==undefined);
  if(origPageIdx===newPageIdx){
    return;
  }
  getData(['pages'],function(pagesData){
    var pages=pagesData.pages;
    console.assert(newPageIdx<pages.length&&origPageIdx<pages.length);
    var origPageID=pages[origPageIdx];
    var newPageID=pages[newPageIdx];
    getData({origPageID,newPageID},function(pageData){
      var origPage=jsonToPageItem(pageData.origPageID);
      var newPage=jsonToPageItem(pageData.newPageID);
      origPage.removeBookmark(bookmarkID);
      newPage.addBookMark(bookmarkID);
      setData({[origPageID]:origPage.jsonVal,[newPageID]:newPage.jsonVal},function(){
        //Just in case
      });
    });
  });
}
function checkBookmark(bookmark,page){
  bookmark.checkSite(function(updatedBM){
    processIfUpdated(updatedBM,page);
    setData({
      [updatedBM.id]:updatedBM.jsonVal
    },function(){
      portsSet.forEach(function(portVal,portValCopy,set){
        portVal.postMessage({'command':'updateBookmark',
                            'bookmark':updatedBM.jsonVal,
        });
      });
    });
  });
}
function toggleBMStatus(msg,port){
  var bookmarkID=msg.bmID;
  getData([bookmarkID],function(bookmarkData){
    console.assert(bookmarkData[bookmarkID]!==undefined&&bookmarkData[bookmarkID]!==null);
    var bookmark=jsonToBookmarkItem(bookmarkData[bookmarkID]);
    bookmark.toggleStatus();
    processIfUpdated(bookmark);
    setData({[bookmarkID]:bookmark.jsonVal},function(){
      portsSet.forEach(function(portVal,portValCopy,set){
        portVal.postMessage({'command':'updateBookmark','bookmark':bookmark.jsonVal});
      });
    });
  });
}
function innerDeleteBookmark(bookmarkID){
  removeUpdatedBookmark(bookmarkItem.idToURL(bookmarkID));
  getData([bookmarkID],function (bookmarkData){
    if(varExists(bookmarkData[bookmarkID])){
      let tempBookmark=jsonToBookmarkItem(bookmarkData[bookmarkID]);
      let ruleID=tempBookmark.ruleID;
      if(ruleID==bookmarkRulesItem.URLToID(tempBookmark.url)){
        removeData([ruleID],function(data){
          if(typeof data===REMOVEERRORSTRING){
            alert("error deleting:"+bookmarkID+"'s Rules--"+data.message);
          }
        });
      }
    }
    removeData([bookmarkID],function(data){
      if(typeof data===REMOVEERRORSTRING){
        alert("Error deleting:"+bookmarkID+"--"+data.message);
      }
      else{
        getData(['pages'],function(pagesData){
          console.assert(pagesData.pages!==undefined);//Even if pages is empty, it just means we cant find it to remove from a page
          var pages=pagesData.pages;
          for(var i=0;i<pages.length;++i){
            (function(pageID){
              getData([pageID],function (pageData){
                console.assert(pageData[pageID]!==undefined&&pageData[pageID]!==null);
                var page=jsonToPageItem(pageData[pageID]);
                for(var j=0;j<page.bm.length;++j){
                  if(page.bm[j]===bookmarkID){
                    page.bm.splice(j, 1);
                    setData({[pageID]:page.jsonVal},function(){
                      //Take on good faith that it was found somewhere... cant think of a better solution off the top of my head. Besides, if the page was deleted this works
                      portsSet.forEach(function(portVal,portValCopy,set){
                        portVal.postMessage({'command':'removeBookmark','bmID':bookmarkID});
                      });
                      maintainContextMenu();
                    });
                    
                    break;//Ideally would break out of all pages but, since this is kinda async, it can't be helped
                  }
                }
              });
            })(pages[i]);
          }
        });
      }
    });
  });
}
function deleteBookmark(msg,port){
  var bookmarkID=msg.bmID;
  innerDeleteBookmark(bookmarkID);
}