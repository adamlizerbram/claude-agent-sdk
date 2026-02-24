import { query } from "@anthropic-ai/claude-agent-sdk";

// Log all message types to see what the SDK actually emits
const seen = new Set<string>();

for await (const message of query({
    prompt: "Search the web for the current weather in San Francisco.",
    options: {
        allowedTools: ["WebSearch", "WebFetch", "Read"] as string[],
        includePartialMessages: true,
    },
})) {
    const type =
        message.type === "stream_event"
            ? `stream_event:${(message as any).event?.type}`
            : message.type;

    if (!seen.has(type)) {
        seen.add(type);
        console.log(`\n--- ${type} ---`);
        console.log(JSON.stringify(message, null, 2).slice(0, 300));
    }
}
