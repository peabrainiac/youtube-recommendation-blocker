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
			onStartPageLoad();
		}else if(startPageStyles.disabled){
			startPageStyles.disabled = false;
		}
	}else if(startPageStyles&&!startPageStyles.disabled){
		startPageStyles.disabled = true;
	}
});

async function onStartPageLoad(){
	var colorSettings = await getColorSettings();
	let processedVideos = [];
	let container = document.getElementById("contents");
	console.log("Container:",container);
	(new MutationObserver(update)).observe(container,{childList:true});
	update();
	function update(){
		console.log("processing new videos!");
		let videos = document.getElementsByTagName("ytd-rich-grid-video-renderer");
		for (let i=0;i<videos.length;i++){
			let video = videos[i];
			if (!processedVideos.includes(video)){
				let title = (video.querySelector("#video-title")||{}).textContent;
				let channel = (video.querySelector("#channel-name #container #text-container #text a")||{}).textContent;
				console.log("Processing video: ",{title,channel});
				videos[i].style.setProperty("--ext-yt-blocker-color",getVideoColor(colorSettings,title,channel));
				processedVideos.push(video);
			}
		}
	}
}

async function onVideoPageLoad(){
	let processedVideos = [];
	let firstMutationObserver = new MutationObserver(testForList);
	firstMutationObserver.observe(document.body,{childList:true});
	testForList();
	var colorSettings = getColorSettings();
	async function testForList(){
		var list = document.querySelector("ytd-watch-next-secondary-results-renderer #items");
		console.log("body mutated! list:",list);
		if (list){
			firstMutationObserver.disconnect();
			console.log("List loaded!");
			colorSettings = await colorSettings;
			(new MutationObserver(update)).observe(list,{childList:true});
			update();
		}
	}
	function update(){
		console.log("processing new videos!");
		let videos = document.querySelectorAll("ytd-compact-video-renderer, ytd-compact-playlist-renderer");
		for (let i=0;i<videos.length;i++){
			let video = videos[i];
			if (!processedVideos.includes(video)){
				let title = video.querySelector("#video-title").textContent.trim();
				let channel = video.querySelector("#channel-name #container #text-container #text").textContent;
				console.log("Processing video: ",{title,channel});
				videos[i].style.setProperty("--ext-yt-blocker-color",getVideoColor(colorSettings,title,channel));
				processedVideos.push(video);
			}
		}
	}
}

async function getColorSettings(){
	return (await browser.storage.local.get("colorSettings")).colorSettings;
}

function getVideoColor(settings,title,channel){
	let color = settings.default;
	console.log("Settings:",settings);
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