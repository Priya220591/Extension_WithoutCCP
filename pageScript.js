let agentInstance = null;
let instanceName = "";
// Function to initialize the agent after a delay of 1 second
function initializeAgent() {
 
  const interval = setInterval(()=>{
    if (window.connect && typeof window.connect.agent === "function") {
      console.log("Retrying");
      if(connect.agent){
 
      clearInterval(interval);
      console.log("Test Extension: Connect object and agent available");
     
      try {
        connect.agent(function (agent) {
          console.log("Agent initialized:", agent);
          agentInstance = agent;
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
                console.log(
                  "the attributes are",
                  JSON.stringify(contact.getAttributes())
                );
                const { AgentName, CallType } = contact.getAttributes();
                if (CallType.value === "InternalCalling") {
                  window.postMessage({
                    action: "SHOW_DIV",
                    agentName: AgentName ? AgentName.value : "Unknown Agent",
                  });
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
 
                    await addConnectionAsync(
                      currentContact,
                      window.endpointMatched,
                      agentUserName,
                      agentName
                    );
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
 
            contact.onMissed(async function () {
              console.log("Call was missed");
              const updateAttributesParams = {
                isMissed: "true",
                ContactId: contact.getContactId(),
                action: "update contact attribute",
              };
              console.log(
                "The update attribute params inside onmissed",
                updateAttributesParams
              );
 
              await invokeLambda(updateAttributesParams);
 
              console.log("Attributes updated successfully");
              // const sourceAgent = contact.getAttributes().AgentName;
              window.postMessage({
                action: "HIDE_DIV",
              });
            });
            contact.onEnded(function () {
              console.log("Test Extension: onEnded Event");
              try {
                window.postMessage({
                  action: "HIDE_DIV",
                });
 
                const activeContacts = agentInstance.getContacts(
                  connect.ContactType.VOICE
                );
                const connectedContacts = activeContacts.filter(
                  (contact) => contact.getStatus().type === "connected"
                );
                if (connectedContacts.length > 0) {
                  console.log(
                    "Other contacts are still connected. No action will be taken."
                  );
                  return;
                }
                const contactState = contact.getState().type;
                console.log("The contact state is", contactState);
 
                setTimeout(async () => {
                  console.log("first contact id is", contact.getContactId());
 
                  const secondContactId = contact.getAttributes().ContactId.value;
                  console.log("second contact id is", secondContactId);
                  const getAttributesParams = {
                    ContactId: secondContactId,
                    action: "get contact attributes",
                  };
 
                  const attributes = await invokeLambda(getAttributesParams);
                  const isMissed = attributes.Attributes?.isMissed;
                  console.log(
                    "The attributes of the second contact id are",
                    attributes
                  );
                  if (isMissed !== undefined) {
                    console.log("isMissed value is", isMissed);
                  } else {
                    console.log("isMissed value undefined");
                  }
                  if (isMissed === "true") {
                    await handleCallEvent(
                      "",
                      agentName,
                      contact,
                      "Missed",
                      window.endpointMatched ? window.endpointMatched.name : null
                    );
                  } else {
                    callStatus = "Disconnected";
                    console.log(
                      `Call ended with status: ${callStatus}, destination agent is ${window.endpointMatched.name}`
                    );
                    await handleCallEvent(
                      "",
                      agentName,
                      contact,
                      callStatus,
                      window.endpointMatched ? window.endpointMatched.name : null
                    );
                  }
                }, 700);
              } catch (error) {
                console.error("Error handling contact onEnded event:", error);
              }
            });
          });
        });
             
 
      } catch (error) {
        console.error("Error initializing agent:", error);
      }}
    } else {
      console.log("Waiting for connect.agent to be available...");
    }
  }, 200)
 
}

// Set a timeout of 1 second to attempt agent initialization
setTimeout(initializeAgent, 1000); // 1 second delay
async function displayQuickConnects() {
  console.log("Agent Instance:", agentInstance);
  try {
    const endPoints = await getEndpointsAsync(
      agentInstance,
      agentInstance.getAllQueueARNs()
    );
    console.log("Endpoints fetched:", endPoints);
 
    // Send the endPoints as a response message
    displayResults(endPoints)
  } catch (error) {
    console.error("Error fetching endpoints:", error);
  }   
}
window.postMessage({
  action: "getInstanceName",
});
window.addEventListener("message", function (event) {
  if (event.data.action === "searchEndpoints") {
    const { firstName, lastName, extension } = event.data;
    console.log("Received search parameters");
    searchEndpoints(firstName, lastName, extension);
  } else if (event.data.action === "sendInstanceName") {
    instanceName = event.data.instanceName;
  } else if (event.data.action === "popupOpened"){
    console.log("popup opened");
    displayQuickConnects();
  }
});
async function searchEndpoints(firstName, lastName, extension) {
  if (!agentInstance) {
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
  let endpoints = [];
  if (searchValue) {
    endpoints = await getEndpointsAsync(
      agentInstance,
      agentInstance.getAllQueueARNs()
    );
  }

  if (endpoints.length > 0) {
    const endpointMatched = endpoints.filter((endpoint) =>
      endpoint.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    console.log("the endpoint array is", JSON.stringify(endpointMatched));
    if (endpointMatched.length > 0) {
      displayResults(endpointMatched);
    } else {
      displayNoResults("User not found");
    }
  } else {
    displayNoResults("No Quick Connects assigned");
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
  const testEmployees = endpoints
  const popup = document.getElementById("searchPopup");
  const tableContainer = document.createElement("div");
  tableContainer.style.maxHeight = "300px"; // Max height for the scrollable table
  tableContainer.style.overflowY = "auto"; // Make it scrollable

  // Create the table to display employees
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.marginBottom = "10px";

  // Table body (this will be populated with employee names)
  const tableBody = document.createElement("tbody");
  table.appendChild(tableBody);
  tableContainer.appendChild(table);
  function renderTable(filteredEmployees) {
    tableBody.innerHTML = ''; // Clear existing rows

    filteredEmployees.forEach(employee => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.innerText = employee.name;

      const callCell = document.createElement("td");
      const callButton = document.createElement("button");
      callButton.innerText = "Call";
      callButton.style.padding = "5px 10px";
      callButton.style.borderRadius = "5px";
      callButton.style.backgroundColor = "#28a745";
      callButton.style.color = "#fff";
      callButton.style.border = "none";
      callButton.style.cursor = "pointer";
      callButton.addEventListener("click", () => initiateCall(employee));

      callCell.appendChild(callButton);
      row.appendChild(nameCell);
      row.appendChild(callCell);
      tableBody.appendChild(row);
    });
  }

  // Search functionality
  searchBox.addEventListener("input", () => {
    const searchValue = searchBox.value.toLowerCase();

    // Filter employees based on the search query
    const filteredEmployees = testEmployees.filter(employee =>
      employee.name.toLowerCase().includes(searchValue)
    );

    // Render the table with filtered employees
    renderTable(filteredEmployees);
  });

  // Initial render with all employees
  renderTable(testEmployees);
  popup.appendChild(tableContainer); // Scrollable table container

  // Append the popup to the body
  document.body.appendChild(popup);
  
}

function displayNoResults(message) {
  // Find the existing results container (if any) and remove it
  let resultDiv = document.getElementById("result");
  if (!resultDiv) {
    resultDiv = document.createElement("div");
    resultDiv.id = "result";
    resultDiv.style.marginTop = "20px";
  } else {
    resultDiv.innerHTML = ""; // Clear previous results if any
  }

  // Display a message when no results are found
  const messageContainer = document.createElement("p");
  messageContainer.innerText = message;

  resultDiv.appendChild(messageContainer);

  // Find the popup container to insert results into
  const popup = document.getElementById("searchPopup");

  if (popup) {
    // Append the no-results message to the popup
    popup.appendChild(resultDiv);
  }
}
async function initiateCall(endpoint) {
  try {
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
async function addConnectionAsync(contact, endpoint, agentusername, agentname) {
  return new Promise((resolve, reject) => {
    contact.addConnection(endpoint, {
      success: async function (data) {
        console.log("Connection added:", data);
        await handleCallEvent(
          agentusername,
          agentname,
          contact,
          "Initiated",
          window.endpointMatched ? window.endpointMatched.name : null
        );
        window.transferEndpoint = "";
        window.endpointMatched = "";
        console.log("endpoint after adding contact", window.endpointMatched);

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
async function handleCallEvent(userName, fromAgent, contact, status, toAgent) {
  try {
    const agentUserName = userName;
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
