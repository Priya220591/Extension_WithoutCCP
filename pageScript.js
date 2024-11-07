// Listen for messages from the content script
window.addEventListener("message", async (event) => {
  if (event.data.action === "makeOutboundCall") {
    const outboundNumber = event.data.outboundNumber;
    console.log("the outbound number obtained is", outboundNumber);

    // Ensure the `connect` object is available
    if (window.connect) {
      console.log("Test Extension: Making outbound call to", outboundNumber);

      // Ensure the CCP is initialized and we can interact with the agent
      connect.agent(function (agent) {
        console.log("Agent initialized:", agent);
        const config = agent.getConfiguration();
        const agentName =
          config.firstName && config.lastName
            ? `${config.firstName} ${config.lastName}`
            : config.name;
        const agentUserName = agent.getConfiguration().username;
        console.log(agentName);
        console.log(agentUserName);
        makeOutboundCall(agent, outboundNumber);
      });
      connect.contact(function (contact) {
        console.log("Test Extension: New contact initiated:", contact);
      contact.onConnected(async function () {
        console.log("Test Extension: onConnected event");
        
      });
      contact.onEnded(async function () {
        console.log("Test Extension: onEnded event");
        
      });
    });
    } else {
      console.error(
        "Amazon Connect 'connect' object not found. Ensure CCP is initialized."
      );
    }
  }
});
async function makeOutboundCall(agent, number) {
  const agentInstance = agent;
  const outboundEndpoint = connect.Endpoint.byPhoneNumber(number);
  console.log("Outbound endpoint is:", outboundEndpoint);

  const contact = await agentInstance.connect(outboundEndpoint, {});
  console.log("Outbound call initiated successfully:", contact);
}
