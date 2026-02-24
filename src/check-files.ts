import { query } from "@anthropic-ai/claude-agent-sdk";

// First turn — ask about files in the directory
let sessionId: string | undefined;

for await (const message of query({
    prompt: "What files are in this directory?",
    options: { allowedTools: ["Bash", "Glob"] },
})) {
    if ("session_id" in message) sessionId = message.session_id;
    if ("result" in message) console.log("Turn 1:", message.result);
}

// Follow-up turn — resumes the same conversation
for await (const message of query({
    prompt: "Now tell me more about the largest file",
    options: { allowedTools: ["Bash", "Read"], resume: sessionId },
})) {
    if ("result" in message) console.log("Turn 2:", message.result);
}
