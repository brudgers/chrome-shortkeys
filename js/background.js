chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.method == "getKeys")
  sendResponse({keys: localStorage['shortkeys']});
  else if (request.method == "nextTab") {
    nextTab();
  }
  else if (request.method == "prevTab") {
    prevTab();
  }
  else
  sendResponse({});
});


function nextTab() { selectTab("next"); }
function prevTab() { selectTab("previous"); }
function firstTab() { selectTab("first"); }
function lastTab() { selectTab("last"); }

function selectTab(direction) {
  chrome.tabs.getAllInWindow(null, function(tabs) {
    if (tabs.length <= 1)
    return;
  chrome.tabs.getSelected(null, function(currentTab) {
    switch (direction) {
      case "next":
        toSelect = tabs[(currentTab.index + 1 + tabs.length) % tabs.length];
        break;
      case "previous":
        toSelect = tabs[(currentTab.index - 1 + tabs.length) % tabs.length];
        break;
      case "first":
        toSelect = tabs[0];
        break;
      case "last":
        toSelect = tabs[tabs.length - 1];
        break;
    }
    chrome.tabs.update(toSelect.id, { selected: true });
  });
  });
}

