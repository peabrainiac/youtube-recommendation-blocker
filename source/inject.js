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
		onVideoPageLoad();
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
		onStartPageLoad();
	}else if(startPageStyles&&!startPageStyles.disabled){
		startPageStyles.disabled = true;
	}
});

async function onStartPageLoad(){
	console.log("Running code on startpage!");
	var colorSettings = await getColorSettings();
	let container = await asyncQuerySelector(document.body,"#contents.ytd-rich-grid-renderer");
	console.log("Grid loaded:",container);
	asyncQuerySelectorAll(container,"ytd-rich-grid-video-renderer",function(video){
		let title = (video.querySelector("#video-title")||{}).textContent;
		let channel = (video.querySelector("#channel-name #container #text-container #text a")||{}).textContent;
		console.log("Processing video: ",{title,channel});
		video.style.setProperty("--ext-yt-blocker-color",getVideoColor(colorSettings,title,channel));
	});
}

async function onVideoPageLoad(){
	var colorSettings = await getColorSettings();
	let list = await asyncQuerySelector(document.body,"ytd-watch-next-secondary-results-renderer #items");
	console.log("List loaded!");
	let currentChannel = (await asyncQuerySelector(document.body,"#meta #upload-info #channel-name a")).textContent;
	console.log("Current channel:",currentChannel);
	asyncQuerySelectorAll(list,"ytd-compact-video-renderer, ytd-compact-playlist-renderer",function(video){
		let title = video.querySelector("#video-title").textContent.trim();
		let channel = video.querySelector("#channel-name #container #text-container #text").textContent;
		console.log("Processing video: ",{title,channel});
		video.style.setProperty("--ext-yt-blocker-color",getVideoColor(colorSettings,title,channel,currentChannel));
	});
}

async function asyncQuerySelector(containerElement,query){
	return new Promise((resolve,reject)=>{
		let mutationObserver = new MutationObserver(testQuery);
		mutationObserver.observe(containerElement,{childList:true,subtree:true});
		testQuery();
		function testQuery(){
			let element = containerElement.querySelector(query);
			if (element){
				mutationObserver.disconnect();
				resolve(element);
			}
		}
	});
}

function asyncQuerySelectorAll(containerElement,query,callback){
	let processedElements = [];
	let mutationObserver = new MutationObserver(update);
	mutationObserver.observe(containerElement,{childList:true})
	update();
	function update(){
		let elements = containerElement.querySelectorAll(query);
		for (let i=0;i<elements.length;i++){
			let element = elements[i];
			if (!processedElements.includes(element)){
				callback(element);
				processedElements.push(element);
			}
		}
	}
}

async function getColorSettings(){
	let settings = await browser.storage.local.get("colorSettings");
	console.log("Settings:",settings);
	return ((settings&&settings.colorSettings)?settings.colorSettings:{default:"#efefef",categories:[]});
}

function getVideoColor(settings,title,channel,currentChannel=null){
	console.log("Computing video color!");
	let color = settings.default;
	console.log("Settings:",settings);
	if (channel==currentChannel){
		color = settings.currentChannel;
	}else if (channel!==undefined){
		for (let i=0;i<settings.categories.length;i++){
			for (let i2=0;i2<settings.categories[i].channels.length;i2++){
				if (channel.toUpperCase()==settings.categories[i].channels[i2].toUpperCase()){
					color = settings.categories[i].color;
					console.log("Found Matching channel!");
				}else{
					console.log("Channel not matching; channel: \""+channel+"\", other channel: \""+settings.categories[i].channels[i2]+"\"");
				}
			}
		}
	}
	return color;
}

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