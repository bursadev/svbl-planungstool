"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { updateInstructor, type Instructor } from "@/lib/api/instructors";
import { mergePreferences } from "./preferences";

/**
 * «Implizites Wissen»: free text in `preferences.notes` with its own «Speichern». The text lives in
 * local state; a server value that changed (after a save, or an edit elsewhere) replaces it, a
 * refresh that did not change the notes leaves unsaved typing alone.
 */
export function KnowledgeCard({ instructor }: { instructor: Instructor }) {
  const router = useRouter();
  const textareaId = useId();
  const notes = instructor.preferences?.notes ?? "";

  const [value, setValue] = useState(notes);
  // `seen` is the last prop value, `baseline` what the server holds as far as this card knows.
  const [seen, setSeen] = useState(notes);
  const [baseline, setBaseline] = useState(notes);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  if (notes !== seen) {
    setSeen(notes);
    setBaseline(notes);
    setValue(notes);
  }

  const dirty = value.trim() !== baseline;

  async function handleSave() {
    const trimmed = value.trim();
    setPending(true);
    try {
      await updateInstructor(instructor.id, {
        preferences: mergePreferences(instructor.preferences, { notes: trimmed }),
      });
      setBaseline(trimmed);
      setSaved(true);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Unerwarteter Fehler.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <label htmlFor={textareaId}>Implizites Wissen</label>
        </CardTitle>
        <CardDescription>Erfahrungen und Hinweise, die in keinem Skill stehen.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          id={textareaId}
          value={value}
          rows={6}
          placeholder="z. B. kennt die Anlagen in Rupperswil, ungern Montag früh …"
          disabled={pending}
          onChange={(event) => {
            setValue(event.target.value);
            setSaved(false);
          }}
        />
        <div className="flex items-center gap-3">
          <Button size="sm" disabled={pending || !dirty} onClick={handleSave}>
            Speichern
          </Button>
          {saved && !dirty ? (
            <span role="status" className="text-xs text-muted-foreground">
              Gespeichert
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
