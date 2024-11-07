// Background script
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed and background script running");
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "contentScriptReady") {
        console.log("Content script is ready.");
        // Now you can safely send messages to the content script
    }
});

// Example function to send an action message to the content script
function changeAgentState(state) {
    chrome.tabs.query({ url: "https://*.connect.aws/*" }, (tabs) => {
        if (tabs.length > 0) {
            console.log("inside function");
            
            // Send message to content script on the tab where the CCP is running
            chrome.tabs.sendMessage(tabs[0].id, { 
                action: "performAction", 
                data: { state: state } 
            }, (response) => {
                if (response && response.status) {
                    console.log("Response from content script:", response.status);
                } else {
                    console.error("No response or error in message");
                }
            });
        } else {
            console.error("No active tab found with CCP running");
        }
    });
}
changeAgentState("Available");