import { query } from "@anthropic-ai/claude-agent-sdk";
import chalk from "chalk";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

marked.use(markedTerminal() as any);

const youLabel = chalk.bold.yellow("You: ");
const agentLabel = chalk.bold.magenta("Agent: ");

let sessionId: string | undefined;
console.log(
    "Provide a topic for the conversation. Type 'exit' to end the conversation.",
);

const sharedOptions = {
    allowedTools: ["WebSearch", "WebFetch", "Read"] as string[],
    includePartialMessages: true,
};

let chunks: string[] = [];
let lineCount = 0;

function handleStream(message: any) {
    if ("session_id" in message) sessionId = message.session_id;

    // Stream text chunks as they arrive
    if (
        message.type === "stream_event" &&
        message.event?.type === "content_block_delta" &&
        message.event.delta?.type === "text_delta"
    ) {
        const text = message.event.delta.text;
        chunks.push(text);
        process.stdout.write(text);
        lineCount += (text.match(/\n/g) || []).length;
    }

    // Re-render with formatted markdown once complete
    if ("result" in message) {
        // Move cursor up and clear the raw streamed text
        process.stdout.write(`\x1b[${lineCount + 1}A\x1b[0J`);
        // Render formatted markdown
        const formatted = marked.parse(chunks.join("")) as string;
        process.stdout.write(agentLabel + formatted.trimEnd() + "\n");
        chunks = [];
        lineCount = 0;
    }
}

let input: string = prompt(youLabel) || "";
console.log();

for await (const message of query({
    prompt:
        "Research the following topic and provide a summary, and ask follow up questions about the topic. Be concise and clear: " +
        input,
    options: sharedOptions,
})) {
    handleStream(message);
}

while (true) {
    console.log();
    input = prompt(youLabel) || "";
    if (input === "exit") break;
    console.log();

    for await (const message of query({
        prompt: input,
        options: { ...sharedOptions, resume: sessionId },
    })) {
        handleStream(message);
    }
}
