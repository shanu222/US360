import { AssistantStudio } from "@/features/assistant/assistant-studio";

export default function AfterArgumentPage() {
  return (
    <AssistantStudio
      mode="fight"
      heading="We just had a fight"
      placeholder="What happened? Be as specific as you can. This is for you — not to assign blame."
    />
  );
}
