import { query } from "@anthropic-ai/claude-agent-sdk";

// have a conversation with the agent about whatever the user inputs, and allow the agent to use tools to find the answers. The conversation will continue until the user types "exit".
let sessionId: string | undefined;
console.log(
    "Provide a topic for the conversation. Type 'exit' to end the conversation.",
);

let input: string = prompt("You: ") || "";

console.log("Thinking...");
for await (const message of query({
    prompt:
        "Research the following topic and provide a summary, and ask follow up questions about the topic: " +
        input,
    options: { allowedTools: ["WebSearch", "WebFetch", "Read"] },
})) {
    if ("session_id" in message) sessionId = message.session_id;
    if ("result" in message) console.log("Agent:", message.result);
}

while (true) {
    input = prompt("You: ") || "";
    if (input === "exit") break;

    console.log("Thinking...");
    for await (const message of query({
        prompt: input,
        options: {
            allowedTools: ["WebSearch", "WebFetch", "Read"],
            resume: sessionId,
        },
    })) {
        if ("result" in message) console.log("Agent:", message.result);
    }
}
