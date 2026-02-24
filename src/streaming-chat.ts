import { query } from "@anthropic-ai/claude-agent-sdk";

let sessionId: string | undefined;
console.log(
    "Provide a topic for the conversation. Type 'exit' to end the conversation.",
);

const sharedOptions = {
    allowedTools: ["WebSearch", "WebFetch", "Read"] as string[],
    includePartialMessages: true,
};

function handleStream(message: any) {
    if ("session_id" in message) sessionId = message.session_id;

    // Stream text chunks as they arrive
    if (
        message.type === "stream_event" &&
        message.event?.type === "content_block_delta" &&
        message.event.delta?.type === "text_delta"
    ) {
        process.stdout.write(message.event.delta.text);
    }

    // Print a newline after the final result
    if ("result" in message) console.log();
}

let input: string = prompt("You: ") || "";

for await (const message of query({
    prompt:
        "Research the following topic and provide a summary, and ask follow up questions about the topic: " +
        input,
    options: sharedOptions,
})) {
    handleStream(message);
}

while (true) {
    input = prompt("You: ") || "";
    if (input === "exit") break;

    for await (const message of query({
        prompt: input,
        options: { ...sharedOptions, resume: sessionId },
    })) {
        handleStream(message);
    }
}
