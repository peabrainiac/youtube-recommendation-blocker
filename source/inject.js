var videoPageRegex = /youtube\.com\/watch\?/;
var startPageRegex = /youtube\.com\/?$/;

var videoPageStyles;
var startPageStyles;

onLoadOrNavigation(function(){
	if (videoPageRegex.test(document.location.href)){
		if (!videoPageStyles){
			videoPageStyles = loadStylesheet("video.css");
			document.head.appendChild(videoPageStyles);
		}else if (videoPageStyles.disabled){
			videoPageStyles.disabled = false;
		}
	}else if(videoPageStyles&&!videoPageStyles.disabled){
		videoPageStyles.disabled = true;
	}
	if (startPageRegex.test(document.location.href)){
		if (!startPageStyles){
			startPageStyles = loadStylesheet("startpage.css");
			var temp = loadStylesheet("no-transitions.css");
			document.head.appendChild(temp);
			document.head.appendChild(startPageStyles);
			setTimeout(function(){
				document.head.removeChild(temp);
			},0);
		}else if(startPageStyles.disabled){
			startPageStyles.disabled = false;
		}
	}else if(startPageStyles&&!startPageStyles.disabled){
		startPageStyles.disabled = true;
	}
});

function loadStylesheet(path){
	var element = document.createElement("link");
	element.rel = "stylesheet";
	element.href = chrome.extension.getURL(path);
	return element;
}

function onLoadOrNavigation(f){
	if (document.readyState!="loading"){
		f();
	}else{
		window.addEventListener("DOMContentLoaded",f);
	}
	window.addEventListener("yt-navigate-start",f);
}