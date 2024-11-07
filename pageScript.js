let retries = 0;
const maxRetries = 10; // Limit retries to avoid infinite loop
const retryInterval = 300; // Retry every 300ms

const checkAgentInterval = setInterval(() => {
  retries++;
  
  if (window.connect && typeof window.connect.agent === 'function') {
    console.log("Test Extension: Connect object and agent available");

    try {
      connect.agent(function (agent) {
        console.log("Agent callback triggered");
        console.log("Agent initialized:", agent);

        // Stop retrying once agent is initialized
        clearInterval(checkAgentInterval);
      });
    } catch (error) {
      console.error("Error initializing agent:", error);
    }
  } else {
    console.log("Waiting for connect.agent to be available...");
  }

  if (retries >= maxRetries) {
    clearInterval(checkAgentInterval);
    console.error("Max retries reached, connect.agent not available.");
  }
}, retryInterval);
