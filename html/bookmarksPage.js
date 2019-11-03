//The page is loaded with data by CONTENT. this just gives any generics
function swapToClass(className,excludeClassNames){
  let classList=document.getElementsByClassName(className);
  for(let i=0;i<classList.length;++i){
    classList[i].classList.remove("hidden");
  }
  for(let i=0;i<excludeClassNames.length;++i){
    let localElements=document.getElementsByClassName(excludeClassNames[i]);
    for(let j=0;j<localElements.length;++j){
      localElements[j].classList.add("hidden");
    }
  }
}
function swapToHome(){
  swapToClass("homePageSection",["aboutPageSection","settingsPageSection"]);
}
function swapToAbout(){
  swapToClass("aboutPageSection",["homePageSection","settingsPageSection"]);
}
function swapToSettings(){
  swapToClass("settingsPageSection",["homePageSection","aboutPageSection"]);
}
document.addEventListener('DOMContentLoaded', function(){
  document.getElementById("navBarAboutText").addEventListener("click",swapToAbout);
  document.getElementById("navBarSettingsText").addEventListener("click",swapToSettings);
  document.getElementById("navBarHomeText").addEventListener("click",swapToHome);
});
var isHome=true;