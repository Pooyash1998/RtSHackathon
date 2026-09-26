import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SettingsData = Awaited<ReturnType<typeof api.settings.get>>["settings"];

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [readiness, setReadiness] = useState({ openai: false, bfl: false });
  const [localData, setLocalData] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.settings.get().then((response) => {
      setSettings(response.settings);
      setReadiness(response.provider_readiness);
      setLocalData(response.local_data);
    }).catch(() => setMessage("Settings could not be loaded."));
  }, []);

  if (!settings) return <p role="status">Loading settings...</p>;

  const save = async () => {
    try {
      await api.settings.update(settings);
      setMessage("Settings saved.");
    } catch {
      setMessage("Settings could not be saved. Your choices are still shown.");
    }
  };

  const reset = async () => {
    try {
      await api.settings.reset();
      setMessage("Local application data reset.");
    } catch {
      setMessage("Reset is incomplete. Retry to finish local file cleanup.");
    }
  };

  return <main className="container mx-auto max-w-4xl space-y-6 px-4 py-8 sm:py-12">
    <div>
      <p className="mb-2 font-mono text-xs font-bold tracking-wide text-primary">LOCAL BYOK APP</p>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-muted-foreground">Choose the defaults, models, and review budget used for new stories.</p>
    </div>
    <Card><CardContent className="space-y-5 pt-6">
      <fieldset className="space-y-2">
        <legend className="font-semibold">Story length</legend>
        {[12, 20].map((count) => <label key={count} className="flex min-h-11 items-center gap-2">
          <input type="radio" name="story-length" checked={settings.story_length === count}
            aria-label={count === 20 ? "20 panels (Full comic)" : "12 panels"}
            onChange={() => setSettings({ ...settings, story_length: count as 12 | 20 })} />
          {count === 20 ? "20 panels — Full comic" : "12 panels — Standard"}
        </label>)}
      </fieldset>
      <label className="block">Default classroom style
        <select className="mt-1 min-h-11 w-full rounded-md border bg-card px-3" value={settings.default_design_style}
          onChange={(event) => setSettings({ ...settings, default_design_style: event.target.value as SettingsData["default_design_style"] })}>
          <option value="comic">Comic</option><option value="manga">Manga</option><option value="cartoon">Cartoon</option>
        </select>
      </label>
      <div className="space-y-3 border-t pt-5"><h2 className="font-serif text-2xl font-semibold">Provider models</h2>
        <label className="block">OpenAI model
          <select className="mt-1 min-h-11 w-full rounded-md border bg-card px-3" value={settings.openai_model}
            onChange={(event) => setSettings({ ...settings, openai_model: event.target.value as SettingsData["openai_model"] })}>
            <option value="gpt-5.6-terra">Terra — balanced cost and quality</option>
            <option value="gpt-5.6-sol">Sol — highest quality</option>
            <option value="gpt-5.6-luna">Luna — fastest and lowest cost</option>
          </select>
        </label>
        <label className="block">BFL model
          <select className="mt-1 min-h-11 w-full rounded-md border bg-card px-3" value={settings.bfl_model}
            onChange={(event) => setSettings({ ...settings, bfl_model: event.target.value as SettingsData["bfl_model"] })}>
            <option value="flux-2-pro">Pro — default continuity and cost balance</option>
            <option value="flux-2-flex">Flex — optional, higher-cost typography choice</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Badge variant={readiness.openai ? "default" : "outline"}>OpenAI · {readiness.openai ? "ready" : "key not configured"}</Badge>
          <Badge variant={readiness.bfl ? "default" : "outline"}>BFL · {readiness.bfl ? "ready" : "key not configured"}</Badge>
        </div>
      </div>
      <div className="space-y-3 border-t pt-5">
      <label className="flex min-h-11 items-center gap-3 font-medium">
        <Checkbox checked={settings.automatic_panel_review} onCheckedChange={(checked) => setSettings({ ...settings, automatic_panel_review: checked === true })} />
        Automatically review generated panels
      </label>
      <p className="text-sm text-muted-foreground">Off by default. Enabling review adds one OpenAI vision review for every initial panel. Each retry adds another BFL image generation and another OpenAI vision review, so generation takes longer and uses more BYOK credits. This applies only to new generations.</p>
      <label className="block">Panel review attempts
        <select className="mt-1 min-h-11 w-full rounded-md border bg-card px-3" value={settings.panel_review_attempt_cap}
          onChange={(event) => setSettings({ ...settings, panel_review_attempt_cap: Number(event.target.value) as 1 | 2 | 3 })}>
          <option value="1">1</option><option value="2">2</option><option value="3">3</option>
        </select>
      </label>
      </div>
      <Button onClick={save}>Save settings</Button>
    </CardContent></Card>
    <Card className="border-destructive/30"><CardContent className="space-y-4 pt-6"><h2 className="font-serif text-2xl font-semibold">Local data</h2><p className="text-muted-foreground">{localData}</p>
      <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive">Reset local data</Button></AlertDialogTrigger>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Reset all local data?</AlertDialogTitle>
          <AlertDialogDescription>This deletes every classroom, student profile, story, and managed file on this device.</AlertDialogDescription>
        </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={reset}>Confirm reset</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </CardContent></Card>
    {message && <p role="status" className="rounded-md border bg-card p-3 text-sm">{message}</p>}
  </main>;
}
