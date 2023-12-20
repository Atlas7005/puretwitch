let debugee = null;
let version = chrome.runtime.getManifest().version;
const debugMode = false;
const twitchRegex = /https:\/\/(www\.)?twitch\.tv\/.+/i;

let hiddenChannelIds;
function updateTubbers() {
    fetch("https://atlas7005.github.io/puretwitch/list.json")
        .then(response => response.text())
        .then(data => {
            hiddenChannelIds = JSON.parse(data.replace(/\/\/.+/g, ""));
        }).catch(err => {
            console.log(err);
        });
};

function checkForUpdates() {
    fetch("https://api.github.com/repos/atlas7005/puretwitch/releases/latest")
        .then(response => response.json())
        .then(data => {
            if(isNewerVersion(version, data.tag_name.replace("v", ""))) {
                chrome.notifications.create({
                    type: "basic",
                    title: "Pure Twitch",
                    iconUrl: "logo.png",
                    message: `Update available: ${data.name}`
                });
            }
        }).catch(err => {
            console.log(err);
        });
};

function isNewerVersion (oldVer, newVer) {
    const oldParts = oldVer.split('.')
    const newParts = newVer.split('.')
    for (var i = 0; i < newParts.length; i++) {
        const a = ~~newParts[i] // parse int
        const b = ~~oldParts[i] // parse int
        if (a > b) return true
        if (a < b) return false
    }
    return false
};

const operationFilters = {
    "DirectoryPage_Game": (data) => {
        if(!data.game.streams) return data;
        const filtered = data.game.streams.edges.filter((x) => !hiddenChannelIds.includes(x.node.broadcaster.id));
        const filteredOutUsernames = data.game.streams.edges.filter((x) => hiddenChannelIds.includes(x.node.broadcaster.id)).map((x) => x.node.broadcaster.displayName);
        console.log(`Filtered ${data.game.streams.edges.length - filtered.length} stream${data.game.streams.edges.length - filtered.length === 1 ? "" : "s"} (DirectoryPage_Game)`, filteredOutUsernames);
        data.game.streams.edges = filtered;
        return data;
    },
    "BrowsePage_Popular": (data) => {
        if(!data.streams) return data;
        const filtered = data.streams.edges.filter((x) => !hiddenChannelIds.includes(x.node.broadcaster.id));
        const filteredOutUsernames = data.streams.edges.filter((x) => hiddenChannelIds.includes(x.node.broadcaster.id)).map((x) => x.node.broadcaster.displayName);
        console.log(`Filtered ${data.streams.edges.length - filtered.length} stream${data.streams.edges.length - filtered.length === 1 ? "" : "s"} (BrowsePage_Popular)`, filteredOutUsernames);
        data.streams.edges = filtered;
        return data;
    },
    "PersonalSections": (data) => {
        if(!data.personalSections) return data;
        const filteredFollowed = data.personalSections[0].items.filter((x) => !hiddenChannelIds.includes(x.user.id));
        const filteredFollowedUsernames = data.personalSections[0].items.filter((x) => hiddenChannelIds.includes(x.user.id)).map((x) => x.user.displayName);
        const filteredRecommended = data.personalSections[1].items.filter((x) => !hiddenChannelIds.includes(x.user.id));
        const filteredRecommendedUsernames = data.personalSections[1].items.filter((x) => hiddenChannelIds.includes(x.user.id)).map((x) => x.user.displayName);
        console.log(`Filtered ${data.personalSections[0].items.length - filteredFollowed.length} followed stream${data.personalSections[0].items.length - filteredFollowed.length === 1 ? "" : "s"} (PersonalSections[0]`, filteredFollowedUsernames);
        console.log(`Filtered ${data.personalSections[1].items.length - filteredRecommended.length} recommended stream${data.personalSections[1].items.length - filteredRecommended.length === 1 ? "" : "s"} (PersonalSections[1])`, filteredRecommendedUsernames);
        data.personalSections[0].items = filteredFollowed;
        data.personalSections[1].items = filteredRecommended;
        return data;
    },
    "FollowingLive_CurrentUser": (data) => {
        if(!data?.currentUser?.followedLiveUsers?.edges) return data;
        const filtered = data.currentUser.followedLiveUsers.edges.filter((x) => !hiddenChannelIds.includes(x.node.id));
        const filteredOutUsernames = data.currentUser.followedLiveUsers.edges.filter((x) => hiddenChannelIds.includes(x.node.id)).map((x) => x.node.displayName);
        console.log(`Filtered ${data.currentUser.followedLiveUsers.edges.length - filtered.length} stream${data.currentUser.followedLiveUsers.edges.length - filtered.length === 1 ? "" : "s"} (FollowingLive_CurrentUser)`, filteredOutUsernames);
        data.currentUser.followedLiveUsers.edges = filtered;
        return data;
    },
    "FollowedVideos_CurrentUser": (data) => {
        if(!data?.currentUser?.followedVideos?.edges) return data;
        const filtered = data.currentUser.followedVideos.edges.filter((x) => !hiddenChannelIds.includes(x.node.owner.id));
        const filteredOutUsernames = data.currentUser.followedVideos.edges.filter((x) => hiddenChannelIds.includes(x.node.owner.id)).map((x) => x.node.owner.displayName);
        console.log(`Filtered ${data.currentUser.followedVideos.edges.length - filtered.length} stream${data.currentUser.followedVideos.edges.length - filtered.length === 1 ? "" : "s"} (FollowedVideos_CurrentUser)`, filteredOutUsernames);
        data.currentUser.followedVideos.edges = filtered;
        return data;
    },
    "FollowingPage_RecommendedChannels": (data) => {
        if(!data?.currentUser?.recommendations?.liveRecommendations?.edges) return data;
        const filtered = data.currentUser.recommendations.liveRecommendations.edges.filter((x) => !hiddenChannelIds.includes(x.node.broadcaster.id));
        const filteredOutUsernames = data.currentUser.recommendations.liveRecommendations.edges.filter((x) => hiddenChannelIds.includes(x.node.broadcaster.id)).map((x) => x.node.broadcaster.displayName);
        console.log(`Filtered ${data.currentUser.recommendations.liveRecommendations.edges.length - filtered.length} stream${data.currentUser.recommendations.liveRecommendations.edges.length - filtered.length === 1 ? "" : "s"} (FollowingPage_RecommendedChannels)`, filteredOutUsernames);
        data.currentUser.recommendations.liveRecommendations.edges = filtered;
        return data;
    },
    "FollowedStreamsContinueWatching": (data) => {
        if(!data?.currentUser?.viewedVideos?.edges) return data;
        const filtered = data.currentUser.viewedVideos.edges.filter((x) => !hiddenChannelIds.includes(x.node.owner.id));
        const filteredOutUsernames = data.currentUser.viewedVideos.edges.filter((x) => hiddenChannelIds.includes(x.node.owner.id)).map((x) => x.node.owner.displayName);
        console.log(`Filtered ${data.currentUser.viewedVideos.edges.length - filtered.length} stream${data.currentUser.viewedVideos.edges.length - filtered.length === 1 ? "" : "s"} (FollowedStreamsContinueWatching)`, filteredOutUsernames);
        data.currentUser.viewedVideos.edges = filtered;
        return data;
    },
    "FollowedStreams": (data) => {
        if(!data?.followedUpcomingStreams?.edges) return data;
        const filtered = data.followedUpcomingStreams.edges.filter((x) => !hiddenChannelIds.includes(x.node.channel.owner.id));
        const filteredOutUsernames = data.followedUpcomingStreams.edges.filter((x) => hiddenChannelIds.includes(x.node.channel.owner.id)).map((x) => x.node.channel.owner.displayName);
        console.log(`Filtered ${data.followedUpcomingStreams.edges.length - filtered.length} stream${data.followedUpcomingStreams.edges.length - filtered.length === 1 ? "" : "s"} (FollowedStreams)`, filteredOutUsernames);
        data.followedUpcomingStreams.edges = filtered;
        return data;
    }
};

function removeStreams(response) {
    const rawData = JSON.parse(response.response);
    const types = rawData.map((x) => x.extensions.operationName);

    types.forEach((type, index) => {
        if(operationFilters[type]) {
            rawData[index].data = operationFilters[type](rawData[index].data);
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
        mode: "cors",
        headers,
        redirect: "follow",
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
    if(debugee) return console.log("Debugger already attached");
    chrome.tabs.query({}, function (tabs) {
        const tab = tabs.find((tab) => tab.url.match(twitchRegex));
        if(!tab) return console.log("No twitch tabs found");
        debugee = { tabId: tab.id };

        chrome.debugger.attach(debugee, "1.3", function () {
            chrome.debugger.sendCommand(debugee, "Fetch.enable", { patterns: [{ urlPattern: "https://gql.twitch.tv/gql" }] });
        });

        chrome.debugger.onEvent.addListener(function (source, method, params) {
            debugMode === true && console.log("Event", source, method, params);
            var request = params.request;
            var continueParams = {
                requestId: params.requestId
            };

            if(source.tabId === debugee.tabId && request.postData) {
                if(method === "Fetch.requestPaused") {
                    debugMode === true && console.log("Request intercepted", request);
                    ajaxMe(request.url, request.headers, request.method, request.postData, function (response) {
                        let newReponse = removeStreams(response);
                        continueParams.responseCode = 200;
                        continueParams.binaryResponseHeaders = btoa(unescape(encodeURIComponent(response.headers.replace(/(?:\r\n|\r|\n)/g, "\0"))));
                        continueParams.body = btoa(unescape(encodeURIComponent(newReponse.response)));
                        chrome.debugger.sendCommand(debugee, "Fetch.fulfillRequest", continueParams);
                    }, function (status) {
                        console.log("Error", status, request);
                        chrome.debugger.sendCommand(debugee, "Fetch.continueRequest", continueParams);
                    });
                }
            } else {
                chrome.debugger.sendCommand(debugee, "Fetch.continueRequest", continueParams);
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
    if (tab.url.match(twitchRegex) && debugee === null && (changeInfo.status === "complete" || changeInfo.status === "loading")) {
        startDebugger();
    }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (debugee && tabId === debugee.tabId) {
        stopDebugger();
    }
});

chrome.debugger.onDetach.addListener(function (source, reason) {
    debugMode === true && console.log("Debugger detached", source, reason);
    if (debugee) {
        stopDebugger();
    }
});

updateTubbers();
setInterval(updateTubbers, 1000 * 60 * 3); // update every 3 minutes
checkForUpdates();
setInterval(checkForUpdates, 1000 * 60 * 60 * 1); // check for updates every 1 hour