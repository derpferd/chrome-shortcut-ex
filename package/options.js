// Copyright (c) 2013 Jonathan Beaulieu All rights reserved.

var LAST_INPUT = 99999999999999 // in milliseconds
var TIMEOUT = 1000*60*15 // 15 minutes // in milliseconds
var tmpRefreshFunction = function(a, b, c){
  if ((new Date).getTime()-LAST_INPUT > TIMEOUT){
    window.location.reload();
  }
  LAST_INPUT = (new Date).getTime()
}
window.onmousedown = tmpRefreshFunction
window.oninput = tmpRefreshFunction

function Rule(data) {
  var rules = document.getElementById('rules');
  this.node = document.getElementById('rule-template').cloneNode(true);
  this.node.id = 'rule' + (Rule.next_id++);
  this.node.rule = this;
  rules.appendChild(this.node);
  this.node.hidden = false;

  if (data) {
    this.getElement('match-param').value = data.match_param;
    this.getElement('action').value = data.action;
    this.getElement('action-website').value = data.action_website;
    this.getElement('action-js').value = data.action_js;
    this.getElement('enabled').checked = data.enabled;
  }

  this.getElement('enabled-label').htmlFor = this.getElement('enabled').id =
    this.node.id + '-enabled';

  this.render();

  this.getElement('match-param').onkeyup = storeRules;
  this.getElement('action').onchange = storeRules;
  this.getElement('action-js').onkeyup = storeRules;
  this.getElement('action-website').onkeyup = storeRules;
  this.getElement('enabled').onchange = storeRules;

  var rule = this;
  this.getElement('move-up').onclick = function() {
    var sib = rule.node.previousSibling;
    rule.node.parentNode.removeChild(rule.node);
    sib.parentNode.insertBefore(rule.node, sib);
    storeRules();
  };
  this.getElement('move-down').onclick = function() {
    var parentNode = rule.node.parentNode;
    var sib = rule.node.nextSibling.nextSibling;
    parentNode.removeChild(rule.node);
    if (sib) {
      parentNode.insertBefore(rule.node, sib);
    } else {
      parentNode.appendChild(rule.node);
    }
    storeRules();
  };
  this.getElement('remove').onclick = function() {
    rule.node.parentNode.removeChild(rule.node);
    storeRules();
  };
  storeRules();
}

Rule.prototype.getElement = function(name) {
  return document.querySelector('#' + this.node.id + ' .' + name);
}

Rule.prototype.render = function() {
  this.getElement('move-up').disabled = !this.node.previousSibling;
  this.getElement('move-down').disabled = !this.node.nextSibling;
  this.getElement('action-website').style.display =
    (this.getElement('action').value == 'website') ? 'block' : 'none';
  this.getElement('action-js').style.display =
    (this.getElement('action').value == 'js') ? 'block' : 'none';
}

Rule.next_id = 0;

function loadRules() {
  console.log("Loading Rules...")
  document.getElementById('rules').innerHTML = "";
  var rules = localStorage.rules;
  if (!loadRulesString(rules)){
    localStorage.rules = JSON.stringify([]);
  }
}

function loadRulesString(rulesString) {
  try {
    JSON.parse(rulesString).forEach(function(rule) {new Rule(rule);});
    return true;
  } catch (e) {
    return false;
  }
}

function storeRules() {
  localStorage.rules = JSON.stringify(Array.prototype.slice.apply(
      document.getElementById('rules').childNodes).map(function(node) {
    node.rule.render();
    return {match_param: node.rule.getElement('match-param').value,
            action: node.rule.getElement('action').value,
            action_website: node.rule.getElement('action-website').value,
            action_js: node.rule.getElement('action-js').value,
            enabled: node.rule.getElement('enabled').checked};
  }));
}

function checkArgs() {
  var QueryString = function () {
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
      var pair = vars[i].split("=");
        // If first entry with this name
      if (typeof query_string[pair[0]] === "undefined") {
        query_string[pair[0]] = pair[1];
        // If second entry with this name
      } else if (typeof query_string[pair[0]] === "string") {
        var arr = [ query_string[pair[0]], pair[1] ];
        query_string[pair[0]] = arr;
        // If third or later entry with this name
      } else {
        query_string[pair[0]].push(pair[1]);
      }
    } 
      return query_string;
  } ();
  if (QueryString["new"]){
    var newMatchParam = QueryString["new"];
    new Rule({match_param: newMatchParam,action: "website",action_website: "http://",action_js: "",enabled: true});
    window.location.search = "";
  }
}

window.onload = function() {
  loadRules();
  document.getElementById('new').onclick = function() {
    new Rule();
  };
  document.getElementById('adv').onclick = function() {
    window.location.pathname = "options_adv.html";
  };
  checkArgs();
}
