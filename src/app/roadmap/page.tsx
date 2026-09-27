"use client";
/**
 * The roadmap, clickable (/roadmap).
 *
 * The CPO's "Enable VIC — Roadmap to V1" (v4, 22 Sep 2026), reproduced word for word in
 * his own type and layout, so it reads as his document. One layer is added: every line
 * that names something a person would use carries a status (Built · In the lab · Partial
 * · Not designed yet) and opens a panel with that surface, live, in the design
 * prototype, signed in as the person it belongs to (through /door). The gaps are shown,
 * not hidden: which parts of the roadmap already have a designed surface is the point.
 *
 * The prototype's data is analogue (fictional). Unlisted (see layout.tsx).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";

/* ── the surfaces ──────────────────────────────────────────────────────────────── */

type Status = "built" | "lab" | "partial" | "gap";
interface Surface {
  status: Status;
  /** What the panel says the surface is. */
  title: string;
  /** What it shows, honestly, including what is missing. */
  note: string;
  /** Who it opens as, where, and whether in the lab. A gap may name its nearest surface. */
  as?: "user" | "owner";
  to?: string;
  lab?: boolean;
  ask?: string;
  nearest?: string;
}

const ADVISOR = "R. Devane, advisor";
const OWNER = "M. Keller, agency owner";

const S: Record<string, Surface> = {
  vault: {
    status: "partial", as: "owner", to: "/knowledge", title: "Knowledge Vault",
    note: "Every document with its source (Claromentis, Drive, email, uploads) and its visibility: whole agency, team, private or administrators only. The owner assigns access per document. Not yet: your Claromentis folder tree; documents are grouped by source.",
  },
  guides: { status: "gap", title: "Destination Guides", note: "Not designed yet. The nearest today is an agency announcement (“New in Kyoto for autumn”) that answers cite; there is no page per destination with your sections.", as: "user", to: "/knowledge?source=Announcements", nearest: "An agency announcement" },
  briefroom: {
    status: "partial", as: "user", to: "/notifications", title: "Briefing Room",
    note: "Three importance levels (Info, Important, Critical) and unread tracking (new, seen, actioned, deferred). The agency's briefings arrive as announcements; a Critical one rises as the assistant's pop-up. Not yet: sections per your Claromentis briefings.",
  },
  catalog: {
    status: "built", as: "user", to: "/records", title: "Product catalog",
    note: "Hotels, cruises, DMCs and rep firms as records, with programs, Virtuoso membership, evidence and freshness; filters and tabs per classification. Restaurants are not a category yet.",
  },
  record: {
    status: "built", as: "user", to: "/records/maison-leandre", title: "A product record",
    note: "Programs, commission, amenities, rep firm and notices as fields, each with its source and age; where sources disagree it says so and the advisor settles it. Commission is masked for anyone who may not see money.",
  },
  terms: {
    status: "lab", as: "user", lab: true, to: "/itineraries/paris-anniversary?line=p3", title: "Programs, commissions and amenities, computed",
    note: "On a trip line, the property's terms change with the program it is booked under: Atelier or Meridian, their amenities, and the commission worked out on the line's price.",
  },
  teams: { status: "gap", title: "Teams and Professional Development", note: "Not designed yet. Teams exist only as a sharing audience (“Team · Paris”) and in masking; there is no team directory mirroring your Claromentis groups, and no Professional Development area.", as: "user", to: "/knowledge", nearest: "Team visibility on documents" },
  dashboard: {
    status: "partial", as: "user", to: "/briefing", title: "Dashboard",
    note: "The Briefing: the advisor's day written in one sentence, what the agency published, and her insights ranked, one at a time. Not yet: a personal area each advisor shapes.",
  },
  assistant: {
    status: "partial", as: "user", to: "/records/maison-leandre", ask: "What is true about Maison Léandre?", title: "The assistant",
    note: "Answers from the agency's own sources, each cited; permission-aware; every conversation kept, with its own title. It also acts: it drafts, chases and asks suppliers, step by step on screen, and stops for your confirm. Not yet: web sources on request, and usage limits.",
  },
  conversations: {
    status: "built", as: "user", to: "/ask?c=leandre-rate", title: "An answer you can check",
    note: "A conversation read in full: every claim numbered to its source, the trace of how the answer was built, and a disagreement between sources shown, not averaged. A figure the reader may not see is absent, not masked.",
  },
  connections: {
    status: "partial", as: "owner", to: "/connections", title: "Sources connected",
    note: "Drive, Claromentis, the forwarded-mail address, the partner portal and TripSuite, each with its health and last success; the owner reconnects a failing one. Not yet: account invitations and the data-processing acceptance on first login.",
  },
  curation: {
    status: "built", as: "owner", to: "/admin/review/sereno", title: "From a document to a record",
    note: "What is read out of an upload or a sync is a candidate: each field with where it came from and how cleanly it read, confirmed or fixed by a named person, stamped. A duplicate is merged or kept apart; a held field cannot be confirmed.",
  },
  tripsuite: {
    status: "partial", as: "user", to: "/travellers/s-marchetti", title: "TripSuite, connected",
    note: "TripSuite as a read-only source: preferences it holds are cited on the profile, and spend follows it, up to 48 hours behind. Not yet: the TripSuite study's result, and trips flowing in as the itinerary builder's lines.",
  },
  vic: {
    status: "built", as: "user", to: "/travellers/s-marchetti", title: "The VIC profile",
    note: "Who the client is, where they went, what they like and what they spent (for those who may see money). Every preference carries its source and date: an email, a call, TripSuite, or the advisor's own hand.",
  },
  complete: {
    status: "built", as: "user", to: "/travellers/s-marchetti", title: "Completed inside Enable VIC",
    note: "The advisor confirms a preference that rests on one source, keeps or discards a suggestion, and adds what TripSuite does not hold, attributed to her. TripSuite is read, never written.",
  },
  own: {
    status: "built", as: "owner", to: "/travellers", title: "Her clients, and the agency's rules",
    note: "Seen as the owner: an advisor's travellers appear only where she shared them, at Full or Basic; the rest are absent, not locked. The owner can ask for access; the advisor decides.",
  },
  virtuoso: { status: "gap", title: "Virtuoso alongside", note: "Not designed yet, as in the roadmap: Virtuoso membership shows on records and filters the directory, but Virtuoso's programs and content are not in.", as: "user", to: "/records", nearest: "Virtuoso as a filter on records" },
  draft: {
    status: "lab", as: "user", lab: true, to: "/itineraries", ask: "Draft a trip for L. Grandin", title: "The assistant proposes an itinerary",
    note: "Tap through its questions (where and when, what it is for, how full the days), then Draft it: the trip is assembled on screen from the client's profile and the agency's records. Every line arrives as a suggestion with its reason and source: keep, swap or remove.",
  },
  book: {
    status: "partial", as: "user", lab: true, to: "/itineraries/lisbon-short?line=l2", title: "Booking from the itinerary",
    note: "Designed as ask, hold, confirm: the request is drafted from the line and the client, sent by the advisor, and the supplier's reply is read into a status, a date and a reference. Not yet: a booking engine or a payment route; the roadmap's route is still being chosen.",
  },
  confirmed: {
    status: "partial", as: "user", lab: true, to: "/itineraries/kyoto-kansai?line=k2", title: "Confirmation, back on the trip",
    note: "A confirmed line with its reference, who accepted it and from which reply; the commission it will earn is projected in Commissions. Nothing is shown as booked before a named person accepts the supplier's word. Not yet: fed into the VIC's history.",
  },
  v1: {
    status: "lab", as: "user", lab: true, to: "/itineraries/paris-anniversary", title: "The whole sentence",
    note: "One trip, end to end: the client's taste, the agency's notice that closes a hotel, the program and its amenities, the requests, the holds and the confirmations, the commission, and the assistant doing the asking. Start with the first move on the right.",
  },
  lux: { status: "gap", title: "Lux Pages", note: "Not designed yet: waiting on Lux Pages' API." },
};

const STATUS: Record<Status, { label: string; cls: string }> = {
  built: { label: "Built", cls: "st-built" },
  lab: { label: "In the lab", cls: "st-lab" },
  partial: { label: "Partial", cls: "st-partial" },
  gap: { label: "Not designed yet", cls: "st-gap" },
};

const doorOf = (s: Surface) =>
  `/door?as=${s.as ?? "user"}&lab=${s.lab ? 1 : 0}&to=${encodeURIComponent(s.to ?? "/briefing")}${s.ask ? `&ask=${encodeURIComponent(s.ask)}` : ""}`;

/* ── the page ──────────────────────────────────────────────────────────────────── */

export default function RoadmapPage() {
  const [open, setOpen] = useState<string | null>(null);
  const show = useCallback((id: string) => {
    setOpen(id);
    try { history.replaceState(null, "", `#${id}`); } catch {}
  }, []);
  const close = useCallback(() => {
    setOpen(null);
    try { history.replaceState(null, "", location.pathname); } catch {}
  }, []);
  useEffect(() => {
    const h = location.hash.slice(1);
    if (h && S[h]) setOpen(h);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  /* A line that opens a surface, with its status after it. */
  const It = ({ s, dep, children }: { s: string; dep?: boolean; children: React.ReactNode }) => (
    <li className={`${dep ? "dep " : ""}clk${open === s ? " on" : ""}`} onClick={() => show(s)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") show(s); }}>
      {children} <span className={`st ${STATUS[S[s].status].cls}`}>{STATUS[S[s].status].label}</span>
    </li>
  );
  const Tile = ({ n, children }: { n: string; children: React.ReactNode }) => (
    <a className="tile" href={`#step-${n}`} onClick={(e) => { e.preventDefault(); document.getElementById(`step-${n}`)?.scrollIntoView({ behavior: "smooth" }); }}>
      <span className="n">{n}</span><span className="f">{children}</span>
    </a>
  );

  const counts = Object.values(S).reduce((m, x) => ({ ...m, [x.status]: (m[x.status] ?? 0) + 1 }), {} as Record<Status, number>);

  return (
    <div className="rm">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" precedence="default" />
      <style>{CSS}</style>

      {/* ── the key: what the added layer means ── */}
      <div className="key">
        <div className="key-in">
          <span><b>Click any line</b> to see it in the product, live.</span>
          <span className="st st-built">Built · {counts.built ?? 0}</span>
          <span className="st st-lab">In the lab · {counts.lab ?? 0}</span>
          <span className="st st-partial">Partial · {counts.partial ?? 0}</span>
          <span className="st st-gap">Not designed yet · {counts.gap ?? 0}</span>
          <span className="key-src">Roadmap v4, 22 Sep · surfaces from the Enable design prototype, on analogue data</span>
        </div>
      </div>

      {/* PAGE 1 · OVERVIEW */}
      <div className="page">
        <h1>Enable VIC</h1>
        <div className="tagline">« Driven by the VIC profile &amp; history, design the ideal itinerary &amp; booking with best possible commissions and amenities »</div>

        <div className="stacks">
          <div className="col">
            <div className="new">
              <div className="n">0.1</div>
              <div className="fn">Your knowledge, <b>structured</b></div>
              <ul>
                <It s="vault">Claromentis replaced: documents, guides, briefings, teams</It>
                <It s="record">Products, programs, commissions as records</It>
                <It s="assistant">The assistant answers from your own knowledge, and from the web when you ask</It>
              </ul>
            </div>
          </div>

          <div className="col">
            <div className="new">
              <div className="n">0.2</div>
              <div className="fn">Driven by the <b>VIC profile &amp; history</b></div>
              <ul>
                <It s="tripsuite">TripSuite connected: clients, trips, history in Enable VIC</It>
                <It s="vic">A VIC profile you can complete inside Enable VIC</It>
                <It s="virtuoso" dep>Virtuoso programs alongside yours, subject to Virtuoso access</It>
              </ul>
            </div>
            <Tile n="0.1">Your knowledge, <b>structured</b></Tile>
          </div>

          <div className="col">
            <div className="new">
              <div className="n">0.3</div>
              <div className="fn">Design the <b>ideal itinerary</b>, best <b>commissions &amp; amenities</b></div>
              <ul>
                <It s="draft">The assistant proposes itineraries from each VIC&apos;s history</It>
                <It s="terms">Matched with your programs, commissions and amenities</It>
              </ul>
            </div>
            <Tile n="0.2">VIC <b>profile &amp; history</b></Tile>
            <Tile n="0.1">Your knowledge, <b>structured</b></Tile>
          </div>

          <div className="col">
            <div className="new">
              <div className="n">0.4</div>
              <div className="fn">&amp; <b>booking</b></div>
              <ul>
                <It s="book">Book simply from Enable VIC</It>
                <It s="v1">Where advisors already read, brief, ask and design</It>
              </ul>
            </div>
            <Tile n="0.3"><b>Ideal itinerary</b>, commissions &amp; amenities</Tile>
            <Tile n="0.2">VIC <b>profile &amp; history</b></Tile>
            <Tile n="0.1">Your knowledge, <b>structured</b></Tile>
          </div>

          <div className="finish clk-block" onClick={() => show("v1")} role="button" tabIndex={0}>
            <div className="cap">
              <div className="v">Enable VIC V1<small>The whole sentence, working together</small></div>
              <p>Driven by the VIC profile &amp; history, design the ideal itinerary &amp; booking with best possible commissions and amenities.</p>
              <span className="st st-lab st-onred">In the lab · see it</span>
            </div>
            <Tile n="0.4">&amp; <b>booking</b></Tile>
            <Tile n="0.3"><b>Ideal itinerary</b>, commissions &amp; amenities</Tile>
            <Tile n="0.2">VIC <b>profile &amp; history</b></Tile>
            <Tile n="0.1">Your knowledge, <b>structured</b></Tile>
          </div>
        </div>

        <div className="timeline">
          <div>0.1<span>October 1</span></div>
          <div>0.2<span>November 16</span></div>
          <div>0.3<span>November 23</span></div>
          <div>0.4<span>January 12</span></div>
          <div className="red">V1<span>January 19</span></div>
        </div>

        <div className="aside">
          <div className="lux clk-block" onClick={() => show("lux")} role="button" tabIndex={0}><b>Lux Pages</b> · undated — the connection is ready on Enable VIC&apos;s side and Lux Pages is building its API on our specification; they estimate six to eight weeks. The start date is theirs. <span className="st st-gap">Not designed yet</span></div>
          <div className="note"><b>Every step contains the previous ones. Dates after October 1 assume the contract signed before October 1.</b> One documented page per step follows: what you get, what is not trivial and what we need from you.</div>
        </div>
      </div>

      {/* SLIDE 0.1 */}
      <div className="page slide" id="step-0.1">
        <div className="kicker">Enable VIC 0.1 · Phase 1</div>
        <h2>Your knowledge, <b>structured</b></h2>
        <div className="when">Delivered October 1 · demo on your data · curation and adoption with your team until October 15</div>
        <div className="cols">
          <div className="scol">
            <h3>What you get on October 1</h3>
            <ul>
              <It s="vault"><b>Knowledge Vault</b> in your folder structure, editable by you, every Claromentis document and page with its visibility</It>
              <It s="guides"><b>Destination Guides</b>, one page per destination with your sections</It>
              <It s="briefroom"><b>Briefing Room</b>: sections, three importance levels, unread tracking, the critical pop-up</It>
              <It s="catalog"><b>Product catalog</b>: hotels, DMCs, restaurants, cruises as records with programs, commissions, amenities and rep firms attached; tabs per your classification</It>
              <It s="teams"><b>Teams</b> mirroring your Claromentis groups; Professional Development in the navigation</It>
              <It s="dashboard"><b>Dashboard</b>: agency content per your framework, a personal area each advisor shapes</It>
              <It s="assistant"><b>The assistant</b>: answers from your own documents with sources, permission-aware, web sources when you ask, a history each advisor keeps, usage limits</It>
              <It s="connections">Drive synced, supplier email captured, an account for every advisor, data-processing acceptance on first login</It>
            </ul>
            <div className="sub">Accepted together on October 1</div>
            <ul>
              <li>Every advisor has an account with the right teams · every Claromentis document is in the vault with the same visibility · every destination page exists with its sections · the Briefing Room works with its levels and unread tracking · products, programs and rep firms are structured and masked per team · upload to structured data works for admins · private notes and contacts stay private · the assistant answers from your documents with sources and keeps history · Drive syncs and the email address ingests · stable for 20 advisors, pages under two seconds</li>
            </ul>
            <div className="sub">Not in this step</div>
            <ul><li className="out">Client data from TripSuite, itinerary design, booking, Virtuoso and Lux Pages content</li></ul>
          </div>
          <div className="scol linen">
            <h3>Why it is not trivial</h3>
            <ul>
              <It s="curation">Claromentis is re-extracted with your credentials and imported in full, permissions carried over; your team then curates inside Enable VIC</It>
              <It s="record">Programs, commissions and amenities become <b>records</b>, not paragraphs: steps 0.3 and 0.4 compute on them</It>
              <It s="conversations">The assistant only sees what the advisor asking may see</It>
            </ul>
            <div className="unk"><span className="lbl">Unknown · not under our control</span><b>What the Claromentis export contains.</b> Broken links, outdated pages and data errors in the source come through as they are; we report them, your team decides during curation.</div>
            <div className="unk ours"><span className="lbl">Unknown · ours to resolve by September 30</span><b>Email deliverability.</b> Invitations must reach inboxes, not spam; we fix the sending domain before any invitation goes out.</div>
          </div>
          <div className="scol you">
            <h3>What we need from you</h3>
            <ul>
              <li>The list of your Claromentis groups, to mirror them as teams</li>
              <li>The Drive folders to sync</li>
              <li>Your text for the data-processing acceptance</li>
              <li>October 1 → 15: curation of the imported content, then a re-check session before advisors are invited</li>
              <li>A short onboarding session for advisors, together</li>
            </ul>
          </div>
        </div>
        <div className="pager">Enable VIC · roadmap to V1 · 0.1</div>
      </div>

      {/* SLIDE 0.2 */}
      <div className="page slide" id="step-0.2">
        <div className="kicker">Enable VIC 0.2</div>
        <h2>Driven by the <b>VIC profile &amp; history</b></h2>
        <div className="when">November 16, firm · TripSuite connected · Virtuoso alongside, subject to access</div>
        <div className="cols">
          <div className="scol">
            <h3>What you get</h3>
            <ul>
              <It s="tripsuite"><b>TripSuite connected</b> through your subscription: each advisor&apos;s clients, trips and history flow into Enable VIC</It>
              <It s="vic">A <b>VIC profile</b> in Enable VIC: who the client is, where they went, what they liked, what they spent</It>
              <It s="complete">You <b>complete it inside Enable VIC</b>: notes, preferences and history that TripSuite does not hold. TripSuite stays the source for its own records; nothing is duplicated or edited there</It>
              <It s="own">Each advisor sees her own clients only; the agency view follows your rules</It>
              <It s="virtuoso" dep><b>Virtuoso</b>: programs and partner content alongside your own catalog, one place instead of two portals, if Virtuoso gives access</It>
            </ul>
            <div className="sub">Not in this step</div>
            <ul><li className="out">Itinerary proposals (0.3), booking (0.4)</li></ul>
          </div>
          <div className="scol linen">
            <h3>Why it is not trivial</h3>
            <ul>
              <li>October is the study: what TripSuite exposes, what Enable VIC does with it, what stays in TripSuite</li>
              <li>Two data models to reconcile: TripSuite&apos;s clients and trips, Enable VIC&apos;s products and programs</li>
              <It s="own">Client data is the most sensitive data the agency holds: permissions per advisor from day one</It>
            </ul>
            <div className="unk"><span className="lbl">Unknown · not under our control</span><b>TripSuite&apos;s MCP interface.</b> What it returns, how fast, how often it can be called and how it authenticates through your subscription. We find out in October; the November 16 scope adjusts to what it allows.</div>
            <div className="unk"><span className="lbl">Unknown · not under our control</span><b>Virtuoso access.</b> Virtuoso has no public interface; their content enters Enable VIC only if Virtuoso or your membership opens a way. Until then this item stays dashed.</div>
            <div className="unk ours"><span className="lbl">Unknown · ours to resolve</span><b>Freshness.</b> How often client data syncs and what happens when a trip changes in TripSuite after it reached Enable VIC.</div>
          </div>
          <div className="scol you">
            <h3>What we need from you</h3>
            <ul>
              <li>Access to TripSuite through your subscription for the October study</li>
              <li>Your contact at Virtuoso, and a word from you to open the door</li>
              <li>Two advisors for a re-check session in the week of November 16</li>
            </ul>
          </div>
        </div>
        <div className="pager">Enable VIC · roadmap to V1 · 0.2</div>
      </div>

      {/* SLIDE 0.3 */}
      <div className="page slide" id="step-0.3">
        <div className="kicker">Enable VIC 0.3</div>
        <h2>Design the <b>ideal itinerary</b>, with the best <b>commissions &amp; amenities</b></h2>
        <div className="when">November 23 · the assistant recommends from real client history · before Thanksgiving</div>
        <div className="cols">
          <div className="scol">
            <h3>What you get</h3>
            <ul>
              <It s="draft">From a VIC&apos;s profile and past trips, the assistant <b>proposes an itinerary</b>: destinations, hotels, experiences</It>
              <It s="terms">Every proposal is <b>matched with your catalog</b>: programs, commissions, amenities, rep firms, Virtuoso content where available</It>
              <It s="draft">Every element cites where it comes from; the advisor edits, keeps, discards</It>
              <li>Switched on advisor by advisor after a test on real cases with your team</li>
            </ul>
            <div className="sub">Not in this step</div>
            <ul><li className="out">Booking from the itinerary (0.4)</li></ul>
          </div>
          <div className="scol linen">
            <h3>Why it is not trivial</h3>
            <ul>
              <It s="record">Recommendation quality comes from <b>structured data</b>: 0.1 turned programs and commissions into records, 0.2 brought the client history in</It>
              <It s="draft">An itinerary is a judgment: the assistant proposes, the advisor decides; the tool must show its reasons</It>
            </ul>
            <div className="unk ours"><span className="lbl">Unknown · ours to resolve</span><b>Quality on your real cases.</b> The first proposals will be judged by your advisors on cases they know; we adjust until they say it is useful, and only then switch it on for everyone.</div>
            <div className="unk ours"><span className="lbl">Unknown · ours to resolve</span><b>Cost and speed of reasoning.</b> A proposal must come back in seconds at a cost per question that fits the usage limits; we measure both during the test.</div>
          </div>
          <div className="scol you">
            <h3>What we need from you</h3>
            <ul>
              <li>Five to ten real client cases with the itinerary the advisor actually built, as the reference</li>
              <li>Two advisors for the test, one hour each</li>
            </ul>
          </div>
        </div>
        <div className="pager">Enable VIC · roadmap to V1 · 0.3</div>
      </div>

      {/* SLIDE 0.4 */}
      <div className="page slide" id="step-0.4">
        <div className="kicker">Enable VIC 0.4</div>
        <h2>&amp; <b>booking</b></h2>
        <div className="when">January 12 · book simply from Enable VIC · after the holidays, on purpose</div>
        <div className="cols">
          <div className="scol">
            <h3>What you get</h3>
            <ul>
              <It s="book">From the itinerary, the advisor <b>books</b> without leaving the place where she reads, briefs, asks and designs</It>
              <It s="confirmed">Confirmation and the booking&apos;s details come back into the VIC&apos;s history</It>
              <li>The route to get there, an integration or another way, is being selected by us and is presented when settled</li>
            </ul>
          </div>
          <div className="scol linen">
            <h3>Why it is not trivial</h3>
            <ul>
              <li>Booking means <b>payment and confirmation flows</b>: who holds the transaction, what is redirected, what comes back</li>
              <It s="confirmed">Nothing about a booking is shown to an advisor before the provider confirms it</It>
            </ul>
            <div className="unk"><span className="lbl">Unknown · not under our control</span><b>The booking route.</b> We do not know yet which tools Enable VIC will book through: what each provider allows us to connect, under which terms and at what pace depends on them. The route is chosen on those answers, not on a logo.</div>
            <div className="unk"><span className="lbl">Unknown · not under our control</span><b>Payments.</b> Card data and payment authorisation stay with the provider or a payment partner, never in Enable VIC; how the hand-off works depends on the route.</div>
            <div className="unk ours"><span className="lbl">Unknown · ours to resolve</span><b>Confirmations back into the history.</b> Formats differ by provider; we start with the one route you choose and add others one at a time.</div>
          </div>
          <div className="scol you">
            <h3>What we need from you</h3>
            <ul>
              <li>Two advisors for a test of the booking flow, one hour each, in the week of January 12</li>
            </ul>
          </div>
        </div>
        <div className="pager">Enable VIC · roadmap to V1 · 0.4</div>
      </div>

      {/* SLIDE V1 */}
      <div className="page slide" id="step-V1">
        <div className="kicker red">Enable VIC V1</div>
        <h2>The whole sentence, <b>working together</b></h2>
        <div className="when">January 19 · every step contains the previous ones · tested with your advisors</div>
        <div className="v1band clk-block" onClick={() => show("v1")} role="button" tabIndex={0}>
          <div className="big">V1<small>Jan 19</small></div>
          <p>Driven by the VIC profile &amp; history, design the ideal itinerary &amp; booking with best possible commissions and amenities.</p>
          <span className="st st-lab st-onred">In the lab · see it</span>
        </div>
        <div className="cols">
          <div className="scol">
            <h3>What V1 is</h3>
            <ul>
              <It s="v1">One place where an advisor <b>reads, briefs, asks, designs and books</b>, with the agency&apos;s whole knowledge and each client&apos;s history behind every answer</It>
              <li>The first complete version: it keeps evolving with your advisors, at a rhythm set together</li>
              <li>New ideas are collected and planned in review sessions, not added mid-build; the build stays on its dates</li>
            </ul>
          </div>
          <div className="scol linen">
            <h3>Around V1</h3>
            <ul>
              <It s="lux"><b>Lux Pages</b>, undated: the connection is ready on Enable VIC&apos;s side, Lux Pages builds its API on our specification and estimates six to eight weeks; it starts the day their API is available</It>
              <It s="virtuoso"><b>Virtuoso</b> joins when Virtuoso gives access, whichever step is current</It>
            </ul>
          </div>
          <div className="scol you">
            <h3>What we need from you</h3>
            <ul>
              <li>Your advisors&apos; use, every day, from October 15: what they open, what they ask, what they book is what tells us where to go next</li>
            </ul>
          </div>
        </div>
        <div className="pager">Enable VIC · roadmap to V1</div>
      </div>

      {open && <Panel id={open} onClose={close} />}
    </div>
  );
}

/* ── the panel: the surface, live, at desktop size, scaled to fit ─────────────────── */
function Panel({ id, onClose }: { id: string; onClose: () => void }) {
  const s = S[id];
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / 1440));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [id]);
  const live = s.status !== "gap" || !!s.to;
  const who = s.as === "owner" ? OWNER : ADVISOR;
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="panel" aria-label={s.title}>
        <header className="panel-head">
          <div>
            <span className={`st ${STATUS[s.status].cls}`}>{STATUS[s.status].label}</span>
            <h2 className="panel-title">{s.title}</h2>
          </div>
          <button type="button" className="x" aria-label="Close" onClick={onClose}>×</button>
        </header>
        <p className="panel-note">{s.note}</p>
        {live && s.to && (
          <>
            <div className="panel-meta">
              <span>{s.status === "gap" ? `Nearest today: ${s.nearest ?? s.title}` : "Live in the prototype"} · as {who}{s.lab ? " · in the lab" : ""}</span>
              <a className="open" href={doorOf(s)} target="_blank" rel="noopener">Open full screen ↗</a>
            </div>
            <div className="frame" ref={frame} style={{ height: Math.round(900 * scale) }}>
              <iframe
                key={id}
                title={s.title}
                src={doorOf(s)}
                style={{ width: 1440, height: 900, transform: `scale(${scale})`, transformOrigin: "0 0" }}
              />
            </div>
          </>
        )}
      </aside>
    </>
  );
}

/* ── his stylesheet, scoped, and the added layer ─────────────────────────────────── */
const CSS = `
.rm{--paper:#FAF8F3;--card:#FFFFFF;--linen:#EFEAE0;--border:#E3DCCE;--ink:#2B2723;--ink-soft:#6E675C;--ink-faint:#9C9486;--brass:#96773F;--brass-soft:#F3EDE0;--done:#4A7A5B;--red:#B0432E;--red-soft:#FBF0EC;
  font-family:'Inter',system-ui,sans-serif;background:var(--paper);color:var(--ink);min-height:100vh;overflow-y:auto;height:100vh}
.rm *{box-sizing:border-box;margin:0;padding:0}
.rm .page{max-width:1100px;margin:0 auto;padding:36px 40px 40px;min-height:100vh}
.rm h1{font:600 34px 'Cormorant Garamond',serif}
.rm .tagline{font:italic 500 19px 'Cormorant Garamond',serif;color:var(--brass);margin-top:8px;max-width:900px;line-height:1.35}
.rm .stacks{display:flex;align-items:flex-end;gap:14px;margin:36px 0 0}
.rm .col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:6px}
.rm .tile{background:var(--brass-soft);border:1.5px solid var(--brass);border-radius:8px;padding:7px 11px;font-size:11px;color:var(--ink-soft);display:flex;align-items:center;gap:8px;min-height:40px;text-decoration:none;cursor:pointer}
.rm .tile:hover{background:#EDE4D2}
.rm .tile .n{font:600 13px 'Cormorant Garamond',serif;color:var(--brass);flex:none}
.rm .tile .f{line-height:1.3}
.rm .tile .f b{color:var(--ink);font-weight:600}
.rm .new{background:var(--card);border:1.5px solid var(--brass);border-radius:10px;padding:12px 13px 11px;font-size:11.5px;line-height:1.45;color:var(--ink-soft);box-shadow:0 4px 16px rgba(43,39,35,.07)}
.rm .new .n{font:600 11px 'Inter';letter-spacing:.08em;text-transform:uppercase;color:var(--brass);margin-bottom:3px}
.rm .new .fn{font:600 15.5px 'Cormorant Garamond',serif;color:var(--ink);line-height:1.2;margin-bottom:6px}
.rm .new .fn b{color:var(--brass)}
.rm .new ul{list-style:none}
.rm .new li::before{content:"◆ ";color:var(--brass);font-size:8px}
.rm .new li.dep{border:1px dashed var(--ink-faint);border-radius:6px;padding:3px 6px;margin-top:4px;color:var(--ink-faint)}
.rm .new li.dep::before{content:"◇ ";color:var(--ink-faint)}
.rm .finish{flex:1.1;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;background:var(--red);border-radius:12px;padding:12px 10px 10px;box-shadow:0 8px 26px rgba(176,67,46,.22)}
.rm .finish .cap{color:#FBF3EE;padding:6px 4px 12px}
.rm .finish .cap .v{font:600 30px 'Cormorant Garamond',serif;line-height:1}
.rm .finish .cap .v small{display:block;font:600 10px 'Inter';letter-spacing:.1em;text-transform:uppercase;color:#F3D2C8;margin-top:5px}
.rm .finish .cap p{font:italic 500 13.5px 'Cormorant Garamond',serif;line-height:1.35;margin-top:10px}
.rm .finish .tile{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.55);color:#FBF3EE}
.rm .finish .tile:hover{background:rgba(255,255,255,.2)}
.rm .finish .tile .n{color:#FBF3EE}
.rm .finish .tile .f b{color:#FFFFFF}
.rm .timeline{display:flex;gap:14px;margin-top:10px;border-top:2px solid var(--brass);padding-top:8px}
.rm .timeline div{flex:1;text-align:center;font:600 10.5px 'Inter';letter-spacing:.06em;text-transform:uppercase;color:var(--brass)}
.rm .timeline div span{display:block;font:500 10px 'Inter';letter-spacing:0;text-transform:none;color:var(--ink-faint);margin-top:2px}
.rm .timeline div.red{flex:1.1;color:var(--red)}
.rm .aside{display:flex;gap:14px;align-items:flex-start;margin-top:16px}
.rm .lux{flex:0 0 340px;border:1.5px dashed var(--ink-faint);border-radius:10px;padding:10px 13px;font-size:11.5px;line-height:1.45;color:var(--ink-soft);background:var(--paper)}
.rm .lux b{color:var(--ink)}
.rm .note{flex:1;font-size:11.5px;color:var(--ink-faint);line-height:1.5;padding-top:6px}
.rm .note b{color:var(--ink-soft);font-weight:500}
.rm .slide{border-top:1px solid var(--border);padding-top:30px;scroll-margin-top:64px}
.rm .slide .kicker{font:600 10.5px 'Inter';letter-spacing:.1em;text-transform:uppercase;color:var(--brass)}
.rm .slide .kicker.red{color:var(--red)}
.rm .slide h2{font:600 28px 'Cormorant Garamond',serif;margin-top:4px}
.rm .slide h2 b{color:var(--brass)}
.rm .slide .when{font-size:12.5px;color:var(--ink-soft);margin-top:4px}
.rm .cols{display:flex;gap:14px;margin-top:20px;align-items:flex-start}
.rm .scol{flex:1;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:15px 16px}
.rm .scol.linen{background:var(--linen)}
.rm .scol.you{flex:.8;background:var(--paper);border:1.5px solid var(--brass)}
.rm .scol h3{font:600 10.5px 'Inter';letter-spacing:.08em;text-transform:uppercase;color:var(--brass);margin-bottom:8px}
.rm .scol ul{list-style:none;font-size:12.2px;line-height:1.5;color:var(--ink-soft)}
.rm .scol li{margin-bottom:5px}
.rm .scol li::before{content:"◆ ";color:var(--brass);font-size:8px}
.rm .scol li b{color:var(--ink)}
.rm .scol li.out{color:var(--ink-faint)} .rm .scol li.out::before{content:"— ";color:var(--ink-faint)}
.rm .scol li.dep{border:1px dashed var(--ink-faint);border-radius:6px;padding:3px 6px;color:var(--ink-faint)}
.rm .sub{font:600 10px 'Inter';letter-spacing:.07em;text-transform:uppercase;color:var(--ink-faint);margin:10px 0 5px}
.rm .unk{border:1.5px solid var(--red);background:var(--red-soft);border-radius:8px;padding:8px 10px;margin:8px 0;font-size:11.8px;line-height:1.45;color:var(--ink-soft)}
.rm .unk .lbl{font:600 9.5px 'Inter';letter-spacing:.08em;text-transform:uppercase;color:var(--red);display:block;margin-bottom:2px}
.rm .unk b{color:var(--ink)}
.rm .unk.ours{border-style:dashed;background:#FFFFFF}
.rm .v1band{margin-top:22px;background:var(--red);color:#FBF3EE;border-radius:12px;padding:18px 22px;display:flex;gap:26px;align-items:center}
.rm .v1band .big{font:600 38px 'Cormorant Garamond',serif;line-height:1;white-space:nowrap}
.rm .v1band .big small{display:block;font:600 10.5px 'Inter';letter-spacing:.1em;text-transform:uppercase;color:#F3D2C8;margin-top:6px}
.rm .v1band p{font:italic 500 17px 'Cormorant Garamond',serif;line-height:1.35}
.rm .pager{font-size:10.5px;color:var(--ink-faint);margin-top:26px;text-align:right}

/* the added layer: a line that opens a surface, and its status */
.rm li.clk{cursor:pointer;border-radius:6px;margin-left:-5px;padding-left:5px;transition:background .15s}
.rm li.clk:hover,.rm li.clk.on{background:var(--brass-soft)}
.rm li.clk:focus-visible,.rm .clk-block:focus-visible{outline:2px solid var(--brass);outline-offset:2px}
.rm .clk-block{cursor:pointer}
.rm .clk-block:hover{filter:brightness(1.03)}
.rm .st{display:inline-block;font:600 8.5px 'Inter';letter-spacing:.07em;text-transform:uppercase;border-radius:99px;padding:1px 6px;margin-left:2px;vertical-align:1px;white-space:nowrap}
.rm .st-built{color:var(--done);background:#E7F0EA;border:1px solid #CFE0D5}
.rm .st-lab{color:var(--brass);background:var(--brass-soft);border:1px solid #E2D4B8}
.rm .st-partial{color:var(--ink-soft);background:var(--linen);border:1px solid var(--border)}
.rm .st-gap{color:var(--ink-faint);background:transparent;border:1px dashed var(--ink-faint)}
.rm .st-onred{margin:12px 0 0;color:#FBF3EE;background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.5)}
.rm .key{position:sticky;top:0;z-index:5;background:rgba(250,248,243,.94);backdrop-filter:blur(6px);border-bottom:1px solid var(--border)}
.rm .key-in{max-width:1100px;margin:0 auto;padding:10px 40px;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;font-size:12px;color:var(--ink-soft)}
.rm .key-in b{color:var(--ink)}
.rm .key .st{font-size:9px}
.rm .key-src{margin-left:auto;font-size:11px;color:var(--ink-faint)}

/* the panel */
.rm .scrim{position:fixed;inset:0;background:rgba(43,39,35,.18);z-index:20}
.rm .panel{position:fixed;top:12px;right:12px;bottom:12px;width:min(74vw,1200px);z-index:21;background:var(--card);border:1px solid var(--border);border-radius:14px;box-shadow:0 18px 60px rgba(43,39,35,.18);padding:20px 22px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;animation:rm-in .22s cubic-bezier(.2,0,0,1)}
@keyframes rm-in{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
.rm .panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.rm .panel-head .st{margin-left:0;font-size:9px}
.rm .panel-title{font:600 26px 'Cormorant Garamond',serif;margin-top:6px;line-height:1.1}
.rm .x{border:1px solid var(--border);background:var(--paper);border-radius:99px;width:30px;height:30px;font-size:18px;line-height:1;color:var(--ink-soft);cursor:pointer;flex:none}
.rm .x:hover{background:var(--linen)}
.rm .panel-note{font-size:13px;line-height:1.55;color:var(--ink-soft);max-width:70ch}
.rm .panel-meta{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11.5px;color:var(--ink-faint)}
.rm .open{font:600 12px 'Inter';color:var(--brass);text-decoration:none;border:1.5px solid var(--brass);border-radius:99px;padding:5px 12px;white-space:nowrap}
.rm .open:hover{background:var(--brass-soft)}
.rm .frame{position:relative;width:100%;overflow:hidden;border-radius:10px;border:1px solid var(--border);background:#F2F0EC;flex:none}
.rm .frame iframe{border:0;display:block}
@media (max-width:900px){.rm .stacks,.rm .cols,.rm .aside{flex-direction:column;align-items:stretch}.rm .lux{flex:none}.rm .panel{width:auto;left:12px}.rm .key-src{margin-left:0}}
`;
