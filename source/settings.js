onLoad(function (){
	var colorSettingsElement = new ColorSettingsElement();
	document.getElementById("settings").prepend(colorSettingsElement);
	var saveButton = document.getElementById("button-save");
	saveButton.addEventListener("click",function(){
		saveSettings(colorSettingsElement.data);
	});

	browser.storage.local.get("colorSettings").then((settings)=>{
		// loads some example channels if there are no saved settings yet. Will be removed in the next release
		colorSettingsElement.data = settings.colorSettings||{default:"#efefef",categories:[{name:"Science",color:"#cfeff8",channels:["3blue1brown","veritasium"]},{name:"Music",color:"#efdfcf",channels:["three days grace"]}]};
	});

	function saveSettings(colorSettings){
		console.log("data:",colorSettings);
		browser.storage.local.set({colorSettings:colorSettings}).then(()=>{console.log("saved settings!")});
	}
});

function onLoad(f){
	if (document.readyState!="loading"){
		f();
	}else{
		window.addEventListener("DOMContentLoaded",f);
	}
}

class ColorSettingsElement extends HTMLElement {
	constructor(){
		super();
		this.className = "color-settings";
		this.innerHTML = `
			<div class="color-settings-categories-list"></div>
			<button class="color-settings-add-category-button">+ Add Category</button>
		`;
		this._categoriesList = this.querySelector(".color-settings-categories-list");
		this._addCategoryButton = this.querySelector(".color-settings-add-category-button");
		this._addCategoryButton.addEventListener("click",()=>{
			let categoryElement = new CategoryElement();
			this._categoriesList.appendChild(categoryElement);
			categoryElement.focus();
		});
	}

	get data(){
		var colorSettings = {};
		colorSettings.default = "#efefef";
		colorSettings.categories = [];
		for (let i=0;i<this._categoriesList.children.length;i++){
			colorSettings.categories.push(this._categoriesList.children[i].data);
		}
		return colorSettings;
	}

	set data(colorSettings){
		this._categoriesList.innerHTML = "";
		for (let i=0;i<colorSettings.categories.length;i++){
			let categoryElement = new CategoryElement();
			categoryElement.data = colorSettings.categories[i];
			this._categoriesList.appendChild(categoryElement);
		}
	}
}

class CategoryElement extends HTMLElement {
	constructor(){
		super();
		this.className = "category";
		this.innerHTML = `
			<div class="category-header">
				<input type="text" class="category-name" placeholder="category name"></input>
				<input type="text" class="category-color" placeholder="rgb color value" title="hex color value, e.g. #dfefff. Search \'hex color picker\' online for more information."></input>
				<svg class="category-close-button" width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path d="M 1 1 L 11 11 M 1 11 L 11 1" style="fill:transparent;stroke:currentcolor;stroke-linecap:round;stroke-width:2px" /></svg>
			</div>
			<div class="category-channel-list"></div>
			<button class="category-add-channel-button">+ Add Channel</button>
		`;
		this._nameInput = this.querySelector(".category-name");
		this._colorInput = this.querySelector(".category-color");
		this._closeButton = this.querySelector(".category-close-button");
		this._channelList = this.querySelector(".category-channel-list");
		this._addChannelButton = this.querySelector(".category-add-channel-button");
		this._closeButton.addEventListener("click",()=>{
			this.remove();
		});
		this._addChannelButton.addEventListener("click",()=>{
			let channelElement = new CategoryEntryElement();
			this._channelList.appendChild(channelElement);
			channelElement.focus();
		});
	}

	get data(){
		var categoryData = {};
		categoryData.name = this._nameInput.value;
		categoryData.color = this._colorInput.value;
		categoryData.channels = [];
		for (let i=0;i<this._channelList.children.length;i++){
			categoryData.channels.push(this._channelList.children[i].data);
		}
		return categoryData;
	}

	set data(categoryData){
		this._nameInput.value = categoryData.name;
		this._colorInput.value = categoryData.color;
		this._channelList.innerHTML = "";
		for (let i=0;i<categoryData.channels.length;i++){
			let channelElement = new CategoryEntryElement();
			channelElement.data = categoryData.channels[i];
			this._channelList.appendChild(channelElement);
		}
	}

	focus(){
		this._nameInput.focus();
	}
}

class CategoryEntryElement extends HTMLElement {
	constructor(){
		super();
		this.className = "category-channel-entry";
		this.innerHTML = `
			<input type="test" class="channel-name" placeholder="channel name here">
			<svg class="channel-close-button" width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path d="M 1 1 L 11 11 M 1 11 L 11 1" style="fill:transparent;stroke:currentcolor;stroke-linecap:round;stroke-width:2px" /></svg>
		`;
		this._channelInput = this.querySelector(".channel-name");
		this._closeButton = this.querySelector(".channel-close-button");
		this._closeButton.addEventListener("click",()=>{
			this.remove();
		});
	}

	get data(){
		return this._channelInput.value;
	}

	set data(channel){
		this._channelInput.value = channel;
	}

	focus(){
		this._channelInput.focus();
	}
}

customElements.define("color-settings-element",ColorSettingsElement);
customElements.define("category-element",CategoryElement);
customElements.define("category-entry-element",CategoryEntryElement);