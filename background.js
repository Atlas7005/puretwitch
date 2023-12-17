let debugee = null;
const addMode = false;
const debugMode = false;
const twitchRegex = /https:\/\/(www\.)?twitch\.tv\/directory\/.+/i;

let hiddenChannelIds;
function updateTubbers() {
    fetch('https://atlas7005.github.io/puretwitch/list.json')
        .then(response => response.json())
        .then(data => {
            hiddenChannelIds = data;
        }).catch(err => {
            console.log(err);
        });
};

function removeStreams(response, isGame) {
    const rawData = JSON.parse(response.response);
    const data = rawData.find((x) => x.extensions.operationName === 'DirectoryPage_Game' || x.extensions.operationName === 'BrowsePage_Popular').data;

    if (isGame) {
        if(!data.game.streams) return response;
        const filtered = data.game.streams.edges.filter((x) => !hiddenChannelIds.includes(x.node.broadcaster.id));
        const filteredOutUsernames = data.game.streams.edges.filter((x) => hiddenChannelIds.includes(x.node.broadcaster.id)).map((x) => x.node.broadcaster.displayName);
        console.log(`Hid ${data.game.streams.edges.length - filtered.length} stream${data.game.streams.edges.length - filtered.length === 1 ? '' : 's'}`, filteredOutUsernames);
        data.game.streams.edges = filtered;
        addMode === true && data.game.streams.edges.forEach((x) => {
            console.log(`${x.node.broadcaster.displayName} (${x.node.broadcaster.login}): ${x.node.broadcaster.id}`);
        });
    } else {
        if(!data.streams) return response;
        const filtered = data.streams.edges.filter((x) => !hiddenChannelIds.includes(x.node.broadcaster.id));
        const filteredOutUsernames = data.streams.edges.filter((x) => hiddenChannelIds.includes(x.node.broadcaster.id)).map((x) => x.node.broadcaster.displayName);
        console.log(`Hid ${data.streams.edges.length - filtered.length} stream${data.streams.edges.length - filtered.length === 1 ? '' : 's'}`, filteredOutUsernames);
        data.streams.edges = filtered;
        addMode === true && data.streams.edges.forEach((x) => {
            console.log(`${x.node.broadcaster.displayName} (${x.node.broadcaster.login}): ${x.node.broadcaster.id}`);
        });
    }

    rawData.forEach((x, idx, arr) => {
        if (x.extensions.operationName === 'DirectoryPage_Game') {
            rawData[idx].data.game.streams.edges = data.game.streams.edges;
        } else if (x.extensions.operationName === 'BrowsePage_Popular') {
            rawData[idx].data.streams.edges = data.streams.edges;
        }
    });

    response.response = JSON.stringify(rawData);
    
    return response;
};

function getHeaderString(headers) {
    let responseHeader = '';
    headers.forEach((header, key) => {
        responseHeader += key + ':' + header + '\n';
    });
    return responseHeader;
};

async function ajaxMe(url, headers, method, postData, success, error) {
    let finalResponse = {};
    let response = await fetch(url, {
        method,
        mode: 'cors',
        headers,
        redirect: 'follow',
        body: postData
    });
    finalResponse.response = await response.text();
    finalResponse.headers = getHeaderString(response.headers);
    if (response.ok) {
        success(finalResponse);
    } else {
        error(finalResponse);
    }
};

function startDebugger() {
    if(debugee) return console.log('Debugger already attached');
    chrome.tabs.query({}, function (tabs) {
        const tab = tabs.find((tab) => tab.url.match(twitchRegex));
        if(!tab) return console.log('No twitch tabs found');
        debugee = { tabId: tab.id };

        chrome.debugger.attach(debugee, "1.3", function () {
            chrome.debugger.sendCommand(debugee, "Fetch.enable", { patterns: [{ urlPattern: "https://gql.twitch.tv/gql" }] });
        });

        chrome.debugger.onEvent.addListener(function (source, method, params) {
            debugMode === true && console.log('Event', source, method, params);
            var request = params.request;
            var continueParams = {
                requestId: params.requestId
            };

            if(source.tabId === debugee.tabId && request.postData && (request.postData.toLowerCase().includes(`"operationname":"browsepage_popular"`) || request.postData.toLowerCase().includes(`"operationname":"directorypage_game"`))) {
                debugMode === true && console.log('Request intercepted', request);
                if(method === "Fetch.requestPaused") {
                    ajaxMe(request.url, request.headers, request.method, request.postData, function (response) {
                        let newReponse = removeStreams(response, request.postData.toLowerCase().includes(`"operationname":"directorypage_game"`));
                        continueParams.responseCode = 200;
                        continueParams.binaryResponseHeaders = btoa(unescape(encodeURIComponent(response.headers.replace(/(?:\r\n|\r|\n)/g, '\0'))));
                        continueParams.body = btoa(unescape(encodeURIComponent(newReponse.response)));
                        chrome.debugger.sendCommand(debugee, 'Fetch.fulfillRequest', continueParams);
                    }, function (status) {
                        chrome.debugger.sendCommand(debugee, 'Fetch.continueRequest', continueParams);
                    });
                }
            } else {
                chrome.debugger.sendCommand(debugee, 'Fetch.continueRequest', continueParams);
            }
        });
    });
};

function stopDebugger() {
    if (debugee) {
        chrome.debugger.detach(debugee);
        debugee = null;
    }
};

chrome.tabs.onCreated.addListener(function (tab) {
    if (tab.url.match(twitchRegex) && debugee === null) {
        startDebugger();
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.url.match(twitchRegex) && debugee === null && (changeInfo.status === 'complete' || changeInfo.status === 'loading')) {
        startDebugger();
    }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (debugee && tabId === debugee.tabId) {
        stopDebugger();
    }
});

chrome.debugger.onDetach.addListener(function (source, reason) {
    debugMode === true && console.log('Debugger detached', source, reason);
    if (debugee) {
        stopDebugger();
    }
});

updateTubbers();
setInterval(updateTubbers, 1000 * 60 * 3); // update every 3 minutes