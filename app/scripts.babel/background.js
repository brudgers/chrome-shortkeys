'use strict';

function copyToClipboard(text) {
    var copyDiv = document.createElement('div');
    copyDiv.contentEditable = true;
    document.body.appendChild(copyDiv);
    copyDiv.innerHTML = text;
    copyDiv.unselectable = 'off';
    copyDiv.focus();
    document.execCommand('SelectAll');
    document.execCommand('Copy', false, null);
    document.body.removeChild(copyDiv);
}

function selectTab(direction) {
    chrome.tabs.query({currentWindow: true}, (tabs) => {
        if (tabs.length <= 1) {
            return;
        }
        chrome.tabs.query({currentWindow: true, active: true}, (currentTabInArray) => {
            var currentTab = currentTabInArray[0];
            var toSelect;
            switch (direction) {
                case 'next':
                    toSelect = tabs[(currentTab.index + 1 + tabs.length) % tabs.length];
                    break;
                case 'previous':
                    toSelect = tabs[(currentTab.index - 1 + tabs.length) % tabs.length];
                    break;
                case 'first':
                    toSelect = tabs[0];
                    break;
                case 'last':
                    toSelect = tabs[tabs.length - 1];
                    break;
            }
            chrome.tabs.update(toSelect.id, {highlighted: true});
            chrome.tabs.update(currentTab.id, {highlighted: false});
        });
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var action = request.action;
    if (action === 'getKeys') {
        sendResponse(localStorage.shortkeys);
    }
    else if (action === 'cleardownloads') {
        chrome.browsingData.remove({'since': 0}, {'downloads': true});
    }
    else if (action === 'nexttab') {
        selectTab('next');
    }
    else if (action === 'prevtab') {
        selectTab('previous');
    }
    else if (action === 'firsttab') {
        selectTab('first');
    }
    else if (action === 'lasttab') {
        selectTab('last');
    }
    else if (action === 'newtab') {
        chrome.tabs.create({});
    }
    else if (action === 'reopentab') {
        chrome.sessions.getRecentlyClosed({maxResults: 1}, function(sessions) {
            let closedTab = sessions[0];
            chrome.sessions.restore(closedTab.sessionsId);
        });
    }
    else if (action === 'closetab') {
        chrome.tabs.query({currentWindow: true, active: true}, (tab) => {
            chrome.tabs.remove(tab[0].id);
        });
    }
    else if (action === 'clonetab') {
        chrome.tabs.query( {currentWindow: true, active: true}, (tab) => {
            chrome.tabs.duplicate(tab[0].id);
        });
    }
    else if (action === 'onlytab') {
        chrome.tabs.query({currentWindow: true, pinned: false, active: false}, (tabs) => {
            var ids = [];
            tabs.forEach(function(tab) {
                ids.push(tab.id);
            });
            chrome.tabs.remove(ids);
        });
    }
    else if (action === 'closelefttabs' || action === 'closerighttabs') {
        chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
            let currentTabIndex = tabs[0].index;
            chrome.tabs.query({currentWindow: true, pinned: false, active: false}, (tabs) => {
                let ids = [];
                tabs.forEach(function(tab) {
                    if ((action === 'closelefttabs' && tab.index < currentTabIndex) ||
                        (action === 'closerighttabs' && tab.index > currentTabIndex)) {
                        ids.push(tab.id);
                    }
                });
                chrome.tabs.remove(ids);
            });
        });
    }
    else if (action === 'togglepin') {
        chrome.tabs.query({active: true, currentWindow: true}, (tab) => {
            var toggle = !tab[0].pinned;
            chrome.tabs.update(tab[0].id, { pinned: toggle });
        });
    }
    else if (action === 'copyurl') {
        copyToClipboard(request.text);
    }
    else if (action === 'movetableft') {
        if  (sender.tab.index > 0) {
            chrome.tabs.move(sender.tab.id, {'index': sender.tab.index -1});
        }
    }
    else if (action === 'movetabright') {
        chrome.tabs.move(sender.tab.id, {'index': sender.tab.index +1});
    }
    else if (action === 'gototab') {
        var createNewTab = function() {
            chrome.tabs.create({url: request.openurl});
        };
        if (request.matchurl) {
            var queryOption = {url: request.matchurl}
            if (request.currentWindow) {
                queryOption.currentWindow = true
            }
            chrome.tabs.query(queryOption, function (tabs) {
                if (tabs.length > 0) {
                    chrome.tabs.update(tabs[0].id, {selected: true});
                    chrome.windows.update(tabs[0].windowId, {focused: true});
                } else {
                    createNewTab();
                }
            });
        } else {
            createNewTab();
        }
    }
    else if (action === 'newwindow') {
      chrome.windows.create();
    }
    else if (action === 'newprivatewindow') {
      chrome.windows.create({incognito: true});
    }
    else if (action === 'closewindow') {
        chrome.tabs.query( {currentWindow: true, active: true}, (tab) => {
            chrome.windows.remove(tab[0].windowId);
        });
    }
    else if (action === 'openbookmark') {
        chrome.bookmarks.search({title: request.bookmark}, function (nodes) {
            var openNode;
            for (var i = nodes.length; i-- > 0;) {
                var node = nodes[i];
                if (node.url && node.title === request.bookmark) {
                    openNode = node;
                    break;
                }
            }
            chrome.tabs.update(sender.tab.id, {url: decodeURI(openNode.url)});
        });
    }
    else {
        sendResponse({});
    }
});

