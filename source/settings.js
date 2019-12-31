onLoad(function (){
	/*let tableBody = document.getElementById("table-body");
	var addRuleButton = document.getElementById("button-add-rule");
	addRuleButton.addEventListener("click",function(){
		let row = document.createElement("tr");
		row.innerHTML = `
			<td><input type="text" class="input-channel"></td>
			<td><input type="text" class="input-color"></td>
			<td><button class="button-delete">Delete</button></td>
		`;
		tableBody.insertBefore(row,tableBody.firstChild);
	});*/
	var saveButton = document.getElementById("button-save");
	saveButton.addEventListener("click",function(){
		saveSettings(JSON.parse(document.getElementById("textarea").value));
	})

	function saveSettings(colorSettings){
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