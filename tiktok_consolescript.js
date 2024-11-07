(async function() {
    // Initialize a global variable to control the stopping of the script
    // To stop the script, set 'window.stopTikTokScraper = "stop"';
    window.stopTikTokScraper = "";

    // Delay function to wait between actions
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Function to convert data to JSON format and trigger download
    function downloadJSON(data) {
        const jsonContent = JSON.stringify(data, null, 2); // format with indentation
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.setAttribute("hidden", "");
        a.setAttribute("href", url);
        a.setAttribute("download", "TikTok_Video_Metadata.json");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Function to parse the date from TikTok format to YYYY-MM-DD
    function convertToDate(dateText) {
        const today = new Date();
        let targetDate;
    
        if (dateText.includes("h")) {
            const hours = parseInt(dateText.split(" ")[3]);
            targetDate = new Date(today.getTime() - hours * 60 * 60 * 1000);
        } else if (dateText.includes("j")) {
            const days = parseInt(dateText.split(" ")[3]);
            targetDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
        } else if (dateText.includes("sem")) {
            const weeks = parseInt(dateText.split(" ")[3]);
            targetDate = new Date(today.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
        } else if ((dateText.match(/-/g) || []).length === 2) { 
            const [year, month, day] = dateText.split("-");
            targetDate = new Date(year, month - 1, day);
        } else if ((dateText.match(/-/g) || []).length === 1) { 
            const [month, day] = dateText.split("-");
            targetDate = new Date(today.getFullYear(), month - 1, day);
        } else {
            return "Invalid date format"; // Handle unexpected formats
        }
    
        // Format the date as YYYY-MM-DD
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(targetDate.getDate()).padStart(2, '0');
    
        return `${year}-${month}-${day}`;
    }

    // Main function to get video metadata
    async function getVideoMetadata() {
        let videoData = [];

        while (true) {
            // Check if the script should stop
            if (window.stopTikTokScraper === "stop") {
                console.log("Stopping script and downloading JSON...");
                break;
            }

            // Get the description
            const descriptionElem = document.querySelector('h1[data-e2e="browse-video-desc"]');
            const description = descriptionElem ? descriptionElem.innerText.trim() : "No description";

            // Get the date
            const dateElem = document.querySelector('span[data-e2e="browser-nickname"] span:nth-child(3)');
            const dateText = dateElem ? dateElem.innerText.trim() : "No date";

            // Convert the date to YYYY-MM-DD format
            const formattedDate = convertToDate(dateText);

            // Get the current page URL
            const videoUrl = window.location.href;

            // Get the likes, comments, and saves
            const likesElem = document.querySelector('strong[data-e2e="browse-like-count"]');
            const likes = likesElem ? likesElem.innerText.trim() : "0";
            const commentsElem = document.querySelector('strong[data-e2e="browse-comment-count"]');
            const comments = commentsElem ? commentsElem.innerText.trim() : "0";
            const savesElem = document.querySelector('strong[data-e2e="undefined-count"]');
            const saves = savesElem ? savesElem.innerText.trim() : "0";

            // Add to data array
            // console.log({ description, date: formattedDate, url: videoUrl, likes, comments, saves });
            videoData.push({ description, date: formattedDate, url: videoUrl, likes, comments, saves });

            // Click the next button
            const nextButton = document.querySelector('button[data-e2e="arrow-right"]');
            if (nextButton) {
                nextButton.click();
                await delay(2000); // Wait 2 seconds for the next video to load
            } else {
                console.log("No more videos found.");
                break;
            }
        }

        // Export filtered data to JSON if data was collected
        if (videoData.length > 0) {
            downloadJSON(videoData);
        } else {
            console.log("No data to export.");
        }
    }

    // Run the function
    await getVideoMetadata();
})();
