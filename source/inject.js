(async()=>{
	const videoPageRegex = /youtube\.com\/watch\?/;
	const startPageRegex = /youtube\.com\/?$/;
	const isVideoPage = ()=>(videoPageRegex.test(document.location.href));
	const isStartPage = ()=>(startPageRegex.test(document.location.href));
	const videoQuerySelector = "ytd-compact-video-renderer, ytd-compact-playlist-renderer, ytd-rich-grid-video-renderer";

	const videoPageStyles = loadStylesheet("video.css");
	const startPageStyles = loadStylesheet("startpage.css");
	const tempStyles = loadStylesheet("no-transitions.css");
	updateActiveStyles();

	await waitUntilLoaded();

	document.head.appendChild(tempStyles);
	document.head.appendChild(videoPageStyles);
	document.head.appendChild(startPageStyles);
	setTimeout(()=>{
		tempStyles.disabled = true;
	},100);

	window.addEventListener("yt-navigate-start",function(){
		console.log("Navigation Start!");
		updateActiveStyles();
	});
	function updateActiveStyles(){
		videoPageStyles.disabled = !isVideoPage();
		startPageStyles.disabled = !isStartPage();
	}

	const colorSettings = new ColorSettings();
	await colorSettings.fetch();
	let currentChannel = null;
	let container = null;
	let updatePlanned = false;
	let mutationObserver = new MutationObserver((mutationRecords)=>{
		// updates the colors of all videos 500ms later, unless another update is already planned before that 
		if (!updatePlanned){
			updatePlanned = true;
			setTimeout(()=>{
				updatePlanned = false;
				updateColors();
			},3000);
		}
		mutationRecords.forEach((mutationRecord)=>{
			mutationRecord.addedNodes.forEach((element)=>{
				if (element.matches(videoQuerySelector)){
					colorVideo(element);
				}else{
					element.querySelectorAll(videoQuerySelector).forEach(colorVideo);
				}
			});
		});
	});

	onLoadOrNavigationEnd(function(){
		console.log("Navigation End!");
		updateColors();
		//setTimeout(updateColors,1000);
	});

	document.addEventListener("visibilitychange",async()=>{
		if (!document.hidden){
			await colorSettings.fetch();
			tempStyles.disabled = false;
			updateColors();
			setTimeout(()=>{
				tempStyles.disabled = true;
			},100);
		}
	});

	async function updateColors(){
		let t1 = Date.now();
		console.log("Updating!");
		let prevContainer = container;
		if (isVideoPage()){
			currentChannel = (await asyncQuerySelector(document.body,"#meta #upload-info #channel-name a")).textContent;
			container = await asyncQuerySelector(document.body,"ytd-watch-next-secondary-results-renderer #items");
		}else if(isStartPage()){
			currentChannel = null;
			container = await asyncQuerySelector(document.body,"#contents.ytd-rich-grid-renderer");
		}
		console.log("Current channel:",currentChannel);
		console.log("Container:",container);
		if (container!=prevContainer){
			mutationObserver.disconnect();
			processedVideos = [];
			mutationObserver.observe(container,{childList:true});
		}
		let videos = container.querySelectorAll(videoQuerySelector);
		videos.forEach(processVideo);
		console.log("time spend updating: "+(Date.now()-t1)+"ms");
	}

	function processVideo(video){
		console.log("Processing video:");
		colorVideo(video);
		setTimeout(()=>{
			// checks the video again one second later, in case the page wasn't fully loaded previously
			colorVideo(video);
		},1000);
	}

	function colorVideo(video){
		let title = (video.querySelector("#video-title")||{}).textContent.trim();
		let channel = (video.querySelector("#channel-name #container #text-container #text")||{}).textContent;
		video.style.setProperty("--ext-yt-blocker-color",colorSettings.getVideoColor(title,channel,currentChannel));
	}

	async function asyncQuerySelector(containerElement,query){
		return new Promise((resolve,reject)=>{
			let element = containerElement.querySelector(query);
			if (element){
				resolve(element);
			}else{
				let mutationObserver = new MutationObserver(()=>{
					let element = containerElement.querySelector(query);
					if (element){
						mutationObserver.disconnect();
						resolve(element);
					}
				});
				mutationObserver.observe(containerElement,{childList:true,subtree:true});
				
			}
		});
	}

	function loadStylesheet(path){
		var element = document.createElement("link");
		element.rel = "stylesheet";
		element.href = chrome.extension.getURL(path);
		return element;
	}

	async function waitUntilLoaded(){
		return new Promise((resolve)=>{
			if (document.readyState!="loading"){
				resolve();
			}else{
				window.addEventListener("DOMContentLoaded",resolve);
			}
		});
	}
	function onLoadOrNavigationEnd(f){
		f();
		window.addEventListener("yt-navigate-finish",f);
	}
})();

class ColorSettings {
	constructor(){
		this._colorSettings = null;
	}
	async fetch(){
		let settings = await browser.storage.local.get("colorSettings");
		console.log("Settings:",settings);
		this._colorSettings = (settings&&settings.colorSettings)||{default:"#efefef",currentChannel:"#e0e0e0",categories:[]};
	}
	getVideoColor(title,channel,currentChannel=null){
		let color = this._colorSettings.default;
		if (channel==currentChannel){
			color = this._colorSettings.currentChannel;
		}
		if (channel!==undefined){
			for (let i=0;i<this._colorSettings.categories.length;i++){
				let category = this._colorSettings.categories[i];
				for (let i2=0;i2<category.channels.length;i2++){
					if (channel.toUpperCase()==category.channels[i2].toUpperCase()){
						color = category.color;
					}
				}
			}
		}
		return color;
	}
}