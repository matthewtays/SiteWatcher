//chrome.storage.sync.clear();//Use this to clear memory
//Set the default page

var updatedBookmarksDictionary={};
var contextID=undefined;
var pageIdx=0;
var bmIdx=0;
var portsSet=new Set([]);
chrome.browserAction.setBadgeBackgroundColor({'color':'#FF0000'});
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
  //default lup
  getData(['lup'],function(lupData){
    if(!varExists(lupData.lup)){
      setData({'lup':pages[0]},function(){
        
      });
    }
  });
  maintainContextMenu();//Not really dependent on Pages, but meh.
  //May as well initialize here
  addContextMenuListener(contextMenuListener);
});
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
        case("editPage"):
          editPage(msg,port);
          break;
        case("refreshBookmarks"):
          checkPages(msg,port);
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
        case("collectScraps"):
          collectScraps(msg,port);
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


//Searches json and collects any unlinked elements
function collectScraps(msg,port){
  getData(null, function(items) {
    var allKeys = Object.keys(items);
    var tempPages=items.pages;
    //Delete any hangers on?
    //First collect page elements
    for(let i=0;i<allKeys.length;++i){
      if(pageItem.isValidID(allKeys[i])){
        let isContained=false;
        for(let j=0;j<tempPages.length;++j){
          if(tempPages[j]==allKeys[i]){
            isContained=true;
            break;
          }
        }
        if(!isContained){
          let tempPage=jsonToPageItem(items[allKeys[i]]);
          tempPage.idx=tempPages.length;
          setData({[allKeys[i]]:tempPage.jsonVal},function(){
            
          });
          tempPages.push(allKeys[i]);
        }
      }
    }
    //Then with added on pages, collect bookmarks
    let firstPage=jsonToPageItem(items[allKeys[tempPages[0]]]);
    let bookmarkList=[];
    for(let i=0;i<allKeys.length;++i){
      if(bookmarkItem.isBookmarkID(allKeys[i])){
        bookmarkList.push(allKeys[i]);
        let isContained=false;
        for(let j=0;j<tempPages.length;++j){
          let tempPage=jsonToPageItem(items[allKeys[tempPages[j]]]);
          for(let k=0;k<tempPage.bm.length;++k){
            if(tempPage.bm[k]==allKeys[i]){
              isContained=true;
              break;
            }
          }
          if(isContained){
            break;
          }
        }
        if(!isContained){
          firstPage.bm.add(allKeys[i]);
        }
      }
    }
    //then with added on bookmarks, collect rules
    for(let i=0;i<allKeys.length;++i){
      if(bookmarkRulesItem.isID(allKeys[i])){
        let bookmarkID=bookmarkItem.urlToID(bookmarkRulesItem.IDToURL(allKeys[i]));
        let found=false;
        for(let j=0;j<bookmarkList.length;++j){
          if(bookmarkList[j]==bookmarkID){
            found=true;
            break;
          }
        }
        if(!found){
          removeData([allKeys[i]],function(){
            
          });
        }
      }
    }
    //Then push tempPages,firstPage
    setData({'pages':tempPages},function(){
      
    });
    setData({[tempPages[0]]:firstPage.jsonVal},function(){
      
    });
  });
  
}
//Extras!

//How data is stored:
//pages : An array of strings, keys to pages.
//lup : the last used page. Used for initializing defaults.
//-{page name} : an array of names to bookmarks. Always starts with a -
//_{bookmark name} : actual bookmark and its info
//+{rule name} is rules
//=(id) is for misc id items in html like buttons
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