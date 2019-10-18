function addAlarmListener(callback){
  chrome.alarms.onAlarm.addListener(callback);
}
function addContextMenu(options,callback){
  chrome.contextMenus.create(options,callback);
}
function addContextMenuListener(callback){
  chrome.contextMenus.onClicked.addListener(callback)
}
function addMessageListener(callback){
  chrome.runtime.onMessage.addListener(callback);
}
function addPortListener(callback){
  chrome.runtime.onConnect.addListener(callback);
}
function createAlarm(name,dataObject){
  chrome.alarms.create(name,dataObject);
}
function createTab(options,callback){
  chrome.tabs.create(options,callback);
}
function getActiveTab(callback){
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, callback);
}
function getData(nameObject,callback){//passing null gets ALL keys
  chrome.storage.sync.get(nameObject,callback);
}
function removeAllContextMenus(callback){//only for this extension
  chrome.contextMenus.removeAll(callback);
}
function removeData(nameObject,callback){
  chrome.storage.sync.remove(nameObject,callback);
}
function setData(nameObject,callback){
  chrome.storage.sync.set(nameObject,callback);
}
function sendPortMessage(msg,port){
  
}
function sendMessageToTab(tab,message,responseCallback){
  chrome.tabs.sendMessage(tab.id, message, responseCallback);
}
function updateContextMenu(options,callback){
  chrome.contextMenus.update(options,callback);
}

var REMOVEERRORSTRING='chrome.runtime.lastError';