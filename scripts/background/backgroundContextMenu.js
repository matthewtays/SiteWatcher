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