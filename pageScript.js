// Function to initialize the agent after a delay of 1 second
function initializeAgent() {
  if (window.connect && typeof window.connect.agent === "function") {
    console.log("Test Extension: Connect object and agent available");

    try {
      connect.agent(function (agent) {
        console.log("Agent callback triggered");
        console.log("Agent initialized:", agent);
        connect.contact(function (contact) {
          console.log("New contact initiated:", contact);

          contact.onConnecting(function () {
            console.log("Test Extension: onConnecting Event");
          });
          contact.onConnected(function () {
            console.log("Test Extension: onConnected Event");
          });
          contact.onEnded(function () {
            console.log("Test Extension: onEnded Event");
          });
        });
      });
    } catch (error) {
      console.error("Error initializing agent:", error);
    }
  } else {
    console.log("Waiting for connect.agent to be available...");
  }
}

// Set a timeout of 1 second to attempt agent initialization
setTimeout(initializeAgent, 1000); // 1 second delay
