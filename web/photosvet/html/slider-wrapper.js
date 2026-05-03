window.onload = function(){
  setTimeout(function(){
    var scriptElement=document.createElement('script');
    scriptElement.type = 'text/javascript';
    scriptElement.src = "./slider.js";
    document.head.appendChild(scriptElement);
  }, 150);
};