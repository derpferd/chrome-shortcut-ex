// Copyright (c) 2013 Jonathan Beaulieu All rights reserved.

var SYNC_WAIT_TIME = (1.0/chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_HOUR)*60*60*1000; // in milliseconds
var SYNC_WAIT_TIME = 1000*60; // in milliseconds

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    var rule = findRule(text);
    if (!rule) {
      suggest([
        {content: "+&" + text, description: "Add shortcut for " + text}
      ]);
    }
  });

chrome.omnibox.onInputEntered.addListener(
  function(text) {
    if (text.substr(0,2) == "+&") {
      var newRuleUrl = chrome.extension.getURL("options.html?new=" + text.substr(2));
      changePageTo(newRuleUrl);
    }
    else if (!findRule(text)) {
      var newRuleUrl = chrome.extension.getURL("options.html?new=" + text);
      changePageTo(newRuleUrl);
    }
    else {
      var rule = findRule(text);
      if (rule.action == "website") {
        changePageTo(rule.action_website);
      }
      else if (rule.action == "js") {
        try {
          eval(rule.action_js);
        } catch (e) {
          alert("JS Failed.")
        }
      }
    }
    console.log('inputEntered: ' + text);
  });

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (key in changes) {
    var storageChange = changes[key];
    try {
      localStorage[key] = JSON.stringify(mergeRuleSets(JSON.parse(storageChange.newValue), JSON.parse(localStorage[key])));
      if (localStorage[key] != JSON.parse(storageChange.newValue)) {
        syncRulesUp();
      }
    }
    catch (e) {
      console.log("Error syncing: " + key);
    }
  }
  });

function changePageTo(newUrl) {
  chrome.tabs.query({"url": newUrl}, function(tabs) {
    if (tabs.length > 0){
      var tabId = tabs[0].id;
      chrome.tabs.getSelected(function(tab){
        chrome.tabs.remove(tab.id);
        chrome.tabs.update(tabId, {selected: true});
      });
    }
    else {
      chrome.tabs.getSelected(function(tab){
        chrome.tabs.remove(tab.id);
        chrome.tabs.create({url:newUrl});
      });
    }
  });
}

function isMatch(rule, s) {
  if (rule.match_param == s && rule.enabled) {
    return true;
  }
  else {
    return false;
  }
}

function findRule(s) {
  var rules = localStorage.rules;
  try {
    rules = JSON.parse(rules);
  } catch (e) {
    localStorage.rules = JSON.stringify([]);
  }
  for (var index = 0; index < rules.length; ++index) {
    var rule = rules[index];
    if (isMatch(rule, s)) {return rule;}
  }
  return false;
}

function syncRulesUp() {
  console.log("Uploading rules...");
  chrome.storage.sync.set({'rules': localStorage.rules});
}

function areRulesEqual(rule1, rule2) {
  try {
    for (key in rule1) {
      if (rule1[key] != rule2[key]) { return false; }
    }
    for (key in rule2) {
      if (rule1[key] != rule2[key]) { return false; }
    }
  } catch (e) {
    return false;
  }
  return true;
}

function hasRule(set, rule){
  for (var index = 0; index < set.length; ++index) {
    if (areRulesEqual(set[index], rule)) { return true; }
  }
  return false;
}

function mergeRuleSets(set1, set2) {
  var set3 = [];
  var max = Math.max(set1.length, set2.length);
  for (var index = 0; index < max; ++index) {
    if (index < set1.length) {
      if (!hasRule(set3, set1[index])) {
        console.log("adding from 1:" + index);
        set3.push(set1[index]);
      }
    }
    if (index < set2.length) {
      if (!hasRule(set3, set2[index])) {
        console.log("adding from 2:" + index);
        set3.push(set2[index]);
      }
    }
  }
  return set3;
}

var tmpFunction_syncRulesUp = function(){
  syncRulesUp();
  setTimeout(tmpFunction_syncRulesUp, SYNC_WAIT_TIME);
};
tmpFunction_syncRulesUp()
