// Inject pageScript.js into the page to access the `connect` object
const script = document.createElement("script");
script.src = chrome.runtime.getURL("pageScript.js");
(document.head || document.documentElement).appendChild(script);
script.onload = () => { script.remove();
    window.postMessage({action: "initializeCCP"});
}

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
    openSearchPopup();
});
function openSearchPopup() {
    // Create the popup container
    const popup = document.createElement("div");
    popup.id = "searchPopup";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.backgroundColor = "#fff";
    popup.style.padding = "20px";
    popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
    popup.style.zIndex = "1001";
    popup.style.borderRadius = "10px";
    
    // Create a close button for the popup
    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.style.marginBottom = "10px";
    closeButton.addEventListener("click", () => {
      document.body.removeChild(popup);
    });
  
    // Create input fields for First Name, Last Name, and Extension
    const firstNameLabel = document.createElement("label");
    firstNameLabel.innerText = "First Name:";
    const firstNameInput = document.createElement("input");
    firstNameInput.type = "text";
    firstNameInput.id = "firstName";
    firstNameInput.placeholder = "Enter first name...";
  
    const lastNameLabel = document.createElement("label");
    lastNameLabel.innerText = "Last Name:";
    const lastNameInput = document.createElement("input");
    lastNameInput.type = "text";
    lastNameInput.id = "lastName";
    lastNameInput.placeholder = "Enter last name...";
  
    const extensionLabel = document.createElement("label");
    extensionLabel.innerText = "Extension:";
    const extensionInput = document.createElement("input");
    extensionInput.type = "text";
    extensionInput.id = "extension";
    extensionInput.placeholder = "Enter extension...";
  
    // Create a search button
    const searchButton = document.createElement("button");
    searchButton.innerText = "Search";
    searchButton.addEventListener("click", () => {
      const firstName = firstNameInput.value;
      const lastName = lastNameInput.value;
      const extension = extensionInput.value;
  
      window.postMessage({
        action: "searchEndpoints",
        firstName: firstName,
        lastName: lastName,
        extension: extension
      }, "*");
  
      // Close the popup after search
      document.body.removeChild(popup);
    });
  
    // Append elements to the popup
    popup.appendChild(closeButton);
    popup.appendChild(firstNameLabel);
    popup.appendChild(firstNameInput);
    popup.appendChild(lastNameLabel);
    popup.appendChild(lastNameInput);
    popup.appendChild(extensionLabel);
    popup.appendChild(extensionInput);
    popup.appendChild(searchButton);
  
    // Append the popup to the body
    document.body.appendChild(popup);
  }