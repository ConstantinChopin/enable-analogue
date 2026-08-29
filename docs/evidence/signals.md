# Evidence: advisor signals (verbatim, dated)

Verbatim quotes from partner-agency weekly calls and product labs, grouped by theme. Names reduced to role ("an advisor", "the agency lead", "the program director") for the analogue environment; dates kept. Journey specs cite these as SIG-nn.

## Trust and answer quality

| ID | Signal | Date | Context |
|---|---|---|---|
| SIG-01 | "I still don't want to use it to write emails... I don't want to rely on information it gives me because it's just information from the Internet." | 2026-04-16 | advisor on generic AI; the trust boundary the answer contract exists for |
| SIG-02 | A DMC "sent a list of restaurants and half of them were no longer in operation... if we're leaning on our partners for their local insights and then they're using [ChatGPT] as well..." | 2026-03-05 | trust chain breakdown; verification cannot be outsourced |
| SIG-03 | "I had a Hawaii list that I took off the Internet... found out that this was pre-Covid. So a lot of those restaurants were closed already." | 2026-04-30 | freshness as the failure axis, not correctness at write time |
| SIG-04 | "I found some that were temporarily closed, but in fact they're not temporarily closed. They're just very hard to get into." | 2026-04-30 | external status signals produce false positives; two-state distinction needed |
| SIG-05 | "It's better than AI because it's all of our proprietary data that's been vetted." | 2026-04-23 | the agency lead positioning the product; internal-first retrieval |

## Conflict, provenance, layers

| ID | Signal | Date | Context |
|---|---|---|---|
| SIG-10 | Room-name drift: "Literally every single time I do a booking I am looking at the website at the same time... sometimes I even look at the square footage." | 2026-05-21 | same fact, two sources, both authoritative-looking; show-both is the honest UI |
| SIG-11 | Commission arrives "under a traveler name instead of the primary"; properties like "Currency Cloud" and "Pipery Hotel" unresolvable | 2026-04-23 | entity-resolution failures are a normal state, not an exception |
| SIG-12 | "We want sharing appropriate data, but we want to make sure we're not sharing sensitive data... as far as client data." | 2026-04-30 | the agency lead; three-tier privacy is the rollout gate |
| SIG-13 | The agency lead "is currently doing data security testing" before broader access rolls out | 2026-04-30 | governance is a launch dependency, not a feature |

## Advisories and time-bound intelligence

| ID | Signal | Date | Context |
|---|---|---|---|
| SIG-20 | Mandarin "20% commission until June... I've never seen them do that before... obsolete come July 1st" | 2026-04-23 | time-bound value with a hard expiry; missing it costs real money |
| SIG-21 | "Sometimes we read our email, sometimes we don't. And it's always the one time we might not." | 2026-04-30 | why advisories must live in the product, not the inbox |
| SIG-22 | "I had 9 couples that were upset because their advisors didn't register them... you can't do it at the time of booking. That's where it falls through the cracks." | 2026-05-28 | deferred actions need triggers, not memory; the anti-case for naive expiry |
| SIG-23 | Advisories staying open too long is also a failure: "stale advisory review" nudge required | 2026-03-31 | the tension DEC-03 resolves; neither auto-expire nor immortality |

## Commissions and the working day

| ID | Signal | Date | Context |
|---|---|---|---|
| SIG-30 | An ops person's retired mother chases unpaid commissions "from 2023 and 2024 even" | 2026-05-07 | the human recovery agent the product replaces |
| SIG-31 | "When the hotels give the client a credit, then you don't get that commission protection... it has to be paid in full." | 2026-05-07 | silent commission-loss edge case at cancellation |
| SIG-32 | "If you had a dashboard that you just sat down at your desk and that was the first thing that you're viewing in the morning" | 2026-04-30 | briefing room as default entry point |
| SIG-33 | A cancellation "didn't actually cancel. Luckily I followed up with every hotel... they had no record of it." | 2026-05-21 | silent failure; verification loops as product behavior |
| SIG-34 | "The whole industry is fed up with Onyx. This is a big move." (LHW → Hex, ~800 hotels) | 2026-05-28 | commission infrastructure is tracked by hand today |
| SIG-35 | Nothing sends itself: reminder drafted, "an advisor reads it, edits it and sends it" | design principle, validated across calls | a tool that emails a client on its own would be switched off in a week |

## Sync and system latency

| ID | Signal | Date | Context |
|---|---|---|---|
| SIG-36 | "I have advisors in the office, like, what happened? It's not there. I'm like, well it's not gonna be there because we have a 48-hour sync." (TripSuite→Virtuoso 24–48h sync) | 2026-05-28 | sync latency is a lived reality; UIs must show last-synced state, not pretend immediacy |
| SIG-37 | Marketing config failure modes: billing-vs-mailing address gotcha, logo-not-set silent failure, per-client report nobody knew existed | 2026-05-28 | silent configuration failure is a recurring class |

## Currency and data integrity

| ID | Signal | Date | Context |
|---|---|---|---|
| SIG-38 | Smart-upload currency bug: "If you're doing an upload and it's in a different currency... it matches the euro to the US Dollar. So you need to refresh it... so that you don't accidentally send it to a client in the wrong pricing." — "That's big." | 2026-04-02 | silent FX conversion is a client-facing integrity risk; conversions must be visible and dated |

## Ingestion and extraction confirmation

| ID | Signal | Date | Context |
|---|---|---|---|
| SIG-43 | The PM's forward-to-Enable concept: advisors forward content "the same you would to a friend"; AI extracts product mentions, proposes collection assignments; **"advisor confirms in one tap"** — extraction lands only after human confirmation | 2026-04-30 | HITL confirmation designed into ingestion from the first pitch |
| SIG-44 | Database reality: 3,280 properties with 7 fields; **93% of amenities entries are template boilerplate** ("View Hotel" copy), not real editorial content; 2026 openings only 9% covered | 2026-03 intelligence update | extracted metadata cannot be trusted raw; curation/confirmation is the value layer |

## Client intelligence

| ID | Signal | Date | Context |
|---|---|---|---|
| SIG-47 | Unified client profile ask: pull "all of that historical data from TripSuite, from Axus, from all the other places"; "Over the past 10 trips they've spent an average of X... consolidate what style they may like"; "Your data is at your fingertips instead of things being disjointed" | 2026-04-23 | grounds traveller trip-history aggregation and derived-preference value |

## Notes, sharing scope, privacy tiers

| ID | Signal | Date | Context |
|---|---|---|---|
| SIG-45 | "[An advisor] can go in and say [their] notes — great for corporate... you don't necessarily have to be on this call to retrieve that information." | 2026-04-30 | the agency lead pitching shared notes live; notes are attributed and retrievable across the team |
| SIG-46 | Two scope taxonomies named in the same 2026-04-30 material: entity-level three-tier **private / agency / alliance**; and the advisor-note product need's `privacy_scope`: **private / team / agency-wide** ("private / team / agency-wide"). Financial data stays private even when notes are shared — "[the finance lead] would have your company dashboard... that nobody else can see"; "we want sharing appropriate data, but we want to make sure we're not sharing sensitive data" | 2026-04-30 | note-level scope grounds private/team/organization in the analogue (alliance tier out of analogue scope); field-level privacy for financials; the rollout gate |

## Knowledge capture

| ID | Signal | Date | Context |
|---|---|---|---|
| SIG-40 | 14 properties shared verbally in 17 minutes, headed to tribal memory | 2026-05-21 | rapid-share capture; structure at the moment of speech |
| SIG-41 | "Do we have a place on the Internet where all these meet-and-greet services are listed?" — answer: no | 2026-05-21 | users write product briefs out loud; capture is the job |
| SIG-42 | Advisors run 14 personal systems: Trello, Beli, Google Maps on a maiden-name email, a literal Rolodex, a Claude folder | 2026-04-30 | the shared-brain thesis; import paths matter |
