
var activeModal=undefined;
var clickedElement = undefined;
var selectState={"include":false,"prospectiveRule":null,"selectedObj":null};
var elementSelectorLocalBookmark=undefined;
var elementSelectorLocalRules=undefined;
function initializeElementSelector() {
  //variables
  port = chrome.runtime.connect({name: "bookmarkFrontEndPort"});
  port.onMessage.addListener(function(msg) {
    switch(msg.command){
      case("addBookmarkToDisplay"):
        break;
      case("addPageToDisplay"):
        break;
      case("updatePages"):
        break;
      case("updateBookmark"):
        break;
      case("removeBookmark"):
        break;
      case("testURLResponse"):
        break;
      case("beginElementSelect"):
        beginElementSelect(msg,port);
        break;
      case("updateBookmarkRules"):
        updateBookmarkRulesListener(msg,port);
        break;
      case("updateSavedRule"):
        updateSavedRuleListener(msg,port);
        break;
      default:
        alert("content received unknown command:"+msg.command);
    }
  });
  addMessageListener(function(msg,sender,sendResponse){
    switch(msg.command){
      case("contextMenuSelected"):
        handleContextMenuSelected(msg);
        break;
      default:
        break;//Can't check for rogue messages because who knows who is sending
    }
  });
  document.addEventListener("contextmenu", function(event){
    //right click
    clickedElement = event.target;
  }, true);
}
function updateBookmarkRulesListener(msg,port){
  var bookmark=jsonToBookmarkItem(msg.bookmark);
  if(bookmark.url==window.location.toString()){
    updateElementSelectorLocalBookmark(bookmark);
  }
}
function updateSavedRuleListener(msg,port){
  let localBookmarkID=bookmarkItem.urlToID(window.location.toString());
  getData([localBookmarkID],function(bookmarkData){
    if(varExists(bookmarkData[localBookmarkID])){
      let localBookmark=jsonToBookmarkItem(bookmarkData[localBookmarkID]);
      if(localBookmark.ruleID==msg.ruleID){
        updateElementSelectorLocalBookmark(localBookmark);
      }
    }
  });
}
function clearHighlightedNodes(){
  let prevIncludeNodes=document.getElementsByClassName("SiteWatcherElementSelectorOverlayIncluded");
  let prevExcludeNodes=document.getElementsByClassName("SiteWatcherElementSelectorOverlayExcluded");
  while(prevIncludeNodes.length>0){
    prevIncludeNodes[0].classList.remove("SiteWatcherElementSelectorOverlayIncluded");
  }
  while(prevExcludeNodes.length>0){
    prevExcludeNodes[0].classList.remove("SiteWatcherElementSelectorOverlayExcluded");
  }
}
function addClassToElement(node,className){
  if(!varExists(node)){
    return;
  }
  if(node.id=="__SiteWatcherSelectionModal"){
    return;//Don't continue down this branch
  }
  node.classList.add(className);
  for(let i=0;i<node.children.length;++i){
    addClassToElement(node.children[i],className);
  }
}
function updateElementSelectorLocalBookmark(bookmark){
  if(varExists(activeModal)){
    elementSelectorLocalBookmark=bookmark;
    if(varExists(elementSelectorLocalBookmark)){
      let ruleID=elementSelectorLocalBookmark.ruleID;
      getData([ruleID],function(ruleData){
        if(varExists(ruleData[ruleID])){
          clearHighlightedNodes();
          elementSelectorLocalRules=ruleData[ruleID];
          let rulesDisplayList=document.getElementById("SiteWatcherElementSelectorRulesList");
          if(varExists(rulesDisplayList)){
            while (rulesDisplayList.firstChild) {
              rulesDisplayList.removeChild(rulesDisplayList.firstChild);
            }
          }
          for(let i=0;i<elementSelectorLocalRules.length;++i){
            let tempRule=jsonToRuleItem(elementSelectorLocalRules[i]);
            if(varExists(rulesDisplayList)){
              let tempID="ElementSelectorModalRule:"+i;
              rulesDisplayList.appendChild(tempRule.getHtmlElement(function(){handleRuleDelete(tempID,i);},function(){handleRuleSelect(tempID,i);},tempID))
            }
            let tempRuleNodes=tempRule.locateOnDoc(document);
            for(let j=0;j<tempRuleNodes.length;++j){
              if(tempRule.inc){
                addClassToElement(tempRuleNodes[j],"SiteWatcherElementSelectorOverlayIncluded");
              }
              else{
                addClassToElement(tempRuleNodes[j],"SiteWatcherElementSelectorOverlayExcluded");
              }
            }
          }
        }
      });
    }
  }
}
function beginElementSelect(msg,port){
  if(msg.url==window.location.toString()){
    createModal();
  }
}
function createModal(){
  //require it to have the localBookmark
  let localBookmarkID=bookmarkItem.urlToID(window.location.toString());
  getData([localBookmarkID],function(bookmarkData){
    if(varExists(bookmarkData[localBookmarkID])){
      fetch(chrome.extension.getURL('../html/elementSelectorModal.html'))
        .then(response => response.text())
        .then(data => {
          document.body.innerHTML += data;
          document.getElementById("SiteWatcherElementSelectorModalSelectRootButton").addEventListener("click",selectRoot);
          document.getElementById("SiteWatcherElementSelectorModalUpTreeButton").addEventListener("click",upTree);
          document.getElementById("SiteWatcherElementSelectorModalDownTreeButton").addEventListener("click",downTree);
          document.getElementById("SiteWatcherElementSelectorModalOverTreeButton").addEventListener("click",nextSib);
          document.getElementById("SiteWatcherElementSelectorModalBackTreeButton").addEventListener("click",prevSib);
          document.getElementById("SiteWatcherElementSelectorModalAcceptButton").addEventListener("click",acceptRule);
          document.getElementById("SiteWatcherElementSelectorModalCloseButton").addEventListener("click",closeModal);
          document.getElementById("SiteWatcherElementSelectorNicknameInputField").value="";
          let radioInclude=document.getElementById("siteWatcherIncludeRadioInclude");
          radioInclude.addEventListener("change",function(){includeRadioListener(true,radioInclude);});
          let radioExclude=document.getElementById("siteWatcherIncludeRadioExclude");
          radioExclude.addEventListener("change",function(){includeRadioListener(false,radioExclude);});
          activeModal=document.getElementById("__SiteWatcherSelectionModal");
          if(selectState.include){
            document.getElementById("siteWatcherIncludeRadioInclude").checked=true;
          }
          else{
            document.getElementById("siteWatcherIncludeRadioExclude").checked=true;
          }
          let localBookmark=jsonToBookmarkItem(bookmarkData[localBookmarkID]);
          updateElementSelectorLocalBookmark(localBookmark);
        }).catch(err => {
          console.log("something went wrong creating the element selector modal");
            // handle error
        });
    }
  });
}
function acceptRule(){
  if(varExists(selectState.prospectiveRule)){
    selectState.prospectiveRule.nickname=document.getElementById("SiteWatcherElementSelectorNicknameInputField").value
    selectState.prospectiveRule.inc=selectState.include;
    port.postMessage({'command':"addRule",
                      'rule':selectState.prospectiveRule.jsonVal
                      });
  }
  else{
    console.log("No rule in existance, can't accept");
  }
  cleanUpModal();
}
function cleanUpModal(){
  switchSelected(undefined);
  selectState={"include":false,"prospectiveRule":null,"selectedObj":null};
  clearHighlightedNodes();
}
function closeModal(){
  document.body.removeChild(activeModal);
  activeModal=undefined;
  cleanUpModal();
}
function setErrorText(textVal){
  var textNode=document.getElementById("SiteWatcherElementSelectorModalErrorText");
  if(varExists(textNode)){
    textNode.innerHTML=textVal;
  }
}
function switchSelected(newNodeObject,prospectiveRule){
  let prevSelectedNodes=document.getElementsByClassName("SiteWatcherElementSelectorOverlaySelected");
  let prevProspectiveNodes=document.getElementsByClassName("SiteWatcherElementSelectorOverlayProspective");
  while(prevSelectedNodes.length>0){
    prevSelectedNodes[0].classList.remove("SiteWatcherElementSelectorOverlaySelected");
  }
  while(prevProspectiveNodes.length>0){
    prevProspectiveNodes[0].classList.remove("SiteWatcherElementSelectorOverlayProspective");
  }
  if(varExists(newNodeObject)){
    if(varExists(newNodeObject.selected)){
      addClassToElement(newNodeObject.selected,"SiteWatcherElementSelectorOverlaySelected");
    }
    if(varExists(newNodeObject.prospectives)){
      for(let i=0;i<newNodeObject.prospectives.length;++i){
        addClassToElement(newNodeObject.prospectives[i],"SiteWatcherElementSelectorOverlayProspective");
      }
    }
  }
  selectState.selectedObj=newNodeObject;
  selectState.prospectiveRule=prospectiveRule;
}
function generatedSelectedObject(node,rule){//Generates primary node and prospective nodes from a selected node
  var selectedObject={"selected":node,"prospectives":rule.locateOnDoc(document)};
  return selectedObject;
}
function isLegalNode(node){
  return varExists(node)&&node!==document&&node!=document.body.parentNode;
}
function includeRadioListener(isInclude,radioInclude){
  if(isInclude){
    selectState.include=radioInclude.checked;
  }
  else{
    selectState.include=!radioInclude.checked;
  }
}
function upTree(){
  if(varExists(selectState)&&varExists(selectState.selectedObj)&&varExists(activeModal)){
    var upNode=selectState.selectedObj.selected.parentNode;
    console.log("nextNode="+upNode);
    if(!isLegalNode(upNode)){
      setErrorText("Cannot go up the tree from this node");
      console.log("can't go up");
    }
    else{
      setErrorText("");
      let prospectiveRule=new bookmarkRulesItem(window.location.toString(),undefined,selectState.include);
      prospectiveRule.setupFromNode(upNode);
      var newSelected=generatedSelectedObject(upNode,prospectiveRule);
      switchSelected(newSelected,prospectiveRule);
    }
  }
}
function downTree(){
  if(varExists(selectState)&&varExists(selectState.selectedObj)&&varExists(activeModal)){
    var downNode=selectState.selectedObj.selected.firstElementChild;
    if(!varExists(downNode)||downNode==document){
      setErrorText("Cannot go down the tree from this node");
    }
    else{
      setErrorText("");
      let prospectiveRule=new bookmarkRulesItem(window.location.toString(),undefined,selectState.include);
      prospectiveRule.setupFromNode(downNode);
      var newSelected=generatedSelectedObject(downNode,prospectiveRule);
      switchSelected(newSelected,prospectiveRule);
    }
  }
}
function prevSib(){
  if(varExists(selectState)&&varExists(selectState.selectedObj)&&varExists(activeModal)){
    var prevNode=selectState.selectedObj.selected.previousElementSibling;
    if(!varExists(prevNode)||prevNode==document){
      setErrorText("Cannot go to previous sibling from this node (might not exist)");
    }
    else{
      setErrorText("");
      let prospectiveRule=new bookmarkRulesItem(window.location.toString(),undefined,selectState.include);
      prospectiveRule.setupFromNode(prevNode);
      var newSelected=generatedSelectedObject(prevNode,prospectiveRule);
      switchSelected(newSelected,prospectiveRule);
    }
  }
}
function nextSib(){
  if(varExists(selectState)&&varExists(selectState.selectedObj)&&varExists(activeModal)){
    var nextNode=selectState.selectedObj.selected.nextElementSibling;
    if(!varExists(nextNode)||nextNode==document){
      setErrorText("Cannot go to next sibling (might not exist)");
    }
    else{
      setErrorText("");
      let prospectiveRule=new bookmarkRulesItem(window.location.toString(),undefined,selectState.include);
      prospectiveRule.setupFromNode(nextNode);
      var newSelected=generatedSelectedObject(nextNode,prospectiveRule);
      switchSelected(newSelected,prospectiveRule);
    }
  }
}
function handleContextMenuSelected(msg){
  //var selectionObject=msg.selectedObj;
  if(clickedElement!==undefined){
    let prospectiveRule=new bookmarkRulesItem(window.location.toString(),undefined,selectState.include);
    prospectiveRule.setupFromNode(clickedElement);
    var newSelected=generatedSelectedObject(clickedElement,prospectiveRule);
    switchSelected(newSelected,prospectiveRule);
    if(activeModal==undefined){
      createModal();
    }
  }
  else{
    console.log("Clicked element is undefined");
  }
}

function selectRoot(){
  console.log("root selected");
  let prospectiveRule=new bookmarkRulesItem(window.location.toString(),undefined,selectState.include);
  prospectiveRule.setupFromNode(document.documentElement);
  var newSelected=generatedSelectedObject(document.documentElement,prospectiveRule);
  switchSelected(newSelected,prospectiveRule);
}
function handleRuleDelete(ruleID,ruleIndex){
  console.assert(varExists(elementSelectorLocalBookmark));
  port.postMessage({'command':"deleteRule",
                    'idx':ruleIndex,
                    'ruleID':bookmarkRulesItem.URLToID(elementSelectorLocalBookmark.url),
                    'bookmarkID':elementSelectorLocalBookmark.id
                  });
}
function handleRuleSelect(ruleID,ruleIndex){
  let localRule=jsonToRuleItem(elementSelectorLocalRules[ruleIndex]);
  let selections=localRule.locateOnDoc(document);
  if(varExists(selections)){
    let prospectiveRule=new bookmarkRulesItem(window.location.toString(),undefined,selectState.include);
    prospectiveRule.setupFromNode(selections[0]);
    var newSelected=generatedSelectedObject(selections[0],prospectiveRule);
    switchSelected(newSelected,prospectiveRule);
  }
  else{
    switchSelected(undefined);
  }
}
document.addEventListener('DOMContentLoaded', initializeElementSelector);