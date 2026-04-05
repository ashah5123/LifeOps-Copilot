import type { FeedItem } from "@/types";

/** Map backend /dashboard/feed/today items to TodayFeed FeedItem shape. */
export function mapApiFeedToFeedItems(
  rows: { id: string; type: string; title: string; time: string }[],
): FeedItem[] {
  const category = (t: string): FeedItem["category"] => {
    if (t === "task" || t === "reminder") return "calendar";
    return "inbox";
  };

  const url = (t: string): string => {
    if (t === "reminder" || t === "task") return "/calendar";
    return "/inbox";
  };

  return rows.map((r) => ({
    id: r.id,
    text: r.title,
    category: category(r.type),
    actionLabel: "Open",
    actionUrl: url(r.type),
    timestamp: r.time,
  }));
}
