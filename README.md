# tiktokScrapperConsolescript
A script allowing you to scrap data (description,date,url,number of likes,number of comments,number of saves) from a tiktok channel.

You can add a date limite by editing the code to add something like `await getVideoMetadata(date_limit:"2023-02-08");`

To run the script you have to select the video you want to start with and past the code inside the console (ctrl+shift+i to open the console).

You should now just wait for it to go throught the videos, collecting the data.

To stop the script you should past `window.stopTikTokScraper = "stop"` in the console. The result will automatically be download as a csv.
