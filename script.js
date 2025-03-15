pureTwitch.log("Loaded!");

pureTwitch.fetchBlockedUsernames();
setInterval(() => {
    pureTwitch.fetchBlockedUsernames();
}, 1000 * 60 * 10); // 10 minutes

document.addEventListener("pathChange", main);

let watchers = {
    sidebar: null,
    directories: null,
};

async function main() {
    const route = pureTwitch.getRouteFromPath(location.pathname);
    Object.keys(watchers).forEach((key) => {
        if (watchers[key]) {
            watchers[key].disconnect();
            watchers[key] = null;
        }
    });

    // Global Sidebar Blocking
    watchers.sidebar = new MutationObserver(() => {
        const sidebarLinks = document.querySelectorAll(".side-nav-section a");
        let usernames = new Set();

        for (const link of sidebarLinks) {
            const username = link.href.split("/").pop();
            usernames.add(username);
        }

        const blockedUsernames = pureTwitch.batchBlockCheck([...usernames]);
        for (const { username, blocked } of blockedUsernames) {
            if (!blocked) continue;
            const link = document.querySelector(`.side-nav-section .tw-transition:not([style*='display: none']) a[href$="${username}"]`);
            if (!link) continue;
            const parent = link.closest(".tw-transition");
            if (link && parent && parent.style.display !== "none") {
                parent.style.display = "none";
                pureTwitch.log(`Removed ${username} from sidebar`);
            }
        }
    });
    watchers.sidebar.observe(document.getElementById("side-nav"), { childList: true, subtree: true });

    if (!route) return;
    pureTwitch.log(`Interpreting ${location.pathname} as ${route}`);

    switch (route) {
        case routes.HOMEPAGE:
            break;
        case routes.DIRECTORY_ALL:
        case routes.DIRECTORY_CATEGORY:
        case routes.DIRECTORY_COLLECTION:
            watchers.directories = new MutationObserver(() => {
                const directoryLinks = document.querySelectorAll(".tw-tower [data-target='']:not([style*='display: none']) a[data-test-selector='TitleAndChannel']:not([data-pt-processed])");
                let usernames = new Set();

                for (const link of directoryLinks) {
                    const username = link.href.split("/").pop();
                    usernames.add(username);
                }

                const blockedUsernames = pureTwitch.batchBlockCheck([...usernames]);
                for (const { username, blocked } of blockedUsernames) {
                    const link = document.querySelector(`.tw-tower a[href$="${username}"]`);
                    if (!link) continue;
                    if (!link.hasAttribute("data-pt-processed")) link.setAttribute("data-pt-processed", "");
                    if (!blocked) continue;
                    const parent = link.closest("[data-target='']");
                    if (link && parent && parent.style.display !== "none") {
                        parent.style.display = "none";
                        pureTwitch.log(`Removed ${username} from directory`);
                    }
                }
            });
            watchers.directories.observe(document.querySelector("[data-a-target='root-scroller']"), { childList: true, subtree: true });
            break;
        case routes.DIRECTORY_FOLLOWING:
            // TODO: Implement
            break;
        case routes.DIRECTORY_FOLLOWING_LIVE:
            // TODO: Implement
            break;
        case routes.DIRECTORY_FOLLOWING_VIDEOS:
            // TODO: Implement
            break;
        default:
            break;
    }
}

main();