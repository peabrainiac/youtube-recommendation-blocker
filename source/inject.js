var videoPageRegex = /youtube\.com\/watch\?/;
var startPageRegex = /youtube\.com\/?$/;

onPageLoad(function(){
	if (videoPageRegex.test(document.location.href)){
		var link = loadStylesheet("video.css");
		document.head.appendChild(link);
	}else if (startPageRegex.test(document.location.href)){
		var link = loadStylesheet("startpage.css");
		var temp = loadStylesheet("no-transitions.css");
		document.head.appendChild(temp);
		document.head.appendChild(link);
		setTimeout(function(){
			document.head.removeChild(temp);
		},0);
	}
});

function loadStylesheet(path){
	var element = document.createElement("link");
	element.rel = "stylesheet";
	element.href = chrome.extension.getURL(path);
	console.log("Injected "+path);
	return element;
}

function onPageLoad(f){
	if (document.readyState!="loading"){
		f();
	}else{
		window.addEventListener("DOMContentLoaded",f);
	}
}