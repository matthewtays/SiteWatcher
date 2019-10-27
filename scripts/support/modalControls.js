function clearListeners(node){
  var new_element = node.cloneNode(true);
  node.parentNode.replaceChild(new_element, node);
  return new_element;
}
function innerGetAndDisplayModal(modalID){
  var modal = document.getElementById(modalID);
  modal.style.display = "block";
  return modal;
}
function pageToOption(page){
  var node=document.createElement("option");
  //node.id=page.id;
  node.innerHTML=page.name;
  node.className="pagesBarItem";
  return node;
}
function innerPopulateSelect(selectNodeID,selectedPage){
  //populate the select
  var myNode=document.getElementById(selectNodeID);
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
  var pageElementsList=[];
  getData('pages',function(pagesData){
    for(var i=0;i<pagesData.pages.length;++i){
      (function(pageId,idx){
        getData(pageId,function(pageData){
          var page=jsonToPageItem(pageData[pageId]);
          pageElementsList.push({"ele":pageToOption(page),"idx":page.idx});
          if(pageElementsList.length>=pagesData.pages.length){
            sortBy(pageElementsList,["idx"]);
            for(var j=0;j<pageElementsList.length;++j){
              myNode.append(pageElementsList[j].ele);
            }
            if(selectedPage===undefined){
              getData({'lup':0},function(data){
                myNode.selectedIndex=data.lup;
              });
            }
            else{
              myNode.selectedIndex=selectedPage;
            }
          }
        });
      })(pagesData.pages[i],i);
    }
  });
  return myNode;
}
function validString(input){
  return input!==undefined&&input!==null&&input!=="";
}
function displayBookmarkManipulationModal(modalID,confirmCallback,cancelCallback,defaultURLVal,defaultNameVal,defaultSelectIdx,storedData){
  innerGetAndDisplayModal(modalID);
  var selectNode=innerPopulateSelect("bookmarkAddPageSelect",defaultSelectIdx);
  clearListeners(document.getElementById("confirmAddBookmark")).addEventListener("click",function(){
    confirmAddBookmark(modalID,confirmCallback,storedData)
  });
  clearListeners(document.getElementById("cancelAddBookmark")).addEventListener("click",function(){
    cancelAddBookmark(modalID,cancelCallback,storedData);
  });
  if(validString(defaultURLVal)){
    document.getElementById("bookmarkUrlInputField").value=defaultURLVal;
  }
  if(validString(defaultNameVal)){
    document.getElementById("bookmarkNameInputField").value=defaultNameVal;
  }
  if(defaultSelectIdx!==undefined&&defaultSelectIdx!==null){
    selectNode.selectedIndex=defaultSelectIdx;
  }
}
function cancelAddBookmark(modalID,cancelCallback,storedData){
  if(cancelCallback!==undefined&&cancelCallback!==null){
    cancelCallback(storedData);
  }
  hideBookmarkModal(modalID);
}
function confirmAddBookmark(modalID,confirmCallback,storedData){
  var modal = document.getElementById(modalID);
  var selectNode=document.getElementById("bookmarkAddPageSelect");
  var newPageIndex=selectNode.selectedIndex;
  if(confirmCallback!==undefined&&confirmCallback!==null){
    console.log("confirm callback was called");
    confirmCallback(document.getElementById("bookmarkUrlInputField").value,document.getElementById("bookmarkNameInputField").value,newPageIndex,storedData);
  }
  hideBookmarkModal(modalID);
}
function hideBookmarkModal(modalID){
  var modal = document.getElementById(modalID);
  modal.style.display="none";
  document.getElementById("bookmarkUrlInputField").value="";
  document.getElementById("bookmarkNameInputField").value="";
}
function displayTestURLModal(modalID,defaultURLVal,confirmCallback,cancelCallback){
  innerGetAndDisplayModal(modalID);
  if(defaultURLVal!==undefined&&defaultURLVal!==null){
    document.getElementById("testPageUrlInputField").value=defaultURLVal;
  }
  clearListeners(document.getElementById("testPageAcceptButton")).addEventListener("click",function(){
    confirmTestURL(confirmCallback,modalID);
  });
  clearListeners(document.getElementById("testPageCancelButton")).addEventListener("click",function(){
    cancelTestURL(cancelCallback,modalID);
  });
}
function hideTestURLModal(modalID){
  var modal = document.getElementById(modalID);
  modal.style.display="none";
  document.getElementById("testPageUrlInputField").value="";
  document.getElementById("htmlDisplayArea").innerHTML="";
}
function confirmTestURL(confirmCallback,modalID){
  if(confirmCallback!==undefined&&confirmCallback!==null){
    confirmCallback(document.getElementById("testPageUrlInputField").value);
  }
}
function cancelTestURL(cancelCallback,modalID){
  if(cancelCallback!==undefined&&cancelCallback!==null){
    cancelCallback();
  }
  hideTestURLModal(modalID);
}
function displayAddPageModal(modalID,confirmCallback,cancelCallback){
  innerGetAndDisplayModal(modalID);
  clearListeners(document.getElementById("confirmAddPageButton")).addEventListener("click",function(){
    hideAddPageModal(modalID,confirmCallback);
  });
  clearListeners(document.getElementById("cancelAddPageButton")).addEventListener("click",function(){
    hideAddPageModal(modalID,cancelCallback);
  });
}
function hideAddPageModal(modalID,callback){
  if(varExists(callback)){
    callback(document.getElementById("pageNameInputField").value);
  }
  var modal = document.getElementById(modalID);
  modal.style.display="none";
  document.getElementById("pageNameInputField").value="";
}