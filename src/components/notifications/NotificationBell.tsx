"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import NotificationModal from "./NotificationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Bell as BellIcon } from "lucide-react";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [shouldBlink, setShouldBlink] = useState(false);

  async function fetchNotifications() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = (sessionData as any)?.session?.access_token;

      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setNotifications(json.notifications || []);
      // Determine whether we should blink: only when there's a newer notification
      try {
        const latest = (json.notifications || [])[0];
        if (!latest) {
          // No notifications — don't blink and don't update last-seen timestamp
          setShouldBlink(false);
        } else {
          const latestTs = new Date(latest.createdAt).getTime();
          const lastSeen = Number(
            localStorage.getItem("notificationsLastSeen") || "0",
          );

          if (lastSeen === 0) {
            // first load with at least one notification: record current latest without blinking
            localStorage.setItem("notificationsLastSeen", String(latestTs));
            setShouldBlink(false);
          } else {
            setShouldBlink(latestTs > lastSeen);
          }
        }
      } catch (e) {
        setShouldBlink(false);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchNotifications();

    // Listen for runLogged events to refresh notifications once
    const handler = () => fetchNotifications();
    window.addEventListener("runLogged", handler as EventListener);
    return () =>
      window.removeEventListener("runLogged", handler as EventListener);
  }, []);

  return (
    <div className="relative">
      {(() => {
        const hasUnread = notifications.some((n) => !n.read);
        const base = "p-2 rounded-full inline-flex items-center justify-center";
        const unreadClasses = "bg-red-600 text-white animate-blink";
        const normalClasses = "hover:bg-neutral-800";
        return (
          <>
            <button
              onClick={() => {
                // Opening the notifications menu should stop the blinking until a new notification arrives
                const latest = (notifications || [])[0];
                try {
                  if (latest) {
                    const latestTs = new Date(latest.createdAt).getTime();
                    localStorage.setItem(
                      "notificationsLastSeen",
                      String(latestTs),
                    );
                  }
                } catch {}
                setShouldBlink(false);
                setOpen((s) => !s);
              }}
              className={`${base} ${shouldBlink ? unreadClasses : normalClasses}`}
              aria-label={
                hasUnread ? "You have unread notifications" : "Notifications"
              }
            >
              <BellIcon className="w-5 h-5 text-current" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-96 z-40">
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <CardTitle>Notifications</CardTitle>
                      <div className="flex gap-2 items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpen(false)}
                        >
                          <X />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {notifications.length === 0 && (
                      <p className="text-sm">No notifications</p>
                    )}
                    <ul className="mt-2 space-y-2 max-h-64 overflow-auto">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className={`p-3 rounded border ${n.read ? "bg-white" : "bg-orange-50"}`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <div className="font-medium">{n.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {n.body}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {!n.responded && n.type !== "confirmation" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { data: sessionData } =
                                        await supabase.auth.getSession();
                                      const token = (sessionData as any)
                                        ?.session?.access_token;
                                      await fetch(
                                        "/api/notifications/mark-read",
                                        {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Bearer ${token}`,
                                          },
                                          body: JSON.stringify({
                                            notificationId: n.id,
                                          }),
                                        },
                                      );
                                    } catch (err) {
                                      console.error(
                                        "Failed to mark read:",
                                        err,
                                      );
                                    }
                                    setSelected(n);
                                    setOpen(false);
                                    // mark the bell as seen (stop blinking) when user reviews
                                    try {
                                      const latest = (notifications || [])[0];
                                      if (latest) {
                                        const latestTs = new Date(
                                          latest.createdAt,
                                        ).getTime();
                                        localStorage.setItem(
                                          "notificationsLastSeen",
                                          String(latestTs),
                                        );
                                      }
                                    } catch {}
                                    setShouldBlink(false);
                                  }}
                                >
                                  Review
                                </Button>
                              ) : (
                                <Button variant="ghost" size="sm" disabled>
                                  {n.type === "confirmation"
                                    ? "Info"
                                    : "Reviewed"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchNotifications()}
                      >
                        Refresh
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        );
      })()}

      {selected && (
        <NotificationModal
          notification={selected}
          onClose={() => {
            setSelected(null);
            fetchNotifications();
          }}
          onApplied={() => fetchNotifications()}
        />
      )}
    </div>
  );
}
