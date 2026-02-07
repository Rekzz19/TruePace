"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function NotificationModal({
  notification,
  onClose,
  onApplied,
}: any) {
  const [loading, setLoading] = useState(false);
  const [downtimeDays, setDowntimeDays] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function apply() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = (sessionData as any)?.session?.access_token;

      await fetch("/api/notifications/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId: notification.id, downtimeDays }),
      });
      onApplied?.();
      onClose?.();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="z-60 w-96">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>{notification.title}</CardTitle>
              <button
                aria-label="Close"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{notification.body}</p>

            {/* Display AI reasoning in readable text when available, fallback to JSON */}
            <div className="mt-4">
              <label className="block text-sm">Suggested action</label>
              {(() => {
                const payload = notification.payload ?? {};
                const resp = notification.response ?? {};
                const candidate =
                  payload?.aiReasoning ||
                  payload?.reasoning ||
                  payload?.explanation ||
                  payload?.summary ||
                  payload?.message ||
                  resp?.summary ||
                  resp?.message ||
                  resp?.description;

                if (candidate && typeof candidate === "string") {
                  return (
                    <p className="p-3 bg-muted rounded text-sm max-h-48 overflow-auto">
                      {candidate}
                    </p>
                  );
                }

                // Fallback: show pretty JSON when structured data only
                return (
                  <pre className="p-3 bg-muted rounded text-sm max-h-48 overflow-auto">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                );
              })()}
            </div>

            <div className="mt-4">
              <label className="block text-sm">
                Expected injury duration (days)
              </label>
              <Input
                type="number"
                min={0}
                value={downtimeDays ?? ""}
                onChange={(e: any) => setDowntimeDays(Number(e.target.value))}
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              {/* Only allow Apply for actionable notifications (not confirmations and not already responded) */}
              {!notification.responded &&
              notification.type !== "confirmation" ? (
                <Button onClick={apply} disabled={loading}>
                  {loading ? "Applying..." : "Apply"}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
