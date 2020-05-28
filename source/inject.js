(async()=>{
	const videoPageRegex = /youtube\.com\/watch\?/;
	const startPageRegex = /youtube\.com\/?$/;
	const isVideoPage = ()=>(videoPageRegex.test(document.location.href));
	const isStartPage = ()=>(startPageRegex.test(document.location.href));

	const videoPageStyles = loadStylesheet("video.css");
	const startPageStyles = loadStylesheet("startpage.css");
	const tempStyles = loadStylesheet("no-transitions.css");
	updateActiveStyles();

	await waitUntilLoaded();

	document.head.appendChild(tempStyles);
	document.head.appendChild(videoPageStyles);
	document.head.appendChild(startPageStyles);
	setTimeout(()=>{
		document.head.removeChild(tempStyles);
	},100);

	window.addEventListener("yt-navigate-start",function(){
		console.log("Navigation Start!");
		updateActiveStyles();
	});
	function updateActiveStyles(){
		videoPageStyles.disabled = !isVideoPage();
		startPageStyles.disabled = !isStartPage();
	}

	onLoadOrNavigationEnd(function(){
		console.log("Navigation End!")
		if (isVideoPage()){
			onVideoPageLoad();
		}
		if (isStartPage()){
			onStartPageLoad();
		}
	});

	async function onStartPageLoad(){
		console.log("Running code on startpage!");
		var colorSettings = await getColorSettings();
		let container = await asyncQuerySelector(document.body,"#contents.ytd-rich-grid-renderer");
		console.log("Grid loaded:",container);
		asyncQuerySelectorAll(container,"ytd-rich-grid-video-renderer",function(video){
			console.log("Processing video: ",video);
			colorVideo(video,colorSettings);
			setTimeout(()=>{
				// checks the video again one second later, in case the page wasn't fully loaded previously
				colorVideo(video,colorSettings);
			},1000)
		});
	}

	async function onVideoPageLoad(){
		var colorSettings = await getColorSettings();
		let currentChannel = (await asyncQuerySelector(document.body,"#meta #upload-info #channel-name a")).textContent;
		console.log("Current channel:",currentChannel);
		let list = await asyncQuerySelector(document.body,"ytd-watch-next-secondary-results-renderer #items");
		console.log("List loaded!");
		asyncQuerySelectorAll(list,"ytd-compact-video-renderer, ytd-compact-playlist-renderer",function(video){
			console.log("Processing video: ",video);
			colorVideo(video,colorSettings,currentChannel);
			setTimeout(()=>{
				// checks the video again one second later, in case the page wasn't fully loaded previously
				colorVideo(video,colorSettings,currentChannel);
			},1000);
		});
	}

	function colorVideo(video,colorSettings,currentChannel=null){
		let title = (video.querySelector("#video-title")||{}).textContent.trim();
		let channel = (video.querySelector("#channel-name #container #text-container #text")||{}).textContent;
		video.style.setProperty("--ext-yt-blocker-color",getVideoColor(colorSettings,title,channel,currentChannel));
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
		return (settings&&settings.colorSettings)||{default:"#efefef",currentChannel:"#e0e0e0",categories:[]};
	}

	function getVideoColor(settings,title,channel,currentChannel=null){
		let color = settings.default;
		if (channel==currentChannel){
			color = settings.currentChannel;
		}
		if (channel!==undefined){
			for (let i=0;i<settings.categories.length;i++){
				for (let i2=0;i2<settings.categories[i].channels.length;i2++){
					if (channel.toUpperCase()==settings.categories[i].channels[i2].toUpperCase()){
						color = settings.categories[i].color;
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

	async function waitUntilLoaded(){
		return new Promise((resolve)=>{
			onLoad(resolve);
		});
	}
	function onLoad(f){
		if (document.readyState!="loading"){
			f();
		}else{
			window.addEventListener("DOMContentLoaded",f);
		}
	}
	function onLoadOrNavigationEnd(f){
		onLoad(f);
		window.addEventListener("yt-navigate-finish",f);
	}
})();