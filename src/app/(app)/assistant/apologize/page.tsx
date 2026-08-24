import { AssistantStudio } from "@/features/assistant/assistant-studio";

export default function ApologizePage() {
  return (
    <AssistantStudio
      mode="apologize"
      heading="Should I apologize?"
      placeholder="Describe the situation. We’ll look at what happened, what to avoid, and a possible next step."
    />
  );
}
