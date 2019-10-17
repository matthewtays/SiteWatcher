//chrome.storage.sync.clear();//Use this to clear memory
//Set the default page

var updatedBookmarksDictionary={};
var contextID=undefined;
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
chrome.browserAction.setBadgeBackgroundColor({'color':'#FF0000'});
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
//Some generic setup. This is all designed to initialize key variables, as well as ensure that FIRST TIME RUNNING this works
getData(['pages'],function(data){
  var pages=data.pages;
  if(data.pages===undefined){
    pages=['-default'];
    setData({'pages':pages},function(){//just in case
      
    });
  }
  console.assert(pages!==undefined&&pages.length>0);
  for(var i=0;i<pages.length;++i){
    (function(pageID,pageIDX){
      getData(pageID,function(pageObject){
        if(pageObject[pageID]===undefined){
          var newPage=new pageItem(pageID,pageIDX);
          setData({[pageID]:newPage.jsonVal},function(){// incase we want to react
          
          });
        }
        else{
          var page=jsonToPageItem(pageObject[pageID]);
          for(var j=0;j<page.bm.length;++j){
            (function(bmID){
              getData(bmID,function(bmObject){
                console.assert(bmObject[bmID]!==undefined&&bmObject[bmID]!==null);
                var bookmark=jsonToBookmarkItem(bmObject[bmID]);
                if(!bookmark.isUpToDate){
                  addUpdatedBookmark(bookmark,page);
                }
              });
            })(page.bm[j]);
          }
        }
      });
    })(pages[i],i);
  }
  maintainContextMenu();//Not really dependent on Pages, but meh.
  //May as well initialize here
  addContextMenuListener(contextMenuListener);
});


var portsSet=new Set([]);
addPortListener(function(port) {
  if(port.name=="bookmarkFrontEndPort"){
    portsSet.add(port);
    port.onMessage.addListener(function(msg) {
      switch(msg.command){
        case("addBookMark"):
          addNewBookmark(msg,port);
          break;
        case("editBookmark"):
          editBookmark(msg,port);
          break;
        case("moveBookmark"):
          moveBookmark(msg,port);
          break;
        case("addRule"):
          addBookmarkRule(msg,port);
          break;
        case("deleteRule"):
          deleteRule(msg,port);
          break;
        case("addPage"):
          addNewPage(msg,port);
          break;
        case("deletePage"):
          deletePage(msg,port);
          break;
        case("refreshBookmarks"):
          checkAllPages(port);
          break;
        case("toggleBMStatus"):
          toggleBMStatus(msg,port);
          break;
        case("DeleteBookmark"):
          deleteBookmark(msg,port);
          break;
        case("markAllUpToDate"):
          markAllUpToDate(msg,port);
          break;
        case("openAllUpdated"):
          openAllUpdated(msg,port);
          break;
        case("updateLastUsedPage"):
          updateLastUsedPage(msg,port);
          break;
        case("getUpdatedBookmarkCount"):
          respondUpdatedBookmarkCount(msg,port);
          break;
        case("testURL"):
          testURL(msg,port);
          break;
        case("triggerSelect"):
          triggerSelect(msg,port);
          break;
        default:
          alert("Background received unknown port command:"+msg.command);
      }
    });
    port.onDisconnect.addListener(function(disconnectedPort){
      console.assert(portsSet.delete(port));
      
    });
  }
});
var pageIdx=0;
var bmIdx=0;
addAlarmListener(function(alarm){
  if(alarm.name=="checkPage"){
    getData(['pages'],function(pagesData){
      console.assert(pagesData.pages!==undefined&&pagesData.pages!==null&&pagesData.pages.length>0);
      if(pageIdx>=pagesData.pages.length){
        pageIdx=0;
      }
      var pageID=pagesData.pages[pageIdx];
      getData([pageID],function(pageData){
        console.assert(pageData[pageID]!==undefined&&pageData[pageID]!==null);
        var page=jsonToPageItem(pageData[pageID]);
        var bmID=page.bm[bmIdx];
        if(page.bm.length>bmIdx){
          getData([bmID],function(bmData){
            console.assert(bmData[bmID]!==undefined&&bmData[bmID]!==null);
            var bookmark=jsonToBookmarkItem(bmData[bmID]);
            if(bookmark.isUpToDate){
              checkBookmark(bookmark,page);
            }
          });
        }
        bmIdx+=1;
        if(bmIdx>=page.bm.length){
          bmIdx=0;
          pageIdx+=1;
        }
      });
    });
  }
});
createAlarm("checkPage",{"periodInMinutes":1});
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
function innerAddPage(page,callback){//callback not neccesarily used, but if something is waiting on this
  var pageID=page.id;
  //confirm page does not exist
  getData(pageID,function(pageData){
    if(pageData[pageID]!=null){
      alert("Cannot create duplicate page");
    }
    else{
      //update display
      portsSet.forEach(function(portVal,portValCopy,set){
        portVal.postMessage({'command':'addPageToDisplay',
                             'page':page.jsonVal});
      });
      //page does not exist, add page to the pages list
      getData(['pages'],function(pagesData){
        console.assert(pagesData.pages!==undefined);
        var pages=pagesData.pages;
        pages.push(pageID);
        var newPagesList=[];
        setData({
          [pageID]:page.jsonVal,
          'pages':pages
        },function(){//in case we ever want to react
          if(varExists(callback)){
            callback();
          }
        });
      });
    }
  });
}
function addNewPage(msg,port){
  var page=jsonToPageItem(msg.page);
  innerAddPage(page);
}
function checkAllPages(port){
  getData(['pages'],function(pagesData){
    console.assert(pagesData.pages!==undefined&&pagesData.pages.length>0);
    var pages=pagesData.pages;
    for(var i=0;i<pages.length;++i){
      (function(pageID){
        getData([pageID],function (pageData){
          console.assert(pageData[pageID]!==undefined&&pageData[pageID]!==null);
          var page=jsonToPageItem(pageData[pageID]);
          checkPage(page);
        });
      })(pages[i]);
    }
  });
}
function checkPage(page){
  for(var j=0;j<page.bm.length;++j){
    (function(bmID){
      getData([bmID],function(bmData){
        console.assert(bmData[bmID]!==undefined&&bmData[bmID]!==null);
        var bookmark=jsonToBookmarkItem(bmData[bmID]);
        checkBookmark(bookmark,page);
      });
    })(page.bm[j]);
  }
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
function addBookmarkRule(msg,port){//reserved for NON SAVED
  var newRule=jsonToRuleItem(msg.rule);
  var newRuleID=newRule.id;
  bookmarkID=bookmarkItem.urlToID(newRule.name);
  getData([bookmarkID],function(bookmarkData){
    if(varExists(bookmarkData[bookmarkID])){
      getData([newRuleID],function(ruleData){
        let ruleArray=ruleData[newRuleID];
        if(ruleArray===undefined||ruleArray===null){
          ruleArray=[];
        }
        ruleArray.push(newRule.jsonVal);
        setData({[newRuleID]:ruleArray},function(){
          portsSet.forEach(function(portVal,portValCopy,set){
            portVal.postMessage({'command':'updateBookmarkRules','bookmark':bookmarkData[bookmarkID]});
          });
        });
      });
    }
  });
}
function deleteRule(msg,port){//Again, for non-saved
  var ruleIndex=msg.idx;
  var ruleID=msg.ruleID;
  var bookmarkID=msg.bookmarkID;
  getData([bookmarkID],function(bookmarkData){
    console.assert(varExists(bookmarkData[bookmarkID]));
    getData([ruleID],function(ruleData){
      let ruleArray=ruleData[ruleID];
      console.assert(varExists(ruleArray)&&ruleArray.length>ruleIndex);
      ruleArray.splice(ruleIndex, 1);
      setData({[ruleID]:ruleArray},function(){
        portsSet.forEach(function(portVal,portValCopy,set){
          portVal.postMessage({'command':'updateBookmarkRules','bookmark':bookmarkData[bookmarkID]});
        });
      });
    });
  });
}
function deletePage(msg,port){
  var pageID=msg.pageID;//Up for debate using page ID or index, but for now ID (its a simple conversion)
  getData([pageID],function(data){
    console.assert(varExists(data[pageID]));
    let tempPage=jsonToPageItem(data[pageID]);
    let bookmarkIDList=tempPage.bm;
    for(let i=0;i<bookmarkIDList.length;++i){
      innerDeleteBookmark(bookmarkIDList[i]);
    }
    removeData([pageID],function(data){//Remove page
      if(typeof data===REMOVEERRORSTRING){
        alert("Error deleting:"+tempPage.id+"--"+data.message);
      }
      else{
        
      }
    });
    getData(['pages'],function(pagesData){
      let pagesTemp=pagesData.pages;
      for(let i=0;i<pagesTemp.length;++i){//Remove page from references
        if(pagesTemp[i]==pageID){
          pagesTemp.splice(i,1);
          setData({'pages':pagesTemp},function(){
            if(pagesTemp.length==0){
              let tempDefaultPage=new pageItem('default',0);
              innerAddPage(tempDefaultPage,function(){
                portsSet.forEach(function(portVal,portValCopy,set){
                  portVal.postMessage({'command':'updatePages'});
                });
              });
            }
            else{
              portsSet.forEach(function(portVal,portValCopy,set){
                portVal.postMessage({'command':'updatePages'});
              });              
            }
          });
          return;
        }
      }
    });
  });
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

function stripScripts(s) {
  var div = document.createElement('div');
  div.innerHTML = s;
  var scripts = div.getElementsByTagName('script');
  var i = scripts.length;
  while (i--) {
    scripts[i].parentNode.removeChild(scripts[i]);
  }
  return div.innerHTML;
}
function testURLCallback(htmlstring,port){
  var strippedHTML=stripScripts(htmlstring);
  if(strippedHTML==""){
    strippedHTML = "Nothing was found";
  }
  port.postMessage({'command':'testURLResponse','html':strippedHTML});
}
function testURL(msg,port){
  var tempBookmark=new bookmarkItem(msg.url,"testingBookmark");
  tempBookmark.checkSite(undefined,function(htmlstring){
    testURLCallback(htmlstring,port);
  });
}
function triggerSelect(msg,port){
  portsSet.forEach(function(portVal,portValCopy,set){
    portVal.postMessage({'command':'beginElementSelect','url':msg.url});
  });
}
const contextsForMenu=["page","frame","link","editable","image","video","audio"];
function maintainContextMenu(){
  getData(null,function(data){
    var listOfBookmarkURLs=[];
    const keys=Object.keys(data);
    for (const key of keys){
      if(bookmarkItem.isBookmarkID(key)){
        listOfBookmarkURLs.push(bookmarkItem.idToURL(key));
      }
    }
    if(contextID==undefined){
      contextID="siteWatcherElementSelector";
      removeAllContextMenus(function(){
        addContextMenu({"id":contextID,"title":"Select Element","contexts":contextsForMenu,"documentUrlPatterns":listOfBookmarkURLs});
      });
    }
    else{
      updateContextMenu(contextID,{"title":"Select Element","contexts":contextsForMenu,"documentUrlPatterns":listOfBookmarkURLs});
    }
  });
}
function contextMenuListener(info,tab){
  if(contextID!==undefined&&info.menuItemId==contextID){
    sendMessageToTab(tab,{"command":"contextMenuSelected","selectedObj":info});
  }
}
//How data is stored:
//pages : An array of strings, keys to pages.
//lup : the last used page. Used for initializing defaults. IF the last used page is non existant, use index 0
//-{page name} : an array of names to bookmarks. Always starts with a -
//_{bookmark name} : actual bookmark and its info
//Store HTML compares as md5 hashes
//













function testing(){
  var attList=["value"];
  var a={"value":0};
  var b={"value":1};
  var c={"value":2};
  console.log("Testing: 0<1"+lessThan(a,b,attList,false));
  console.log("Testing: 1<2"+lessThan(b,c,attList,false));
  console.log("Testing: 0<2"+lessThan(a,c,attList,false));
  console.log("Testing: 1<0"+lessThan(b,a,attList,false));
  console.log("Testing: 2<1"+lessThan(c,b,attList,false));
  console.log("Testing: 2<0"+lessThan(c,a,attList,false));
  
  console.log("Testing: 0<=1"+lessThan(a,b,attList,true));
  console.log("Testing: 1<=2"+lessThan(b,c,attList,true));
  console.log("Testing: 0<=2"+lessThan(a,c,attList,true));
  console.log("Testing: 1<=0"+lessThan(b,a,attList,true));
  console.log("Testing: 2<=1"+lessThan(c,b,attList,true));
  console.log("Testing: 2<=0"+lessThan(c,a,attList,true));
  
  console.log("testing: 0<=0"+lessThan(a,a,attList,true));
}
//testing();