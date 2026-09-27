/**
 * Areas — colour means one thing: where you are (Constantin, 2026-09-25).
 *
 *   Today      Briefing, Notifications                               umber
 *   Clients    Travellers, Itineraries                               slate
 *   Knowledge  Records, Knowledge, Ask · owner: Confirm, Publish,    petrol
 *              Connections
 *   Money      Commissions · owner: Unmatched payments               plum
 *
 * A screen has one area for every role: a link one role sends lands in the same colour
 * for the other. Roles differ in which areas their dock holds and in what order. The
 * area colour is the world you are in: the dock pill, the canvas glow behind it, a
 * selected control, and the page’s primary (Constantin chose this over umber-everywhere,
 * 2026-09-25). Status keeps moss, ochre and claret; area hues sit clear of them.
 *
 * The map is src/data/areas.json, read here and by tier 1, which fails a contracted
 * screen with no area: a new screen has to say where it belongs.
 */
import map from "@/data/areas.json";

export type Area = keyof typeof map.areas;

export const areas = map.areas as Record<Area, { name: string; about: string; hue: number }>;

/** The area a path belongs to: the longest route prefix that matches. */
export function areaFor(pathname: string): Area | null {
  const hit = Object.keys(map.routes)
    .filter((p) => pathname === p || pathname.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return hit ? (map.routes as Record<string, Area>)[hit] : null;
}
