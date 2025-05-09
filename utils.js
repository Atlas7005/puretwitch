const pathChangeEvent = new Event("pathChange");
let lastPath = location.pathname;
setInterval(() => {
    if (lastPath === location.pathname) return;
    lastPath = location.pathname;
    document.dispatchEvent(pathChangeEvent);
}, 100);

let routes = {
    HOMEPAGE: "HOMEPAGE",
    DIRECTORY_ALL: "DIRECTORY_ALL",
    DIRECTORY_CATEGORY: "DIRECTORY_CATEGORY",
    DIRECTORY_COLLECTION: "DIRECTORY_COLLECTION",
    DIRECTORY_FOLLOWING: "DIRECTORY_FOLLOWING",
    DIRECTORY_FOLLOWING_LIVE: "DIRECTORY_FOLLOWING_LIVE",
    DIRECTORY_FOLLOWING_VIDEOS: "DIRECTORY_FOLLOWING_VIDEOS",
};

let pathRegex = {
    [routes.HOMEPAGE]: /^\/$/,
    [routes.DIRECTORY_ALL]: /^\/directory\/all(?:\/.+)?/,
    [routes.DIRECTORY_CATEGORY]: /^\/directory\/category\/.+/,
    [routes.DIRECTORY_COLLECTION]: /^\/directory\/collection\/.+/,
    [routes.DIRECTORY_FOLLOWING]: /^\/directory\/following$/,
    [routes.DIRECTORY_FOLLOWING_LIVE]: /^\/directory\/following\/live$/,
    [routes.DIRECTORY_FOLLOWING_VIDEOS]: /^\/directory\/following\/videos$/,
};

let pureTwitch = {
    URL: `https://pure.atlasdev.men/?usernames=true`,
    usernameBlocklist: [],
    getRouteFromPath(path) {
        let route = null;
        for (const name of Object.keys(pathRegex)) {
            const regex = pathRegex[name];
            if (!regex.test(path)) continue;
            route = name;
            break;
        }

        return route;
    },
    fetchBlockedUsernames() {
        fetch(pureTwitch.URL)
            .then((response) => response.json())
            .then((data) => {
                pureTwitch.usernameBlocklist = data;
                pureTwitch.log("Blocked usernames fetched!");
            }).catch((error) => {
                pureTwitch.error("Failed to fetch blocked usernames:", error);
            });
    },
    isUsernameBlocked(username) {
        return pureTwitch.usernameBlocklist.includes(username.toLowerCase().trim());
    },
    batchBlockCheck(usernames) {
        return usernames.map((username) => {
            return {
                username: username,
                blocked: pureTwitch.isUsernameBlocked(username),
            };
        });
    },
    log(...message) {
        console.log(`%cPure Twitch`, "color: #252529; background-color: rgb(145, 70, 255); padding: 2px 4px; font-weight: 600; font-family: 'Arial'; border-radius: 2px;", ...message);
    },
    error(...message) {
        console.error(`%cPure Twitch`, "color: #252529; background-color: rgb(255, 53, 53); padding: 2px 4px; font-weight: 600; font-family: 'Arial'; border-radius: 2px;", ...message);
    }
};
