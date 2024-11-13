// Inject pageScript.js into the page to access the `connect` object
const script = document.createElement("script");
script.src = chrome.runtime.getURL("pageScript.js");
(document.head || document.documentElement).appendChild(script);
script.onload = () => {
  script.remove();
};
// content.js
const currentUrl = window.location.href;
const hostname = new URL(currentUrl).hostname;
const instance = hostname.split(".")[0];
console.log("Instance:", instance);
let firstName,
  lastName,
  extension = null;
// Add a button to the DOM
const button = document.createElement("button");
button.id = "myExtensionButton";
button.style.position = "fixed";
button.style.bottom = ".5vh"; // Relative to viewport height
button.style.left = ".5vw"; // Adjusted relative to viewport width
button.style.padding = "10px";
button.style.border = "none";
button.style.zIndex = "9999";
button.style.cursor = "pointer";
button.style.display = "block";
button.style.backgroundColor = "transparent";
button.style.outline = "none";

const logo = document.createElement("img");
logo.src = chrome.runtime.getURL("phone_logo.png");
logo.alt = "Logo";
logo.style.width = "35px";
logo.style.height = "35px";
button.appendChild(logo);

// Append the button to the document body
document.body.appendChild(button);

// When button is clicked, send a message to the page script to change the agent status
button.addEventListener("click", () => {
  const popup = document.getElementById("searchPopup");
  if (!popup) {
    openSearchPopup();
  }
});
function openSearchPopup() {
  window.postMessage(
    {
      action: "popupOpened",
    },
    "*"
  );
  // Create the popup container
  const popup = document.createElement("div");
  popup.id = "searchPopup";
  popup.style.position = "fixed";
  popup.style.top = "49.3%";
  popup.style.left = "39.9%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.backgroundColor = "#fff";
  popup.style.padding = "20px";
  popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
  popup.style.zIndex = "1001";
  popup.style.borderRadius = "17px";
  popup.style.width = "830px";
  popup.style.height = "auto"; // Adjust to fit content
  popup.style.border = "1px #b6bec9 solid";
  popup.style.cursor = "move"; // Make the popup draggable

  // Create a close button for the popup
  const closeButton = document.createElement("button");
  closeButton.innerText = "x";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
  closeButton.style.background = "transparent";
  closeButton.style.border = "none";
  closeButton.style.fontSize = "16px";
  closeButton.style.cursor = "pointer";
  closeButton.style.color = "#000";
  closeButton.addEventListener("click", () => {
    document.body.removeChild(popup);
  });

  // Create title area
  const title = document.createElement("h3");
  title.innerText = "Select User";
  title.style.paddingBottom = "10px";
  title.style.fontWeight = "bold";
  title.style.cursor = "move"; // Make the title area draggable

  // Create a search box to filter employee names
  const searchBox = document.createElement("input");
  searchBox.type = "text";
  searchBox.id = "searchBox";
  searchBox.placeholder = "Search user...";
  searchBox.style.width = "100%";
  searchBox.style.height = "40px";
  searchBox.style.marginBottom = "10px";
  searchBox.style.padding = "5px";
  searchBox.style.borderRadius = "5px";
  searchBox.style.border = "1px solid #ccc";

  

  // Append elements to the popup
  popup.appendChild(title);
  popup.appendChild(closeButton);
  popup.appendChild(searchBox);

  // Append the popup to the body
  document.body.appendChild(popup);
  // makePopupDraggable(popup, title);
  // function makePopupDraggable(popup, dragHandle) {
  //   let isDragging = false;
  //   let offsetX = 0;
  //   let offsetY = 0;
  
  //   // When the user clicks on the drag handle (title area)
  //   dragHandle.addEventListener('mousedown', function(e) {
  //     isDragging = true;
  //     offsetX = e.clientX - popup.offsetLeft;
  //     offsetY = e.clientY - popup.offsetTop;
  //     popup.style.cursor = 'grabbing'; // Change the cursor to indicate dragging
  //   });
  
  //   // When the user moves the mouse while holding the mouse button down
  //   document.addEventListener('mousemove', function(e) {
  //     if (isDragging) {
  //       // Update the popup's position based on mouse movement
  //       popup.style.left = e.clientX - offsetX + 'px';
  //       popup.style.top = e.clientY - offsetY + 'px';
  //     }
  //   });
  
  //   // When the user releases the mouse button, stop dragging
  //   document.addEventListener('mouseup', function() {
  //     isDragging = false;
  //     popup.style.cursor = 'move'; // Reset the cursor when dragging stops
  //   });
  // }
  
}

window.addEventListener("message", (event) => {
  if (event.source === window && event.data.action === "SHOW_DIV") {
    let callerIdDiv = document.getElementById("myDynamicDiv");
    if (!callerIdDiv) {
      callerIdDiv = document.createElement("div");
      callerIdDiv.id = "myDynamicDiv";

      callerIdDiv.style.position = "absolute";
      callerIdDiv.style.top = "350px";
      callerIdDiv.style.left = "0px";
      callerIdDiv.style.width = "318px";
      callerIdDiv.style.height = "62px";
      callerIdDiv.style.alignItems = "center";
      callerIdDiv.style.fontWeight = "bold";
      callerIdDiv.style.color = "#FFFFFF";
      callerIdDiv.style.backgroundColor = "#077398";
      // callerIdDiv.style.border = "1px solid #ccc";
      callerIdDiv.style.padding = "10px";
      // callerIdDiv.style.borderRadius = "8px";
      callerIdDiv.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
      callerIdDiv.style.zIndex = "9999";

      // Append the div to the body
      document.body.appendChild(callerIdDiv);
    }
    callerIdDiv.innerText = `Call from ${event.data.agentName}`; // Display the agent name dynamically
    callerIdDiv.style.display = "flex";
    // sendResponse({ status: "Div displayed with agent name" });
  } else if (event.data.action === "HIDE_DIV") {
    const dynamicDiv = document.getElementById("myDynamicDiv");

    if (dynamicDiv) {
      dynamicDiv.style.display = "none"; // Hide the div
      dynamicDiv.style.setProperty("display", "none", "important");

      console.log(window.getComputedStyle(dynamicDiv).display);
      // sendResponse({ status: "Div hidden successfully" });
    } else {
      console.log("Div not found");
      // sendResponse({ status: "Div not found" });
    }
  } else if (event.data.action === "getInstanceName") {
    window.postMessage({ action: "sendInstanceName", instanceName: instance });
  }
});

function sendMessage(firstName, lastName, extension) {
  //  firstName = firstNameInput.value;
  //     lastName = lastNameInput.value;
  //      extension = extensionInput.value;
  window.postMessage(
    {
      action: "searchEndpoints",
      firstName: firstName,
      lastName: lastName,
      extension: extension,
    },
    "*"
  );
}
