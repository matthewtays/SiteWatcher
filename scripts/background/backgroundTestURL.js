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