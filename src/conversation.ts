import { query } from "@anthropic-ai/claude-agent-sdk";

// have a conversation with the agent about whatever the user inputs, and allow the agent to use tools to find the answers. The conversation will continue until the user types "exit".
let sessionId: string | undefined;
console.log(
    "Provide a topic for the conversation. Type 'exit' to end the conversation.",
);

let input: string = prompt("You: ") || "";

for await (const message of query({
    prompt: input,
    options: { allowedTools: ["GoogleSearch", "Read"] },
})) {
    if ("session_id" in message) sessionId = message.session_id;
    if ("result" in message) console.log(message.result);
}

while (true) {
    input = prompt("You: ") || "";
    if (input === "exit") break;

    for await (const message of query({
        prompt: input,
        options: { allowedTools: ["GoogleSearch", "Read"], resume: sessionId },
    })) {
        if ("result" in message) console.log(message.result);
    }
}
