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