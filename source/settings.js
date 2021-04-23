onLoad(function (){
	var colorSettingsElement = new ColorSettingsElement();
	document.getElementById("settings").prepend(colorSettingsElement);
	var saveButton = document.getElementById("button-save");
	saveButton.disabled = true;
	saveButton.addEventListener("click",function(){
		saveSettings(colorSettingsElement.data);
		saveButton.classList.remove("highlighted");
		saveButton.disabled = true;
		saveButton.blur();
	});
	window.addEventListener("keydown",(e)=>{
		if ((e.key=="s"||e.key=="S")&&(e.ctrlKey||e.metaKey)){
			e.preventDefault();
			saveButton.click();
		}
	});

	browser.storage.local.get("colorSettings").then((settings)=>{
		colorSettingsElement.data = settings.colorSettings||{default:"#80808010",currentChannel:"#80808020",categories:[]};
	});

	colorSettingsElement.onChange(()=>{
		saveButton.classList.add("highlighted");
		saveButton.disabled = false;
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
			<default-category-element name="Default" title="default category for all videos"></default-category-element>
			<default-category-element name="Current Channel" title="category for videos by the same channel as the current one"></default-category-element>
			<div class="color-settings-categories-list"></div>
			<button class="color-settings-add-category-button">+ Add Category</button>
		`;
		this._defaultColorInput = this.querySelector("default-category-element[name=\"Default\"]");
		this._currentChannelColorInput = this.querySelector("default-category-element[name=\"Current Channel\"]");
		this._categoriesList = this.querySelector(".color-settings-categories-list");
		this._addCategoryButton = this.querySelector(".color-settings-add-category-button");
		this._defaultColorInput.onChange(()=>{
			this._onChange();
		});
		this._currentChannelColorInput.onChange(()=>{
			this._onChange();
		});
		this._addCategoryButton.addEventListener("click",()=>{
			let categoryElement = new CategoryElement();
			this._categoriesList.appendChild(categoryElement);
			categoryElement.focus();
			categoryElement.onChange(()=>{
				this._onChange();
			});
			this._onChange();
		});
	}

	get data(){
		var colorSettings = {};
		colorSettings.default = this._defaultColorInput.data;
		colorSettings.currentChannel = this._currentChannelColorInput.data;
		colorSettings.categories = [];
		for (let i=0;i<this._categoriesList.children.length;i++){
			colorSettings.categories.push(this._categoriesList.children[i].data);
		}
		return colorSettings;
	}

	set data(colorSettings){
		this._defaultColorInput.data = colorSettings.default;
		this._currentChannelColorInput.data = colorSettings.currentChannel;
		this._categoriesList.innerHTML = "";
		for (let i=0;i<colorSettings.categories.length;i++){
			let categoryElement = new CategoryElement();
			categoryElement.data = colorSettings.categories[i];
			this._categoriesList.appendChild(categoryElement);
			categoryElement.onChange(()=>{
				this._onChange();
			});
		}
	}

	onChange(callback){
		this._onChange = callback;
	}
}

class CategoryElement extends HTMLElement {
	constructor(){
		super();
		this.className = "category";
		this.innerHTML = `
			<div class="category-header" title="custom category">
				<text-input class="category-name" placeholder="category name" title="category name"></text-input>
				<text-input class="category-color" placeholder="rgb color value" title="hex color value, e.g. #dfefff. Search \'hex color picker\' online for more information."></text-input>
				<div class="category-close-button" title="delete category" tabindex="0">
					<svg width="12" height="12"><path d="M 1 1 L 11 11 M 1 11 L 11 1" style="fill:transparent;stroke:currentcolor;stroke-linecap:round;stroke-width:2px" /></svg>
				</div>
			</div>
			<div class="category-channel-list"></div>
			<button class="category-add-channel-button">+ Add Channel</button>
		`;
		this._header = this.querySelector(".category-header");
		this._nameInput = this.querySelector(".category-name");
		this._colorInput = this.querySelector(".category-color");
		this._closeButton = this.querySelector(".category-close-button");
		this._channelList = this.querySelector(".category-channel-list");
		this._addChannelButton = this.querySelector(".category-add-channel-button");
		this._nameInput.addEventListener("input",()=>{
			this._onChange();
		});
		this._colorInput.addEventListener("input",()=>{
			this.setBackgroundColor(this._colorInput.value);
			this._onChange();
		});
		this._closeButton.addEventListener("click",()=>{
			this.remove();
			this._onChange();
		});
		this._closeButton.addEventListener("keydown",(e)=>{
			if (e.key=="Enter"){
				e.stopPropagation();
				e.preventDefault();
				if (this.nextElementSibling!==null){
					this.nextElementSibling.focus();
				}else{
					this.parentElement.nextElementSibling.focus();
				}
				this.remove();
				this._onChange();
			}
		});
		this._addChannelButton.addEventListener("click",()=>{
			let channelElement = new CategoryEntryElement();
			this._channelList.appendChild(channelElement);
			channelElement.focus();
			channelElement.onChange(()=>{
				this._onChange();
			});
			this._onChange();
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
		this.setBackgroundColor(categoryData.color);
		this._channelList.innerHTML = "";
		for (let i=0;i<categoryData.channels.length;i++){
			let channelElement = new CategoryEntryElement();
			channelElement.data = categoryData.channels[i];
			this._channelList.appendChild(channelElement);
			channelElement.onChange(()=>{
				this._onChange();
			});
		}
	}

	setBackgroundColor(color){
		this._header.style.background = color;
		this._channelList.style.background = color+" linear-gradient(var(--background-transparent-1),var(--background-transparent-1))";
	}

	focus(){
		this._nameInput.focus();
	}

	onChange(callback){
		this._onChange = callback;
	}
}

class DefaultCategoryElement extends HTMLElement {
	constructor(){
		super();
		this.className = "default-category";
		this.innerHTML = `
			<div class="category-header">
				<span class="category-name"></span>
				<text-input class="category-color" placeholder="rgb color value" title="hex color value, e.g. #dfefff. Search \'hex color picker\' online for more information."></text-input>
			</div>
		`;
		this._header = this.querySelector(".category-header");
		this._nameSpan = this.querySelector(".category-name");
		this._colorInput = this.querySelector(".category-color");
		this._colorInput.addEventListener("input",()=>{
			this.setBackgroundColor(this._colorInput.value);
			this._onChange();
		});
	}

	get data(){
		return this._colorInput.value;
	}

	set data(colorData){
		this._colorInput.value = colorData;
		this.setBackgroundColor(colorData);
	}

	static get observedAttributes(){
		return ["name"];
	}

	attributeChangedCallback(name,oldValue,newValue){
		if (name=="name"){
			this._nameSpan.innerText = newValue;;
		}
	}

	get name(){
		return this.getAttribute("name");
	}

	set name(name){
		this.setAttribute("name",name);
	}

	setBackgroundColor(color){
		this._header.style.background = color;
	}

	onChange(callback){
		this._onChange = callback;
	}
}

class CategoryEntryElement extends HTMLElement {
	constructor(){
		super();
		this.className = "category-channel-entry";
		this.innerHTML = `
			<text-input class="channel-name" placeholder="channel name here" title="channel name"></text-input>
			<div class="channel-close-button" title="delete channel" tabindex="0">
				<svg width="12" height="12"><path d="M 1 1 L 11 11 M 1 11 L 11 1" style="fill:transparent;stroke:currentcolor;stroke-linecap:round;stroke-width:2px" /></svg>
			</div>
		`;
		this._channelInput = this.querySelector(".channel-name");
		this._channelInput.addEventListener("input",()=>{
			this._onChange();
		});
		this._closeButton = this.querySelector(".channel-close-button");
		this._closeButton.addEventListener("click",()=>{
			this.remove();
			this._onChange();
		});
		this._closeButton.addEventListener("keydown",(e)=>{
			if (e.key=="Enter"){
				e.stopPropagation();
				e.preventDefault();
				if (this.nextElementSibling!==null){
					this.nextElementSibling.focus();
				}else{
					this.parentElement.nextElementSibling.focus();
				}
				this.remove();
				this._onChange();
			}
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

	onChange(callback){
		this._onChange = callback;
	}
}

class TextInput extends HTMLElement {
	constructor(){
		super();
		this.attachShadow({mode:"open"});
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: inline-block;
					position: relative;
					min-width: 185px;
					padding: 1px;
					border: 1px solid transparent;
					transition: border-bottom-color 0.25s ease;
					font-family: "MS Shell Dlg 2", sans-serif; 
				}
				input {
					background: transparent;
					position: absolute;
					left: 0;
					top: 0;
					right: 0;
					bottom: 0;
					width: 100%;
					padding: inherit;
					outline: none;
				}
				span {
					visibility: hidden;
					padding: 0;
				}
				input, span {
					border: none;
					color: inherit;
					font: inherit;
					text-align: inherit;
					white-space: pre;
				}
			</style>
			<span> </span>
			<input type="text" class="inner-input">
		`;
		this._input = this.shadowRoot.querySelector("input");
		this._text = this.shadowRoot.querySelector("span");
		this._input.addEventListener("input",()=>{
			this._text.innerText = this._input.value||" ";
		});
	}

	focus(){
		this._input.focus();
	}

	get value(){
		return this._input.value;
	}

	set value(value){
		this._input.value = value;
		this._text.innerText = value||" ";
	}

	static get observedAttributes(){
		return ["placeholder"];
	}

	attributeChangedCallback(name,oldValue,newValue){
		if (name=="placeholder"){
			this._input.setAttribute(name,newValue);
		}
	}

	get placeholder(){
		return this.getAttribute("placeholder");
	}

	set placeholder(value){
		this.setAttribute("placeholder",value);
	}
}

customElements.define("color-settings-element",ColorSettingsElement);
customElements.define("category-element",CategoryElement);
customElements.define("default-category-element",DefaultCategoryElement);
customElements.define("category-entry-element",CategoryEntryElement);
customElements.define("text-input",TextInput);