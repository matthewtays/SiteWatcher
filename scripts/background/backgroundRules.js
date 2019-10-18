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