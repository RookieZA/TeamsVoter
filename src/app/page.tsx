"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePollStore } from "@/lib/store";
import { PlusCircle, Trash2, ArrowRight, BarChart2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const setPoll = usePollStore((state) => state.setPoll);
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState([{ id: "1", label: "" }, { id: "2", label: "" }]);

  const handleAddChoice = () => {
    setChoices([...choices, { id: Math.random().toString(36).substring(7), label: "" }]);
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length <= 2) return;
    setChoices(choices.filter((_, i) => i !== index));
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index].label = value;
    setChoices(newChoices);
  };

  const handleStartPoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Filter out empty choices
    const validChoices = choices.filter((c) => c.label.trim() !== "");
    if (validChoices.length < 2) return;

    // Generate a random host ID and navigate
    const hostId = `poll-${Math.random().toString(36).substring(2, 9)}`;

    setPoll(hostId, question, validChoices);

    router.push(`/host/${hostId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl glass rounded-2xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <BarChart2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">LivePoll</h1>
          <p className="text-foreground/70">Stateless, real-time P2P polling system.</p>
        </div>

        <form onSubmit={handleStartPoll} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Question</label>
            <input
              type="text"
              required
              placeholder="What framework is best?"
              className="w-full p-4 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary backdrop-blur-md transition-all text-lg"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground/80">Options</label>
            {choices.map((choice, index) => (
              <div key={choice.id} className="flex gap-2">
                <input
                  type="text"
                  required={index < 2} // First two are required
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 p-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  value={choice.label}
                  onChange={(e) => handleChoiceChange(index, e.target.value)}
                />
                {choices.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveChoice(index)}
                    className="p-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddChoice}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors py-2"
            >
              <PlusCircle className="w-4 h-4" /> Add Option
            </button>
          </div>

          <button
            type="submit"
            disabled={!question.trim() || choices.filter(c => c.label.trim() !== "").length < 2}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Polling <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </main>
  );
}
