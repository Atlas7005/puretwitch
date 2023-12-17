# Pure Twitch
Remove all the sexual content from Twitch.tv, such as bikini streams, twerking streams, and streamers that show too much cleavage.

## How it works
Whenever your browser asks Twitch for a list of streams on the Browse page, the extension will filter out any streams that are listed in the [blocklist](list.json) from the response.

## Installation
1. Download the latest version of [Pure Twitch](https://github.com/Atlas7005/puretwitch/releases/latest/download/puretwitch.zip) from the releases page.
2. Extract the zip file.
3. Open the extensions page in your browser.
4. Enable developer mode.
5. Click "Load unpacked extension".
6. Select the folder you extracted the zip file to.
7. Add `--silent-debugger-extension-api` to the end of your Chrome shortcut (after the quotes).
   1. If you don't do this, you will get a warning every time you open Twitch, and if you close the warning, the extension will not work.
8. Restart Chrome.
9. Enjoy!

## Missed a stream or accidentally blocked a safe streamer?
If I missed a stream or accidentally blocked a safe streamer, please [open an issue](https://github.com/Atlas7005/puretwitch/issues/new) and I will investigate.

## License
[GNU AGPLv3](https://choosealicense.com/licenses/agpl-3.0/)