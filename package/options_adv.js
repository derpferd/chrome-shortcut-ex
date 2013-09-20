function dump() {
	document.getElementById("io").value = localStorage["rules"];
}

function load() {
	if(confirm("Are you sure you want to over ride the current settings?")) {
		if (document.getElementById("io").value == "" ){
			localStorage["rules"] = "[]";
		}
		localStorage["rules"] = document.getElementById("io").value;
	}
}

window.onload = function() {
  document.getElementById('dump').onclick = function() {
    dump();
  };
  document.getElementById('load').onclick = function() {
    load();
  };
  document.getElementById('simple').onclick = function() {
    window.location.pathname = "options.html";
  };
}