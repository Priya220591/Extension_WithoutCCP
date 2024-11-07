// Inject pageScript.js into the page to access the `connect` object
const script = document.createElement("script");
script.src = chrome.runtime.getURL("pageScript.js");
(document.head || document.documentElement).appendChild(script);
script.onload = () => script.remove();

// Add a button to the DOM
const button = document.createElement("button");
button.id = "changeAgentStatusButton";
button.innerText = "Company Directory";
button.style.position = "fixed";
button.style.bottom = "10px";
button.style.right = "10px";
button.style.padding = "10px";
button.style.backgroundColor = "#4CAF50";
button.style.color = "#FFFFFF";
button.style.border = "none";
button.style.borderRadius = "5px";
button.style.cursor = "pointer";
button.style.zIndex = "1000";

// Append the button to the document body
document.body.appendChild(button);

// When button is clicked, send a message to the page script to change the agent status
button.addEventListener("click", () => {
    const outboundNumber = "+19255772384";  // Replace with the actual outbound number
    window.postMessage({ action: "makeOutboundCall", outboundNumber: outboundNumber }, "*");
});
