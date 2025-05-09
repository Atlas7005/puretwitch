pureTwitch.log("Loaded!");

pureTwitch.fetchBlockedUsernames();
setInterval(() => {
    pureTwitch.fetchBlockedUsernames();
}, 1000 * 60 * 10); // 10 minutes

document.addEventListener("pathChange", main);

let watchers = {
    sidebar: null,
    directories: null,
    followingOverview: null,
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
                const directoryLinks = document.querySelectorAll(".tw-tower [data-target='']:not([style*='display: none']) a[data-test-selector='TitleAndChannel']:not([data-pt-processed]), .tw-tower [data-target='directory-first-item']:not([style*='display: none']) a[data-test-selector='TitleAndChannel']:not([data-pt-processed])");
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
                    const parent = link.closest("[data-target=''], [data-target='directory-first-item']");
                    if (link && parent && parent.style.display !== "none") {
                        if (parent.getAttribute("data-target") === "directory-first-item") {
                            let next = parent.nextElementSibling;
                            while (next && next.style.display === "none") {
                                next = next.nextElementSibling;
                            }
                            if (next) {
                                next.setAttribute("data-target", "directory-first-item");
                            }

                            parent.setAttribute("data-target", "");
                        }
                        parent.style.display = "none";
                        pureTwitch.log(`Removed ${username} from directory`);
                    }
                }
            });
            watchers.directories.observe(document.querySelector("[data-a-target='root-scroller']"), { childList: true, subtree: true });
            break;
        case routes.DIRECTORY_FOLLOWING:
            watchers.followingOverview = new MutationObserver(() => {
                const followingLiveLinks = document.querySelectorAll("#following-page-main-content > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > .tw-tower .live-channel-card a[data-test-selector='TitleAndChannel']:not([data-pt-processed])");
                // TODO: Add support for recommended channels section
                // const recommendedChannelLinks = document.querySelectorAll(".find-me > div:nth-child(2) > div:nth-child(1) > .tw-tower .shelf-card__impression-wrapper a[data-test-selector='TitleAndChannel']:not([data-pt-processed])");
                let usernames = new Set();

                for (const link of followingLiveLinks) {
                    const username = link.href.split("/").pop();
                    usernames.add(username);
                }

                const blockedUsernames = pureTwitch.batchBlockCheck([...usernames]);
                for (const { username, blocked } of blockedUsernames) {
                    const link = document.querySelector(`#following-page-main-content .tw-tower a[href$="${username}"]`);
                    if (!link) continue;
                    if (!link.hasAttribute("data-pt-processed")) link.setAttribute("data-pt-processed", "");
                    if (!blocked) continue;
                    const parent = link.closest(".live-channel-card").parentElement;
                    if (link && parent && parent.style.display !== "none") {
                        parent.style.display = "none";
                        pureTwitch.log(`Removed ${username} from following overview live section`);
                    }
                }
            });
            watchers.followingOverview.observe(document.querySelector("[data-a-target='root-scroller']"), { childList: true, subtree: true });
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