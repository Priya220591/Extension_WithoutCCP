let agentInstance=null;
// Function to initialize the agent after a delay of 1 second
function initializeAgent() {
  
  if (window.connect && typeof window.connect.agent === "function") {
    console.log("Test Extension: Connect object and agent available");

    try {
      connect.agent(function (agent) {
        console.log("Agent callback triggered");
        console.log("Agent initialized:", agent);
        agentInstance=agent;
        const config = agent.getConfiguration();
          const agentName =
            config.firstName && config.lastName
              ? `${config.firstName} ${config.lastName}`
              : config.name;
          const agentUserName = agent.getConfiguration().username;
          console.log(agentName);
          console.log(agentUserName);
        connect.contact(function (contact) {
          console.log("New contact initiated:", contact);

          contact.onConnecting(function () {
            console.log("Test Extension: onConnecting Event");
            if (contact.isInbound()) {
              console.log("Call connecting");
              console.log(
                "the attributes are",
                JSON.stringify(contact.getAttributes())
              );
              const { AgentName, CallType } = contact.getAttributes();
              if (CallType.value === "InternalCalling") {
                chrome.runtime.sendMessage(
                  extensionId,
                  {
                    action: "sendAgentName",
                    agentName: AgentName ? AgentName.value : "Unknown Agent",
                  },
                  (response) => {
                    if (chrome.runtime.lastError) {
                      console.error(
                        "Error sending message:",
                        chrome.runtime.lastError
                      );
                    } else {
                      console.log(
                        "Response from background script:",
                        response
                      );
                    }
                  }
                );
                console.log("Caller ID div updated with incoming call info");
              } else {
                console.error("Caller ID not displayed in the div");
              }
            }
          });


          contact.onConnected(async function () {
            console.log("Test Extension: onConnected Event");
            if (!contact.isInbound()) {
              try {
                const updateAttributesParams = {
                  AgentName: agentName,
                  CallType: "InternalCalling",
                  ContactId: contact.getContactId(),
                  action: "update contact attribute",
                };
                await invokeLambda(updateAttributesParams);

                console.log("Attributes updated successfully");

                if (window.endpointMatched) {
                  console.log(
                    "inside window endpointmatched,",
                    window.endpointMatched
                  );

                  const currentContact = agentInstance.getContacts(
                    connect.ContactType.VOICE
                  )[0];
                  // Initiating transfer to the quick connect agent
                  console.log(agentName,agentUserName);
                  
                  await addConnectionAsync(
                    currentContact,
                    window.endpointMatched,agentUserName,agentName
                  );
                  console.log(agentName, window.endpointMatched.name);
                  console.log("Transfer success");
                  window.transferEndpoint = "";
                } else {
                  console.error("No transfer endpoint found");
                  // alert("No transfer endpoint available");
                }
              } catch (error) {
                console.error("Error during transfer or connection:", error);
                alert("Transfer failed");
              }
            } else {
              console.log("The contact is inbound");
            }
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


window.addEventListener("message",function(event){
if(event.data.action==="searchEndpoints"){
  const {firstName,lastName,extension}=event.data;
  console.log("Received search parameters");
  searchEndpoints(firstName,lastName,extension);
}
});
async function searchEndpoints(firstName,lastName,extension){  
  if(!agentInstance){
    console.error("Agent not initialized");
    return;
  }
  let searchValue = "";
    if (firstName) {
      searchValue = firstName;
    } else if (lastName) {
      searchValue = lastName;
    } else if (extension) {
      searchValue = extension;
    }

console.log("The search value is", searchValue);
let endpoints=[];
    if (searchValue) {
       endpoints = await getEndpointsAsync(
        agentInstance,
        agentInstance.getAllQueueARNs()
      );
    }
    if(endpoints.length>0){
    const endpointsMatched = endpoints.filter((endpoint) =>
      endpoint.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    console.log("the endpoint array is", JSON.stringify(endpointsMatched));
    displayResults(endpointsMatched);
  }
  else{
    displayNoResults();
  }
}
function getEndpointsAsync(agent, queueArns) {
  
  return new Promise((resolve, reject) => {
    agent.getEndpoints(queueArns, {
      success: function (data) {
        resolve(data.endpoints);
      },
      failure: function (err) {
        reject("Failed to get endpoints: " + err);
      },
    });
  });
}
function displayResults(endpoints) {
  // Find the existing results container (if any) and remove it
  let resultDiv = document.getElementById("result");
  if (!resultDiv) {
    resultDiv = document.createElement("div");
    resultDiv.id = "result";
    resultDiv.style.marginTop = "20px";
  } else {
    resultDiv.innerHTML = ''; // Clear previous results if any
  }

  // Create a list of endpoints
  const list = document.createElement("ul");

  endpoints.forEach((endpoint) => {
    const resultItem = document.createElement("li");
    resultItem.innerText = endpoint.name;
    const callButton = document.createElement("button");
          callButton.className = "call-button";
          callButton.innerText = "Call";
          callButton.type = "button";
          callButton.addEventListener("click", (e) => {
            e.stopPropagation();
            initiateCall(endpoint);
          });
          resultItem.append(callButton);
    list.appendChild(resultItem);
  });

  // Append the list to the results container
  resultDiv.appendChild(list);

  // Find the popup container to insert results into
  const popup = document.getElementById("searchPopup"); // Assuming your popup has an ID of 'popup'
  
  if (popup) {
    // Append the results container to the popup
    popup.appendChild(resultDiv);
  }
}

function displayNoResults() {
  // Find the existing results container (if any) and remove it
  let resultsContainer = document.getElementById("searchResults");
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.id = "searchResults";
    resultsContainer.style.marginTop = "20px";
  } else {
    resultsContainer.innerHTML = ''; // Clear previous results if any
  }

  // Display a message when no results are found
  const message = document.createElement("p");
  message.innerText = "No results found.";
  resultsContainer.appendChild(message);

  // Find the popup container to insert results into
  const popup = document.getElementById("popup"); // Assuming your popup has an ID of 'popup'
  
  if (popup) {
    // Append the no-results message to the popup
    popup.appendChild(resultsContainer);
  }
}
async function initiateCall(endpoint) {
  try {
    const instanceName="pacificspecialty-dev";
    console.log("Initiating call to endpoint:", endpoint);
    window.endpointMatched = endpoint;
    let outboundNumber = "";
    if (instanceName === "p3fusion-learning") {
      outboundNumber = "+18664438941";
    } else if (instanceName === "pacificspecialty-dev") {
      outboundNumber = "+18444511771";
    } else if (instanceName === "pacificspecialty-test") {
      outboundNumber = "+18337994550";
    } else if (instanceName === "pacificspecialty") {
      outboundNumber = "+18337995441";
    }

    const outboundEndpoint = connect.Endpoint.byPhoneNumber(outboundNumber);
    console.log("Outbound endpoint is:", outboundEndpoint);

    const contact = await agentInstance.connect(outboundEndpoint, {});
    console.log("Outbound call initiated successfully:", contact);
  } catch (error) {
    console.error("Error during outbound call initiation", error.message);
  }
}

async function invokeLambda(payload) {
  const instanceName = "pacificspecialty-dev";
  console.log("Lambda payload is", JSON.stringify(payload));
  let lambdaFunctionUrl = "";
  if (instanceName === "p3fusion-learning") {
    lambdaFunctionUrl =
      "https://slwofoswwbcc3wk4tnvkd4evje0eapmc.lambda-url.us-east-1.on.aws/";
  } else if (instanceName === "pacificspecialty-dev") {
    lambdaFunctionUrl =
      "https://izlxbnif5csvrh57henqkjkoiq0wfrlo.lambda-url.us-west-2.on.aws/";
  } else if (instanceName === "pacificspecialty-test") {
    lambdaFunctionUrl =
      "https://b6fpt23b2bowbcgffzjhtxltxq0sxrep.lambda-url.us-west-2.on.aws/";
  } else if (instanceName === "pacificspecialty") {
    lambdaFunctionUrl =
      "https://s7bwltsb6xxsvznefzfiuu6iya0jzlki.lambda-url.us-west-2.on.aws/";
  } else {
    lambdaFunctionUrl = "";
  }

  try {
    const response = await fetch(lambdaFunctionUrl, {
      method: "POST",
      // mode:'no-cors',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Lambda response:", data);
    return data;
  } catch (error) {
    console.error("Error invoking Lambda:", error);
    alert("Failed to update DynamoDB through Lambda");
    return {
      error: error.message || "Failed to update DynamoDB through Lambda",
    };
  }
}

// !!!!!!!!!!!!!!!Call destination Agent!!!!!!!!!!!!!!!!!!!!!!!!
async function addConnectionAsync(contact, endpoint,agentusername,agentname) {
  console.log("inside addconnection",agentname,agentusername);
  
  return new Promise((resolve, reject) => {
    contact.addConnection(endpoint, {
      success: async function (data) {
        console.log("Connection added:", data);
        await handleCallEvent( agentusername,
          agentname,
          contact,
          "Initiated",
          window.endpointMatched
            ? window.endpointMatched.name
            : null
        );
        window.transferEndpoint = "";
        window.endpointMatched="";
        console.log("endpoint after adding contact",window.endpointMatched);
        

        if (!agentInstance) {
          console.error("Agent is not initialized yet.");
          return reject("Agent instance is not available.");
        }
        resolve(data);
      },
      failure: function (err) {
        console.error("Failed to add connection:", err);
        reject(err);
      },
    });
  });
}
async function handleCallEvent(userName,fromAgent, contact, status, toAgent) {
  try {
    const agentUserName=userName;
    const contactId = contact.getContactId();
    const sourceAgentName = fromAgent;
    let timestamp_init;
    let timestamp_end;
    const destinationAgentName = toAgent;
    if (status === "Disconnected" || status === "no-answer") {
      timestamp_end = new Date().toISOString();
    } else {
      timestamp_init = new Date().toISOString();
    }

    const lambdaPayload = {
      agentUserName,
      contactId,
      destinationAgentName,
      sourceAgentName,
      status,
      timestamp_init,
      timestamp_end,
      action: "update table",
    };

    await invokeLambda(lambdaPayload);
    console.log(`DynamoDB updated with call status: ${status}`);
  } catch (error) {
    console.error(`Failed to update DynamoDB for event: ${status}`, error);
  }
}