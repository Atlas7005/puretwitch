let debuggees = {};
let version = chrome.runtime.getManifest().version;
let handledIds = {};
const debugMode = false;
const twitchRegex = /https:\/\/(www\.)?twitch\.tv\/.+/i;

let hiddenChannelIds;
function updateStreamers() {
    fetch("https://atlas7005.github.io/puretwitch/list.json")
        .then(response => response.text())
        .then(data => {
            hiddenChannelIds = JSON.parse(data.replace(/\/\/.+/g, ""));
        }).catch(err => {
            console.error(err);
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
            console.error(err);
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
        if(data.personalSections[2] && data.personalSections[2].items) {
            const filteredSimilar = data.personalSections[2].items.filter((x) => !hiddenChannelIds.includes(x.user.id));
            const filteredSimilarUsernames = data.personalSections[2].items.filter((x) => hiddenChannelIds.includes(x.user.id)).map((x) => x.user.displayName);
            console.log(`Filtered ${data.personalSections[2].items.length - filteredSimilar.length} similar stream${data.personalSections[2].items.length - filteredSimilar.length === 1 ? "" : "s"} (PersonalSections[2])`, filteredSimilarUsernames);
            data.personalSections[2].items = filteredSimilar;
        }
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
    if(!Array.isArray(rawData)) return response;
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

function startDebugger(tabId) {
    if(debuggees[tabId]) return console.log("Debugger already attached to", tabId);
    chrome.tabs.get(tabId, function (tab) {
        if(!tab) return console.log("No twitch tabs found");
        debuggees[tabId] = { tabId: tab.id };
        handledIds[tabId] = new Set();

        chrome.debugger.attach(debuggees[tabId], "1.3", function () {
            chrome.debugger.sendCommand(debuggees[tabId], "Fetch.enable", { patterns: [{ urlPattern: "https://gql.twitch.tv/gql" }] }).catch((err) => {
                console.error(err);
            });
        });

        chrome.debugger.onEvent.addListener(function (source, method, params) {
            debugMode === true && console.log("Event", source, method, params);
            var request = params.request;
            var continueParams = {
                requestId: params.requestId
            };

            if(source.tabId === debuggees[tabId].tabId && request.postData) {
                if(method === "Fetch.requestPaused") {
                    debugMode === true && console.log("Request intercepted", request);
                    ajaxMe(request.url, request.headers, request.method, request.postData, function (response) {
                        let newReponse = removeStreams(response);
                        continueParams.responseCode = 200;
                        continueParams.binaryResponseHeaders = btoa(unescape(encodeURIComponent(response.headers.replace(/(?:\r\n|\r|\n)/g, "\0"))));
                        continueParams.body = btoa(unescape(encodeURIComponent(newReponse.response)));
                        if(!handledIds[tabId].has(params.requestId)) {
                            chrome.debugger.sendCommand(debuggees[tabId], "Fetch.fulfillRequest", continueParams).catch((err) => {
                                console.error(err);
                            });
                            handledIds[tabId].add(params.requestId);
                        } else {
                            chrome.debugger.sendCommand(debuggees[tabId], "Fetch.continueRequest", continueParams).catch((err) => {
                                console.error(err);
                            });
                        }
                    }, function (status) {
                        console.error("Error", status, request);
                        if (!handledIds[tabId].has(request.requestId)) {
                            chrome.debugger.sendCommand(debuggees[tabId], "Fetch.continueRequest", continueParams).catch((err) => {
                                console.error(err);
                            });
                            handledIds[tabId].add(request.requestId);
                        }
                    });
                }
            } else {
                chrome.debugger.sendCommand(debuggees[tabId], "Fetch.continueRequest", continueParams).catch((err) => {
                    console.error(err);
                });
            }
        });
    });
};

function stopDebugger(tabId) {
    if (debuggees[tabId]) {
        chrome.debugger.detach(debuggees[tabId]).catch((err) => {
            console.error(err);
        });
        delete debuggees[tabId];
        handledIds[tabId].clear();
        delete handledIds[tabId];
    }
};

chrome.tabs.onCreated.addListener(function (tab) {
    debugMode === true && console.log("Tab created", tab);
    if (tab.url.match(twitchRegex) && debuggees[tab.id] == null) {
        startDebugger(tab.id);
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    debugMode === true && console.log("Tab updated", tabId, changeInfo, tab);
    if (tab.url.match(twitchRegex) && debuggees[tabId] == null && (changeInfo.status === "complete" || changeInfo.status === "loading")) {
        startDebugger(tabId);
    }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    debugMode === true && console.log("Tab removed", tabId, removeInfo);
    if (debuggees[tabId] && tabId === debuggees[tabId].tabId) {
        stopDebugger(tabId);
    }
});

chrome.debugger.onDetach.addListener(function (source, reason) {
    debugMode === true && console.log("Debugger detached", source, reason);
    if (debuggees[source.tabId]) {
        delete debuggees[tabId];
    }

    if (handledIds[source.tabId]) {
        handledIds[source.tabId].clear();
        delete handledIds[source.tabId];
    }
});

updateStreamers();
setInterval(updateStreamers, 1000 * 60 * 3); // update every 3 minutes
checkForUpdates();
setInterval(checkForUpdates, 1000 * 60 * 60); // check for updates every hour