
function innerGetAndDisplayModal(modalID){
  var modal = document.getElementById(modalID);
  modal.style.display = "block";
  return modal;
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
          pageElementsList.push({"ele":page.htmlElement,"idx":page.idx});
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
  document.getElementById("confirmAddBookmark").addEventListener("click",function(){
    confirmAddBookmark(modalID,confirmCallback,storedData)
  });
  document.getElementById("cancelAddBookmark").addEventListener("click",function(){
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
  document.getElementById("testPageAcceptButton").addEventListener("click",function(){
    confirmTestURL(confirmCallback,modalID);
  });
  document.getElementById("testPageCancelButton").addEventListener("click",function(){
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
    cancelCallback(storedData);
  }
  hideTestURLModal(modalID);
}