import { CommandBar } from "@/features/assistant/command-bar";

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-navy">AI Assistant</h1>
        <p className="mt-2 text-muted">
          Ask about the moment, food, a place, an exam, or what to send. Answers use your saved profile, memory,
          calendar, and chat history in the background — not shown as a report.
        </p>
      </div>
      <CommandBar focus="assistant" />
    </div>
  );
}
