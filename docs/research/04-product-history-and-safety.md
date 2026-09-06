# Product History and Safety Research

Research memo for **claude-omegle**: a 1:1 video call with a stranger who is also waiting on their AI coding agent, auto-hung-up when either agent finishes.

Scope: what random-video products did, why they lived or died, what trust and safety patterns actually worked, the minimum honest legal posture for a hobby project, the liquidity problem, and a prior-art scan.

Every claim carries a URL. Claims that could only be traced to a search-result summary or a self-interested source are marked **(unverified)**. Nothing here is legal advice.

Date of research: 2026-09-05.

---

## 1. Timeline

| Product | Years | What it did | Why it lived / died | Lesson for claude-omegle |
|---|---|---|---|---|
| [Omegle](https://en.wikipedia.org/wiki/Omegle) | 2009-2023 | Anonymous 1:1 text, then video (Mar 2010). No accounts. Instant "next". | Died 8 Nov 2023 after a product-liability suit brought on behalf of a woman abused via the site at age 11 survived Section 230 and went to mediation. | Anonymity plus no accounts plus instant re-roll is the exact feature set that generated the liability. |
| [Chatroulette](https://en.wikipedia.org/wiki/Chatroulette) | 2009-present | Random 1:1 video, built by a 17-year-old in "two days and two nights". | Exploded to ~1.5M users by Mar 2010, collapsed under explicit content, then rebuilt 2011-2020 around detection plus accounts. | The only survivor of the 2009 cohort is the one that added moderation and registration. |
| [Portals](https://en.wikipedia.org/wiki/Portals_(initiative)) (Shared_Studios) | 2014-present | Gold shipping containers, life-size video between cities, staffed. | Still running in ~50 cities. Curators on both ends schedule and host every connection. | Staffed and scheduled beats open and anonymous. No public incident record found. |
| [Airtime](https://en.wikipedia.org/wiki/Airtime.com) | 2012 | Parker and Fanning group video "rooms", $25M raised. | Glitchy celebrity launch, desktop-only, no reason to return. Effectively empty by Oct 2013. | A social product with no recurring trigger has no reason to be opened twice. |
| [Houseparty](https://en.wikipedia.org/wiki/Houseparty_(app)) | 2016-2021 | Group video with friends, ambient "who is online" presence. | 50M downloads by Apr 2020, shut Oct 2021 when lockdowns ended and Epic redeployed the team. | Presence-driven social video works when a real-world condition forces people into it. That condition expires. |
| [Focusmate](https://www.focusmate.com/) | 2016-present | Scheduled 25/50/75-minute silent video coworking with a stranger. | Alive and paid. Accounts, real display names, timeliness scoring, no recording. | The proven safe design for stranger-video-while-working. Copy it. |
| [Caveday](https://www.caveday.org/) / [Flow Club](https://www.flow.club/) | 2017- / 2020- | Hosted group focus sessions, music, stated goals. | Alive, subscription-funded, host-led. | A human host removes the empty-room problem and most of the moderation problem at once. |
| [Monkey](https://www.internetmatters.org/advice/apps-and-platforms/social-media/monkey-app/) | 2016-present | 15-second random video chat aimed at teens. | Pulled from the Apple App Store around Sept 2018 over safety complaints **(unverified date)**; still on web and Android. | Teen-facing random video is the fastest path to an app-store removal. |
| [Clubhouse](https://en.wikipedia.org/wiki/Clubhouse_(app)) | 2020-present | Invite-only drop-in audio rooms. | ~$4B valuation and 8.1M downloads by Feb 2021, growth stalled weeks later, staff halved Apr 2023. | Invite-only scarcity creates the early community. Dropping the gate did not save it. |
| [The Portal](https://techcrunch.com/2024/05/20/nyc-dublin-real-time-video-portal-reopens-with-some-fixes-to-prevent-inappropriate-behavior) (NY-Dublin) | 2024 | Open-air 24/7 live video sculpture between two cities. | Closed within a week over flashing and trolling, reopened with hours, guards, fencing and an ML blur failsafe. | An unmoderated always-on video link between strangers degrades in under a week, even in public, in daylight, with no anonymity. |
| Omegle clones (Uhmegle, OmeTV, Emerald, Hay) | 2023-present | "Omegle is back" marketing on new domains. | Alive, largely ad and affiliate funded. Safety claims are self-reported **(unverified)**. | The demand did not disappear. Neither did the failure mode. |

---

## 2. Omegle

### Launch and design

Leif K-Brooks built Omegle in Brattleboro, Vermont and launched it in March 2009 at age 18. It drew roughly 150,000 daily page views within weeks. Video chat arrived in March 2010. ([Wikipedia](https://en.wikipedia.org/wiki/Omegle))

The design was the product: no registration, random pairing, and a one-click move to the next stranger. The original age floor was 13 with parental consent, raised to 18 and over in 2022. ([Wikipedia](https://en.wikipedia.org/wiki/Omegle))

### Scale

Per Semrush data cited in BBC-derived reporting, Omegle grew from about 34 million monthly visits in January 2020 to about 65 million in January 2021, roughly 91 percent growth. ([Malwarebytes coverage of the BBC investigation](https://www.malwarebytes.com/blog/news/2021/02/omegle-investigation-raises-new-concerns-for-kids-safety))

In 2022 Omegle filed over 608,000 reports to the National Center for Missing and Exploited Children, compared with more than 5 million from Instagram and more than 21 million from Facebook. ([NBC News](https://www.nbcnews.com/tech/social-media/omegle-shut-down-did-why-leif-k-brooks-shutdown-alternatives-rcna124393))

### Moderation approach

Omegle labelled its main video chat with an on-site notice, "Video is monitored. Keep it clean!", and flagged IP addresses of users showing nudity. It had no broadcast delay, and no profanity filter at all before early 2013. ([Wikipedia](https://en.wikipedia.org/wiki/Omegle), [Malwarebytes / BBC](https://www.malwarebytes.com/blog/news/2021/02/omegle-investigation-raises-new-concerns-for-kids-safety))

Alongside the monitored section, Omegle offered an unmoderated section reachable by clicking through an 18-plus warning box, which an underage user could simply accept. **(unverified: this specific description traces to secondary safety-guide coverage of the BBC investigation, not to a primary source I could fetch.)** ([Internet Matters](https://www.internetmatters.org/advice/apps-and-platforms/social-media/omegle/))

The BBC's February 2021 investigation is the sharpest evidence that the monitoring did not work. Over roughly 10 hours, investigators were connected with 12 men performing sexual acts and 8 naked males within a two-hour window, and were paired with dozens of apparent under-18s including children as young as seven or eight. ([Malwarebytes / BBC](https://www.malwarebytes.com/blog/news/2021/02/omegle-investigation-raises-new-concerns-for-kids-safety))

### The lawsuits: two cases that point in opposite directions

**A.M. v. Omegle.com LLC** (D. Or., 2021-2023) is the one that killed the product. An 11-year-old was randomly paired with a man in his late thirties who coerced her into producing sexual imagery. Her lawyers pleaded it as **product liability**, not as publication: defective design, negligent design, and failure to warn. In July 2022 (614 F. Supp. 3d 814, D. Or., 13 July 2022) Judge Michael W. Mosman denied Omegle's motion to dismiss, writing "Omegle argues it should be entitled to immunity. I disagree." The court's reasoning was that Omegle would not have had to alter any user's content to satisfy the duty alleged, only its own design and warnings. ([C.A. Goldberg](https://www.cagoldberglaw.com/omegle-lawsuit-cagoldberg-section-230/), [Eric Goldman](https://blog.ericgoldman.org/archives/2022/07/omegle-denied-section-230-dismissal-am-v-omegle.htm), [Internet Cases](https://internetcases.com/2022/07/17/section-230-immunity-did-not-protect-omegle-in-product-liability-lawsuit/))

The case resolved through mediation, and shutdown was reportedly a settlement term. ([NBC News](https://www.nbcnews.com/tech/social-media/omegle-shut-down-did-why-leif-k-brooks-shutdown-alternatives-rcna124393), [C.A. Goldberg](https://www.cagoldberglaw.com/omegle-lawsuit-cagoldberg-section-230/))

**M.H. v. Omegle.com LLC** (11th Cir., decided 9 December 2024) is the counterweight, and it matters for calibrating fear. On nearly identical facts, another 11-year-old coerced by a stranger on Omegle, the Eleventh Circuit **affirmed** Section 230 immunity. The claims there were statutory (Masha's Law, 18 U.S.C. 2255, and the TVPRA), and the court held the FOSTA carve-out requires **actual** knowledge, not constructive knowledge or deliberate indifference. Judge Lagoa dissented on the child-pornography claim. ([Volokh / Reason](https://reason.com/volokh/2024/12/10/eleventh-circuit-rejects-federal-child-porn-sex-trafficking-claims-against-video-chat-service-omegle/), [11th Cir. opinion PDF](https://media.ca11.uscourts.gov/opinions/pub/files/202210338.pdf))

The synthesis: **Section 230 still protects you from what your users say and do. It does not reliably protect you from how you built the matching.** That is the single most transferable legal fact in this memo.

### The shutdown statement, November 8 2023

Key lines, quoted:

> "There can be no honest accounting of Omegle without acknowledging that some people misused it, including to commit unspeakably heinous crimes."

> "I thank A.M. for opening my eyes to the human cost of Omegle."

> "the stress and expense of this fight ... are simply too much" **(unverified verbatim: this line appears only in search-engine summaries; I could not confirm it against a fetched page.)**

> "Operating Omegle is no longer sustainable, financially nor psychologically. Frankly, I don't want to have a heart attack in my 30s."

> "Omegle punched above its weight in content moderation"

> "The battle for Omegle has been lost, but the war against the Internet rages on."

K-Brooks also said the site had used "state-of-the-art AI" plus moderation staff, and had "worked with law enforcement agencies, and the National Center for Missing and Exploited Children, to help put evildoers in prison where they belong." He compared the demands on Omegle to "Shutting down Central Park because crime occurs there". ([NBC News](https://www.nbcnews.com/tech/social-media/omegle-shut-down-did-why-leif-k-brooks-shutdown-alternatives-rcna124393), [NPR](https://www.npr.org/2023/11/09/1211807851/omegle-shut-down-leif-k-brooks), [Lawfare](https://lawfaremedia.org/article/what-the-omegle-shutdown-means-for-section-230))

### What specifically made Omegle dangerous

1. **No accounts.** Nothing to ban, nothing to build a reputation on, nothing to lose. A ban cost a user one IP change.
2. **Anonymity by default.** No identity meant no social cost for behaviour that would end a friendship in any named context.
3. **Video on by default, immediately.** The first frame of a connection was already the harm surface. There was no ramp, no consent step, no text-first phase.
4. **Instant "next".** The re-roll turned the platform into a slot machine for offenders: infinite attempts, zero cost per attempt. This is the feature that converts a low base rate into a near-certain encounter over a session.
5. **Minors present in practice.** The age gate was a click. The BBC found children as young as seven or eight. A random matcher with minors in the pool will eventually pair a child with a predator, which is precisely the design-defect theory A.M. pleaded.
6. **No broadcast delay.** Detection had no window in which to act before the frame reached the other person. ([Wikipedia](https://en.wikipedia.org/wiki/Omegle))

---

## 3. Chatroulette

Andrey Ternovskiy launched Chatroulette on 16 November 2009 as a 17-year-old high-school student in Moscow, writing the first version in "two days and two nights". By March 2010 he estimated about 1.5 million users, roughly a third in the US. ([Wikipedia](https://en.wikipedia.org/wiki/Chatroulette))

The collapse figure that everyone cites: a 2010 RJMetrics survey of 2,883 sessions found about **one in eight** spins produced R-rated content, that single-person feeds were 89 percent male, and that a user was twice as likely to see a sign requesting female nudity as to see actual female nudity. ([Washington Post](https://www.washingtonpost.com/wp-dyn/content/article/2010/03/16/AR2010031602155.html), [Wikipedia](https://en.wikipedia.org/wiki/Chatroulette))

### The twelve-year moderation grind

Ternovskiy has been explicit that this was a decade-long product problem, not a one-time fix.

- **2011:** face and flesh recognition developed with university partners, filtering roughly 60 percent of offensive material. ([Vice](https://www.vice.com/en/article/chatroulette-moderation-penis-problems/), [Wikipedia](https://en.wikipedia.org/wiki/Chatroulette))
- **Two-choice matching** borrowed from Tinder, giving users a limited selection instead of pure randomness. ([Vice](https://www.vice.com/en/article/chatroulette-moderation-penis-problems/))
- **Human monitors:** seven Russian women hired as undercover testers checking site conditions hourly. ([Vice](https://www.vice.com/en/article/chatroulette-moderation-penis-problems/))
- **December 2020:** partnership with [Hive](https://thehive.ai/) for automated flagging of explicit video. Hive processed over 600 million frames. ([Wikipedia](https://en.wikipedia.org/wiki/Chatroulette), [Techdirt case study](https://www.techdirt.com/2021/02/24/content-moderation-case-study-chatroulette-leverages-new-ai-to-combat-unwanted-nudity-2020/))
- **Two channels:** a moderated "Random Chat" designed to exclude objectionable content, and a separate **Unmoderated** channel. The unmoderated channel was eliminated in mid-2021. ([Techdirt](https://www.techdirt.com/2021/02/24/content-moderation-case-study-chatroulette-leverages-new-ai-to-combat-unwanted-nudity-2020/), [Unite.AI](https://www.unite.ai/chatroulette-returns-with-the-help-of-ai-driven-content-moderation/))
- **Registration:** Chatroulette now requires a free account with username, email and password before access. ([Wikipedia](https://en.wikipedia.org/wiki/Chatroulette))

Note on framing: the task described this as "Random vs Filtered". The sources say **Random (moderated) vs Unmoderated**, and the unmoderated side was killed. The requirement of face detection before matching is **(unverified)**; what is documented is face and flesh recognition used as a filter from 2011, not as a precondition to entering the queue.

Ternovskiy's own framing is worth keeping: "I don't want to create some fancy solution that looks at the shape of the penis. It's stupid." His later direction was reputation scoring and an internal currency to make good conversation the incentivised behaviour. ([Vice](https://www.vice.com/en/article/chatroulette-moderation-penis-problems/))

### What actually worked

Detection alone got to about 60 percent. What moved the product from joke to viable was the combination: automated detection **plus** accounts **plus** deleting the unmoderated escape hatch **plus** reducing pure randomness. User numbers more than doubled between 2019 and 2020 after these changes. ([Unite.AI](https://www.unite.ai/chatroulette-returns-with-the-help-of-ai-driven-content-moderation/))

---

## 4. The Portals

### The New York to Dublin Portal, 2024

Conceived by Lithuanian artist Benediktas Gylys, the Portal opened in early May 2024 as an open-air, 24/7 live video link between Fifth Avenue at 23rd Street in Manhattan and North Earl Street in Dublin. ([TechCrunch](https://techcrunch.com/2024/05/20/nyc-dublin-real-time-video-portal-reopens-with-some-fixes-to-prevent-inappropriate-behavior))

It lasted less than a week. Documented incidents included an OnlyFans model exposing herself, a man mooning the camera, Dublin-side displays of swastikas and images of the burning Twin Towers, and people pressing phones directly against the lens to block the view. ([TechCrunch](https://techcrunch.com/2024/05/20/nyc-dublin-real-time-video-portal-reopens-with-some-fixes-to-prevent-inappropriate-behavior), [Rolling Stone](https://www.rollingstone.com/culture/culture-features/new-york-dublin-portal-issues-flashing-9-11-memes-1235022182/))

It was taken offline around 13 May and reopened Sunday 19 May 2024, a closure Forbes framed as six days. ([Forbes](https://www.forbes.com/sites/conormurray/2024/05/19/the-viral-dublin-new-york-portal-reopens-after-6-day-shutdown-over-flashing-inappropriate-behavior/))

Mitigations on reopening:

- **Hours.** No longer 24/7. 6am to 4pm New York, 11am to 9pm Dublin. ([TechCrunch](https://techcrunch.com/2024/05/20/nyc-dublin-real-time-video-portal-reopens-with-some-fixes-to-prevent-inappropriate-behavior), [NBC New York](https://www.nbcnewyork.com/news/local/nyc-dublin-portal-reopens-inappropriate-behavior-tech-issues/5427467/))
- **Staff.** One or two on-site guides during all operating hours, plus security. ([TechCrunch](https://techcrunch.com/2024/05/20/nyc-dublin-real-time-video-portal-reopens-with-some-fixes-to-prevent-inappropriate-behavior), [Fox News](https://www.foxnews.com/us/nyc-art-portal-dublin-reopens-added-security-measures-shutdown-bad-behavior))
- **Physical distance.** Non-permanent fencing and spacing decals so nobody can get close enough to fill the frame. This is the physical equivalent of "no going too close".
- **Automatic blur.** Machine learning that blurs both the local and remote feeds when someone obstructs the camera beyond a set duration, with warning signage shown at the blocking location. The blur hits **both sides**, which makes the whole crowd bear the cost of one person's behaviour.

The Portal is the cleanest natural experiment available. Strangers, live video, no anonymity, in daylight, in public, with social pressure from an actual crowd. It still degraded in under a week. The fixes that worked were **restricted hours, human presence, physical framing constraints, and an automatic degrade-to-blur.** Note that not one of them was identity verification.

### Shared_Studios Portals

A separate and much older project, frequently confused with the above. Artist Amar Bakshi started Portals in 2014, connecting New York and Tehran first, using gold-painted shipping containers with life-size immersive video inside. It has run in nearly 50 cities across museums, universities, refugee camps and arts centres. ([Wikipedia](https://en.wikipedia.org/wiki/Portals_(initiative)), [Artnet](https://news.artnet.com/exhibitions/times-square-portal-to-the-world-1116746), [Shared_Studios](https://www.sharedstudios.com/about))

**I found no reported safety incidents for Shared_Studios Portals in twelve years of operation.** That absence is itself the finding, and the mechanism is visible in the model: every Portal has local **curators** who schedule connections and run curated programming, so a session is a hosted, booked, supervised conversation rather than an open channel. ([Shared_Studios](https://www.sharedstudios.com/about), [Washingtonian](https://washingtonian.com/2015/09/02/portals-clarice-shared-studios-nextnow/))

Staffed and scheduled: zero known incidents over a decade. Open and always-on: under a week.

---

## 5. Focusmate and the coworking cluster

Focusmate is the direct ancestor of claude-omegle: stranger, live video, working side by side, with a real safety record.

### How the session is built

Book a slot, get matched, greet each other and **say your goal out loud**, work with cameras on for 25, 50 or 75 minutes, then check in at the end and celebrate progress. Microphones are typically muted for the work block. ([Focusmate FAQ](https://www.focusmate.com/faq/))

**Why silence works** is not incidental, it is the core safety mechanism. The session has an explicit, stated, non-social purpose. Conversation is scoped to two short bookends. There is no open-ended interaction window in which things can go wrong, and "we are here to work" is a socially legible reason to refuse anything else. Compare Omegle, where the purpose was undefined and therefore filled by whatever the participants wanted.

### The safety stack

- **Accounts and real display names.** Members must use a real name in the Latin alphabet so a partner knows what to call them. It need not be a legal name, but impersonation is prohibited. ([Community Guidelines](https://www.focusmate.com/community/), [Terms](https://www.focusmate.com/terms/))
- **Age floor of 17.** "The age requirement to own a Focusmate account is 17 years or older." Accounts entering an underage birthdate may be disabled. ([Terms](https://www.focusmate.com/terms/))
- **Timeliness score.** Lateness and no-shows are detected, reduce your score, and can freeze the account. ([FAQ](https://www.focusmate.com/faq/))
- **Report and block.** A report button lives on every appointment card. Reported members are warned, suspended or banned. ([FAQ](https://www.focusmate.com/faq/), [Trust & Safety](https://support.focusmate.com/en/collections/2523106-trust-safety))
- **No recording.** "Sessions are never recorded." ([FAQ](https://www.focusmate.com/faq/))
- **Explicit conduct rules.** Selling, flirting, sexual harassment and discriminatory comments are prohibited, published as five short community rules. ([Five community rules](https://support.focusmate.com/en/articles/4044467-the-five-community-rules))

### Pricing

Free tier is up to three sessions per week, no credit card. Focusmate Plus is $8 per month billed annually or $12 per month billed monthly for unlimited sessions. ([FAQ](https://www.focusmate.com/faq/))

The free tier matters for a different reason than revenue: a per-week cap is an anti-abuse mechanism. Someone trying to find a victim through random matching cannot take a hundred spins.

### Flow Club and Caveday

**Flow Club** runs 2,500+ hosted sessions weekly. You book a time, state your goal out loud, and work in quiet company while a host plays focus music. $40 per month or $400 per year, with 50 percent discounts for students, non-profits, and members who host. ([Flow Club](https://www.flow.club/), [Flat.social review](https://flat.social/guides/flow-club-review))

**Caveday** is the same shape with a human facilitator per session and a broader offering. ([Caveday](https://www.caveday.org/), [Caveday vs Flow Club](https://www.caveday.org/caveday-vs-flow-club))

The pattern across both: **a host is a moderator you do not have to build.** For a group format that is cheaper than any classifier. It does not transfer directly to 1:1, which is worth noting as a real cost of the 1:1 choice.

### Body doubling research

The mechanism claude-omegle would be exploiting has a name and a small literature, but the evidence is thin and you should not overclaim.

The main empirical work is Eagle, Baltaxe-Admony and Ringland, who surveyed 220 people about how, when and why they body double. They found most people had used it long before learning the term, that partners range from family to strangers online, and they proposed a two-part model of body doubling as a continuum of space/time and mutuality. Presented at ASSETS 2023, expanded in ACM TACCESS. ([ASSETS 2023](https://dl.acm.org/doi/10.1145/3597638.3614486), [TACCESS](https://dl.acm.org/doi/full/10.1145/3689648))

The honest summary of the state of evidence: no controlled experiments have established effectiveness, mechanisms remain unclear, and reported effects range from helpful to distracting. ([Medical News Today](https://www.medicalnewstoday.com/articles/body-doubling-adhd)) Later work is exploratory, including EEG studies and VR designs. ([ASSETS 2025 EEG](https://dl.acm.org/doi/full/10.1145/3663547.3759743), [arXiv VR](https://arxiv.org/pdf/2509.12153))

Design implication: the value proposition is presence and accountability, which people self-report as useful. Do not market it as a proven productivity intervention.

---

## 6. The other cautionary tales

### Airtime, 2012

Sean Parker and Shawn Fanning launched Airtime on 5 June 2012 after a $25M round led by Kleiner Perkins with a16z, Accel and Google Ventures participating. The launch press conference featured Snoop Dogg, Olivia Munn and Martha Stewart, and was glitchy: it started roughly an hour late and the celebrity video chats failed for almost ten minutes. By October 2013 there were nearly no active users. ([Wikipedia](https://en.wikipedia.org/wiki/Airtime.com), [Fortune](https://fortune.com/2012/06/05/airtime-makes-an-awkward-first-impression))

Diagnosis: desktop-only, a confusing use case, and buggy execution. ([Fortune, on the okhello relaunch](https://fortune.com/2014/02/25/exclusive-sean-parkers-airtime-has-quietly-relaunched-as-okhello-and-its-actually-working))

The transferable failure is the missing trigger. Airtime asked people to decide to socialise with strangers on video with no prompt and no reason. claude-omegle has the opposite property built in: **the agent finishing is an involuntary, recurring, externally generated trigger.** That is the single strongest thing about the concept, and it is what Airtime lacked.

### Houseparty, 2016-2021

Life On Air's app, launched February 2016, group video for up to eight people, with presence notifications when friends came online and the ability to lock a room. 17 million downloads in March 2020, 50 million by April 2020. Epic acquired it in 2019, shipped a Fortnite video-chat mode in November 2020, announced the shutdown on 9 September 2021 and ended service in October 2021. ([Wikipedia](https://en.wikipedia.org/wiki/Houseparty_(app)), [Variety](https://variety.com/2021/digital/news/houseparty-shutting-down-1235060236/), [TechCrunch](https://techcrunch.com/2021/09/09/epic-games-to-shut-down-houseparty-in-october-including-the-video-chat-fortnite-mode-feature/))

Why it succeeded: ambient presence. You did not schedule a Houseparty, you saw friends were around and dropped in. Why it died: usage fell hard once lockdowns lifted, it was not financially sustainable, and Epic redirected the team. ([Failory](https://www.failory.com/cemetery/houseparty), [Washington Post](https://www.washingtonpost.com/video-games/2021/09/09/houseparty-shut-down-epic-games-metaverse/))

Lesson: the external condition that forces people together is the product. When it expires, so does the product. Agent wait time is a more durable condition than a pandemic, but it is not permanent either.

### Clubhouse, 2020

Paul Davison and Rohan Seth founded it in fall 2019 as Talkshow, launched on iOS in March 2020, invite-only. 600,000 registered users by December 2020, invite codes selling for up to $400 on eBay, roughly 2 million weekly actives by January 2021, an approximately $4B valuation and 8.1 million downloads by mid-February 2021. Android arrived May 2021, the invite system was dropped on 21 July 2021, and users declined 21 percent in the three weeks from late February to early March 2021. Staff was halved in April 2023. ([Wikipedia](https://en.wikipedia.org/wiki/Clubhouse_(app)))

What the "hallway" taught: the home feed showed rooms from people you follow and clubs you belong to, recreating the feeling of drifting past conversations at a conference. Clubhouse also piped ambient background sound into rooms with no active speakers specifically to avoid dead air. ([Common Sense](https://www.commonsense.org/education/reviews/clubhouse-drop-in-audio-chat), [ProdLab](https://prodlab.substack.com/p/from-hype-to-hibernate-the-clubhouse))

Three transferable points: audio-only lowered the barrier to joining enormously compared with video; invite-only scarcity built the initial community and the loss of it did not save growth; and **dead air is a product bug that needs an explicit answer.**

### Monkey, 2016

Random 15-second video chat, heavily used by teenagers. Reported as removed from the Apple App Store in September 2018 after complaints about inappropriate behaviour, with reporting that around 2 percent of iOS reviews described unwanted sexual experiences. **(unverified: the September 2018 date and the review percentage trace to secondary consumer-safety coverage, not to Apple or primary reporting I could fetch.)** It remains accessible via mobile web and on Google Play. Age verification is a self-reported birthdate. ([Distractify](https://www.distractify.com/p/what-happened-to-the-monkey-app), [Internet Matters](https://www.internetmatters.org/advice/apps-and-platforms/social-media/monkey-app/), [Avast](https://www.avast.com/c-monkey-app))

### The clone wave after Omegle

Within days of the November 2023 shutdown, domains claiming to be "the new Omegle" appeared, and kept appearing through 2024. The audience split across OmeTV, Uhmegle, Monkey, CooMeet, Emerald Chat and Hay. ([VPNpro](https://vpnpro.com/guides-and-tutorials/best-omegle-alternatives/), [VPNoverview](https://vpnoverview.com/privacy/social-media/omegle-alternatives/))

**Hay** specifically is the mobile-first entrant: random video and text chat with gender, region and interest filters plus real-time translation, shipped as an Android app (com.hay.android) and a web app. Its safety claims of "advanced AI moderation and effective spam protection" are self-reported on its own marketing pages. **(unverified)** ([hay.fun](https://www.hay.fun/), [Google Play](https://play.google.com/store/apps/details?id=com.hay.android))

Every substantive safety claim I found for these platforms came from the platforms' own marketing pages or from SEO affiliate sites that rank them. Treat "AI moderation and 24/7 human oversight" claims as **unverified marketing**. Independent descriptions of the clone ecosystem describe affiliate funnels that redirect to paid cam sites and bot-padded chat that keeps you on the page for ad impressions. ([RandomChat blog](https://randomchat.io/blog/is-omegle-coming-back-in-2026), also self-interested)

The relevant lesson is not about them. It is that **the demand for random stranger video is enormous and permanent**, so if claude-omegle ever becomes publicly discoverable, it will attract that demand regardless of what it says it is for. Design for that now.

---

## 7. What made Omegle dangerous vs what made Focusmate safe

| Dimension | Omegle | Focusmate | What claude-omegle should do |
|---|---|---|---|
| Identity | None. No account, no name. | Account required, real display name, impersonation prohibited. ([Terms](https://www.focusmate.com/terms/)) | Account required. GitHub OAuth gives a name plus an aged, costly-to-replace identity. |
| Entry | Open to anyone with the URL. | Open signup, but with an account and a rules acceptance. | Invite code on top of OAuth for the MVP. |
| Age | 13, then 18, enforced by a click. | 17+, disabled on underage birthdate. ([Terms](https://www.focusmate.com/terms/)) | 18+ stated, gated on the invite and on OAuth account age. Do not pretend this is verification. |
| Purpose of the session | Undefined. Filled by whoever showed up. | Explicit and narrow: work silently, state a goal. ([FAQ](https://www.focusmate.com/faq/)) | Explicit and narrow: you are both waiting on an agent. Show what each person is waiting on. |
| Camera | On by default, first frame is live. | On by default, but inside a booked, named, purposeful session. | Off or blurred until both sides consent. The purpose is legible without video. |
| Duration | Unbounded until someone hits next. | Fixed 25, 50 or 75 minutes. ([FAQ](https://www.focusmate.com/faq/)) | Bounded by the agent run, plus a hard cap. The auto-hangup is a safety feature, not just a gimmick. |
| Re-roll | Instant, unlimited, free. | None. You book the next slot. | Rate-limit skips hard. This is the single most important control. |
| Consequences | IP flag. Costless to evade. | Timeliness score, freeze, warn, suspend, ban, tied to an account. ([FAQ](https://www.focusmate.com/faq/)) | Ban the OAuth account identity, not the IP. |
| Recording | None, and no delay before frames reached the peer. | "Sessions are never recorded." ([FAQ](https://www.focusmate.com/faq/)) | Never record. Say so loudly. It is both a privacy promise and a reason people will use it. |
| Volume per user | Unlimited. | Free tier capped at 3 sessions per week. ([FAQ](https://www.focusmate.com/faq/)) | Cap sessions per day. A cap is an anti-abuse tool, not just a pricing tier. |
| Rules | A "keep it clean" banner. | Five published rules plus a code of conduct. ([Five rules](https://support.focusmate.com/en/articles/4044467-the-five-community-rules)) | A short rules screen that must be accepted, restated at first match. |

---

## 8. Minimal safety checklist

### MVP: private, invite-only, tens of people, $0

Everything here is buildable with a Cloudflare Worker plus a Durable Object for matchmaking, WebRTC peer-to-peer for media, and no database beyond KV or the DO's own storage.

**Gating**
- [ ] **Invite code required.** A shared secret in a link. This is the highest-leverage control you have and it costs nothing. Every product in this memo that stayed safe was gated somehow.
- [ ] **GitHub OAuth for accounts.** Yes, it helps, for two specific reasons and not for the reason people assume. It does not verify a human or an age. What it gives you is (a) a **stable, bannable identity** with a public account age and commit history, so a ban actually costs the offender something, and (b) social legibility: your partner can see you are a real developer with a real account. Refuse accounts under some age threshold, for example 30 days old.
- [ ] **18+ statement on the rules screen.** You are not verifying it. State it, log the acceptance, and mean it in your enforcement.

**Session design**
- [ ] **Audio-first or camera-off by default.** Start with audio and a status card showing what each person's agent is doing. This is the Clubhouse lesson: lower the barrier, lower the harm surface.
- [ ] **Reveal handshake.** Both sides must click to turn video on. Nobody's camera is ever live without their own click plus the other person's request.
- [ ] **Blur until both consent.** If you do start with video, ship blurred and unblur only on mutual consent. This is the Portal's degrade-to-blur, applied at the start rather than as a failsafe.
- [ ] **Auto-hangup on agent completion.** Already in the concept. Also cap the session independently, for example 45 minutes, so a stalled agent cannot create an unbounded stranger call.
- [ ] **Show the wait context.** Repo name is too identifying. Show something like "waiting on a 12-minute test run". Purpose visible equals purpose enforced.

**Controls**
- [ ] **Skip, report, block, all one click, always visible.** Block must be permanent and never re-match that pair.
- [ ] **Rate-limit skips.** For example three skips per hour, then a cooldown. Omegle's instant infinite next is the mechanism that made a low base rate into a certainty.
- [ ] **Ban by account, not by IP.** Hashed IP is a weak secondary signal at best and is personal data under GDPR. Account bans are what has teeth.
- [ ] **No recording, ever, and no server-side media.** Peer-to-peer WebRTC with a TURN fallback. Say "we never see or store your video" on the rules screen.
- [ ] **A rules screen that must be accepted.** Five short rules in the Focusmate style. Restate them on the first match of each session.
- [ ] **Kill switch.** One env var that puts the whole matcher into maintenance mode. You will want this at 2am one day.

**Optional but cheap**
- [ ] **Office hours.** Restrict matching to a window. This solves safety and liquidity simultaneously, which is the Portal's most underrated lesson.
- [ ] **Session cap per day.** Three per day per account, Focusmate-style.

### Public launch: additional requirements

If it stops being invite-only, the risk profile changes completely and so does the work.

- [ ] **Automated video moderation before or at connect.** Chatroulette needed Hive plus 600 million frames of training data. You cannot hand-roll this. If you cannot pay for a classifier, do not open the video path publicly.
- [ ] **Keep the camera-off default permanently.** Do not "graduate" to video-on because it feels friendlier.
- [ ] **Real reporting workflow with a human.** A report that goes nowhere is worse than no report button, because it manufactures a false sense of safety.
- [ ] **Published Terms and Privacy Notice, with a named contact point.** See below.
- [ ] **A minors policy you actually enforce.** Detection, not just a checkbox. This is where every product in this memo failed.
- [ ] **Logging sufficient to respond to law enforcement**, balanced against your no-recording promise. Metadata only.
- [ ] **Talk to a lawyer.** Not a formality. See the next section.

### Legal minimums to state, even as a hobby

**Terms of Service.** Short. Who may use it (18+), what is prohibited, that you may ban anyone for any reason, no warranty, and that the service can vanish at any time.

**Privacy notice.** Be specific and boring about exactly what is processed:
- GitHub account identifier and display name, for authentication and bans.
- IP address, unavoidably, for the WebSocket signalling connection and for any TURN relay. **IP addresses are personal data under GDPR.** The CJEU held in Breyer (C-582/14) that even dynamic IPs are personal data where the controller can lawfully obtain identifying information. ([CookieYes](https://www.cookieyes.com/blog/ip-address-personal-data-gdpr/), [TechGDPR](https://techgdpr.com/blog/is-an-ip-address-considered-personal-data/))
- Legal basis: legitimate interests for operating and securing the service. Say so.
- **No media is recorded or stored.** State the retention period for logs, and make it short.
- A contact address for deletion requests.

**EU DSA.** A tiny service is very likely a "micro or small enterprise" under Article 19, which excludes it from Section 3's heavier platform obligations, with the exception of Article 24(3). What still applies regardless of size are the baseline duties in Sections 1 and 2: a **point of contact**, clear **terms of service**, and a **notice and action mechanism**. Your report button plus a contact email plus published terms roughly covers the shape of that. ([CMS](https://www.cms-digitallaws.com/en/dsa/article-19/), [Hannes Snellman](https://digitaldecade.hannessnellman.com/articles/art-19-dsa-exclusion-for-micro-and-small-enterprises/))

**UK Online Safety Act 2023.** Scope turns on having links with the UK, not on size or on being commercial. All regulated user-to-user services owe duties on illegal content risk assessment, illegal content, content reporting, complaints, freedom of expression and privacy, and record keeping. Illegal harms risk assessments were due by 16 March 2025, with the safety duties live from 17 March 2025. Ofcom has an explicit "small but risky" supervision taskforce, and 1:1 anonymous video with strangers is a textbook "small but risky" profile. ([Taylor Wessing](https://www.taylorwessing.com/en/insights-and-events/insights/2024/12/illegal-harms-safety-duties-under-uks-online-safety-act-to-apply-from-17-march-2025), [Ofcom](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/enforcing-the-online-safety-act-scrutinising-illegal-harms-risk-assessments), [Practical Law](https://uk.practicallaw.thomsonreuters.com/w-042-9346))

**Consult a lawyer if this goes public.** Specifically before you remove the invite gate, and specifically about the A.M. v. Omegle design-defect exposure, which is the real risk and is not covered by Section 230. Staying invite-only and small is not just a product choice, it is your primary legal mitigation.

---

## 9. Liquidity, or the empty room

### How the prior art handled it

**Omegle and Chatroulette** solved liquidity by having enormous unfiltered inbound traffic. Omegle was doing tens of millions of visits a month. ([Malwarebytes / BBC](https://www.malwarebytes.com/blog/news/2021/02/omegle-investigation-raises-new-concerns-for-kids-safety)) That is not a strategy you can copy, and the traffic itself was the safety problem. Whether Omegle displayed a live "N online now" counter on the homepage is **(unverified)**; I could not confirm it from a primary source.

**Focusmate** solved it structurally rather than with volume, and this is the model worth stealing:
- Sessions start only on **:00, :15, :30 and :45**, so demand is funnelled into discrete slots instead of spread thin across continuous time. ([Focusmate Help](https://support.focusmate.com/en/articles/5577752-how-do-i-book-a-focusmate-session))
- Booking in advance means supply is **known before the moment arrives**.
- A "See Availability" page shows where partners already are. ([Focusmate Help](https://support.focusmate.com/en/articles/6377602-availability-setting-and-the-see-availability-page))
- **Focus Now** allows one-click spontaneous matching, and it snaps you to the nearest 15-minute slot, folding impulsive demand back into the slot grid. ([Focusmate Help](https://support.focusmate.com/en/articles/9994509-focus-now))
- The result: over 99 percent of bookings get matched. If you are not matched, you book the next slot 15 minutes later. ([FAQ](https://www.focusmate.com/faq/))

**Flow Club and Caveday** solve it with hosts. A scheduled session with a named host will run whether or not many people show, so the room is never truly empty.

**Clubhouse** piped ambient background audio into rooms with no active speaker specifically so silence would not read as failure. ([Common Sense](https://www.commonsense.org/education/reviews/clubhouse-drop-in-audio-chat))

**The Portal** cut hours from 24/7 to a ten-hour window, which concentrated the crowd as a side effect of a safety fix. ([TechCrunch](https://techcrunch.com/2024/05/20/nyc-dublin-real-time-video-portal-reopens-with-some-fixes-to-prevent-inappropriate-behavior))

**Airtime** did not solve it at all and was described as having "literally no one left". ([Wikipedia](https://en.wikipedia.org/wiki/Airtime.com))

### The specific problem claude-omegle has

It is harder than Focusmate's, for a reason worth naming plainly. Focusmate's demand is **schedulable**: you decide when to work. claude-omegle's demand is **involuntary and bursty**: your agent finishes when it finishes, and the article on agent waits puts typical waits anywhere from 10 seconds to 12 minutes. ([Atomic Object](https://spin.atomicobject.com/agent-wait-26-things-to-do/))

Two people must be waiting at the same instant, in compatible time zones, from a pool of maybe twenty. Most of the time the room will be empty. Plan for that as the normal case, not the failure case.

### The simplest honest solution

1. **Show the live count, truthfully, always.** "3 people online, 0 waiting right now." Never fake it. Fake activity is the one thing that will permanently destroy trust in a twenty-person community where everyone knows each other.
2. **Graceful solo mode is the default experience.** When no one is there, the tab should still be worth opening: show your agent's progress, show who is online but not waiting, show recent sessions. Design the empty state first, because it is the state users will see most.
3. **Office hours.** Pick a window, say 9pm to 11pm in the founding time zone, and tell people that is when matches actually happen. This concentrates a thin pool and doubles as the Portal's safety mitigation. Do this before you build anything cleverer.
4. **Notify, do not just wait.** If someone is waiting and you are not, ping them. A Claude Code hook can already surface this. Converting "I happen to be waiting" into "someone is waiting, join them" is the highest-leverage liquidity fix available.
5. **Widen the window past the agent run.** Let someone stay in the pool for a couple of minutes after their agent finishes, or opt in slightly before a long run starts. Small overlaps compound.
6. **Consider a lobby before a match.** Clubhouse's hallway and Houseparty's presence notifications both worked because you could see people before committing. A text lobby is far cheaper to fill than a 1:1 video queue, and it gives the empty room a floor.
7. **Do not use bots to pad.** Every clone that does this is described as a scam. ([RandomChat blog](https://randomchat.io/blog/is-omegle-coming-back-in-2026))

---

## 10. Prior art scan

I searched the web and the GitHub API for anything pairing people socially during AI agent wait time, Claude Code hooks that do social things, vibe-coding waiting rooms, pair programming with strangers while AI runs, and chat during LLM loading.

**Nothing exists that matches the claude-omegle concept.** The adjacent space is real and active, but it splits cleanly into two clusters, neither of which is what you are proposing.

### Cluster A: presence and status, no pairing

These show you who else is coding with AI. They are broadcast, not connection. None of them puts two people in a call.

| Project | What it is | Link |
|---|---|---|
| **Vibes** | "Social presence for AI coding agents." See who is coding with AI now, broadcast ephemeral anonymous status. Claude Code plugin and MCP, MIT licensed. | [binora.github.io/vibes](https://binora.github.io/vibes/) |
| **/vibe (slashvibe)** | "Building with Claude Code is lonely. /vibe is the room." Presence, DMs, discovery and multiplayer games inside the terminal, via MCP. Works across Claude Code, Cursor, VS Code, Windsurf. | [slashvibe.dev](https://www.slashvibe.dev/), [VibeCodingInc/vibe-mcp](https://github.com/VibeCodingInc/vibe-mcp) |
| **terminally.social** | See what friends are building in the Claude Code statusline, plus token leaderboards. Prompts stay local. | [limone-eth/terminally.social](https://github.com/limone-eth/terminally.social) |
| **claude-friends** | "See who's coding in Claude Code. Add friends, share status, nudge each other." Built on PartyKit. | [Nandinitalwar/claude-friends](https://github.com/Nandinitalwar/claude-friends) |

The nudge feature in claude-friends is the closest anyone gets to human-to-human contact, and it is a notification, not a call.

### Cluster B: agent-to-agent coordination, not human social

These wire multiple AI agents together. Humans are the operators, not the participants.

| Project | What it is | Link |
|---|---|---|
| **agent-talk** | Lets coding agents in different sessions message each other and coordinate, including across developers. | [xhluca/agent-talk](https://github.com/xhluca/agent-talk) |
| **agentchattr** | Local chat where AI coding agents tag each other, talk, and coordinate with you. | [bcurts/agentchattr](https://github.com/bcurts/agentchattr) |
| **Stop-hook async collaboration** | Uses a Claude Code Stop hook to close an async multi-agent loop without polling. Directly relevant as an implementation pattern for your completion trigger. | [dev.to writeup](https://dev.to/agent-room/how-a-claude-code-stop-hook-unlocks-async-multi-agent-collaboration-no-polling-required-2e0e) |
| **Slack Code** | Salesforce making agent work multiplayer inside Slack channels. | [salesforce.com](https://www.salesforce.com/introducing-slack-code/) |

### The single closest thing found

**coderoulette** ([github.com/coderoulette/coderoulette](https://github.com/coderoulette/coderoulette)) is the nearest prior art by a wide margin, and it is worth reading before you build.

Tagline: "Pair program with a stranger. Two humans + one AI agent. 30 minutes. Build something fun."

What it does: FIFO queue with latency-based host selection, plus direct invite links for pairing with friends. Sessions are terminal-based, sharing an xterm.js view of the host's Claude Code session with a text chat sidebar. 30 minutes with a 15-minute check-in, a 5-minute warning and an optional 15-minute extension. Safety measures include prompt safety warnings when prompts reference sensitive paths, and a no-fault re-match within the first three minutes. Topics include claude-code, pair-programming, hackathon.

How it differs from claude-omegle, and why the gap is real:
- **No video.** Terminal plus text chat only. The entire trust-and-safety surface this memo is about does not exist there.
- **Collaborative, not parallel.** Two humans work on one shared agent session. claude-omegle is two people on separate work who happen to be idle at the same moment.
- **Demand-driven, not wait-triggered.** You decide to pair. The agent is the tool, not the timer.
- Small and apparently a hackathon project, 0 stars at time of research.

The re-match grace window and the timed checkpoint structure are both worth borrowing directly.

### Also checked, nothing found

- Anything triggered by agent completion or agent wait to open a social session. Nothing.
- "ChatGPT loading screen chat" or equivalent. Nothing.
- Any product framing agent wait time as a social slot. The closest cultural artifact is an Atomic Object listicle of 26 solo things to do while waiting, which explicitly recommends rest over stimulation, and mentions no social product. ([Atomic Object](https://spin.atomicobject.com/agent-wait-26-things-to-do/))
- GitHub repository searches for omegle plus claude, waiting room plus agent plus video, coworking plus strangers plus webrtc (zero results), topic:claude-code plus topic:social, and topic:claude-code plus topic:presence. The presence search returned five repos, all of which coordinate parallel *agent* sessions rather than connecting people: [claude-presence](https://github.com/garniergeorges/claude-presence) (inter-session locks and a broadcast inbox), [agent-beacon](https://github.com/a1473838623/agent-beacon) (collision avoidance between agents), [presence-mcp](https://github.com/sara-star-quant/presence-mcp), plus terminally.social and vibe-mcp already listed above.

**Conclusion: the concept is genuinely unoccupied.** The presence layer for AI-assisted developers is being built by several people right now, which validates that the loneliness is real and felt. Nobody has connected two of those waiting people to each other. That is the whole idea, and it is available.

---

## 11. Sources

**Omegle**
- https://en.wikipedia.org/wiki/Omegle
- https://www.nbcnews.com/tech/social-media/omegle-shut-down-did-why-leif-k-brooks-shutdown-alternatives-rcna124393
- https://www.npr.org/2023/11/09/1211807851/omegle-shut-down-leif-k-brooks
- https://lawfaremedia.org/article/what-the-omegle-shutdown-means-for-section-230
- https://www.malwarebytes.com/blog/news/2021/02/omegle-investigation-raises-new-concerns-for-kids-safety
- https://www.internetmatters.org/advice/apps-and-platforms/social-media/omegle/
- https://www.cagoldberglaw.com/omegle-lawsuit-cagoldberg-section-230/
- https://blog.ericgoldman.org/archives/2022/07/omegle-denied-section-230-dismissal-am-v-omegle.htm
- https://internetcases.com/2022/07/17/section-230-immunity-did-not-protect-omegle-in-product-liability-lawsuit/
- https://reason.com/volokh/2024/12/10/eleventh-circuit-rejects-federal-child-porn-sex-trafficking-claims-against-video-chat-service-omegle/
- https://media.ca11.uscourts.gov/opinions/pub/files/202210338.pdf

**Chatroulette**
- https://en.wikipedia.org/wiki/Chatroulette
- https://www.washingtonpost.com/wp-dyn/content/article/2010/03/16/AR2010031602155.html
- https://www.vice.com/en/article/chatroulette-moderation-penis-problems/
- https://www.techdirt.com/2021/02/24/content-moderation-case-study-chatroulette-leverages-new-ai-to-combat-unwanted-nudity-2020/
- https://www.unite.ai/chatroulette-returns-with-the-help-of-ai-driven-content-moderation/

**Portals**
- https://techcrunch.com/2024/05/20/nyc-dublin-real-time-video-portal-reopens-with-some-fixes-to-prevent-inappropriate-behavior
- https://www.forbes.com/sites/conormurray/2024/05/19/the-viral-dublin-new-york-portal-reopens-after-6-day-shutdown-over-flashing-inappropriate-behavior/
- https://www.nbcnewyork.com/news/local/nyc-dublin-portal-reopens-inappropriate-behavior-tech-issues/5427467/
- https://www.foxnews.com/us/nyc-art-portal-dublin-reopens-added-security-measures-shutdown-bad-behavior
- https://www.rollingstone.com/culture/culture-features/new-york-dublin-portal-issues-flashing-9-11-memes-1235022182/
- https://en.wikipedia.org/wiki/Portals_(initiative)
- https://www.sharedstudios.com/about
- https://news.artnet.com/exhibitions/times-square-portal-to-the-world-1116746
- https://washingtonian.com/2015/09/02/portals-clarice-shared-studios-nextnow/

**Focusmate and coworking**
- https://www.focusmate.com/faq/
- https://www.focusmate.com/terms/
- https://www.focusmate.com/community/
- https://support.focusmate.com/en/articles/4044467-the-five-community-rules
- https://support.focusmate.com/en/collections/2523106-trust-safety
- https://support.focusmate.com/en/articles/5577752-how-do-i-book-a-focusmate-session
- https://support.focusmate.com/en/articles/6377602-availability-setting-and-the-see-availability-page
- https://support.focusmate.com/en/articles/9994509-focus-now
- https://www.flow.club/
- https://flat.social/guides/flow-club-review
- https://www.caveday.org/
- https://www.caveday.org/caveday-vs-flow-club

**Body doubling research**
- https://dl.acm.org/doi/10.1145/3597638.3614486
- https://dl.acm.org/doi/full/10.1145/3689648
- https://dl.acm.org/doi/full/10.1145/3663547.3759743
- https://arxiv.org/pdf/2509.12153
- https://www.medicalnewstoday.com/articles/body-doubling-adhd

**Other products**
- https://en.wikipedia.org/wiki/Airtime.com
- https://fortune.com/2012/06/05/airtime-makes-an-awkward-first-impression
- https://fortune.com/2014/02/25/exclusive-sean-parkers-airtime-has-quietly-relaunched-as-okhello-and-its-actually-working
- https://en.wikipedia.org/wiki/Houseparty_(app)
- https://variety.com/2021/digital/news/houseparty-shutting-down-1235060236/
- https://techcrunch.com/2021/09/09/epic-games-to-shut-down-houseparty-in-october-including-the-video-chat-fortnite-mode-feature/
- https://www.failory.com/cemetery/houseparty
- https://www.washingtonpost.com/video-games/2021/09/09/houseparty-shut-down-epic-games-metaverse/
- https://en.wikipedia.org/wiki/Clubhouse_(app)
- https://www.commonsense.org/education/reviews/clubhouse-drop-in-audio-chat
- https://prodlab.substack.com/p/from-hype-to-hibernate-the-clubhouse
- https://www.distractify.com/p/what-happened-to-the-monkey-app
- https://www.internetmatters.org/advice/apps-and-platforms/social-media/monkey-app/
- https://www.avast.com/c-monkey-app
- https://vpnpro.com/guides-and-tutorials/best-omegle-alternatives/
- https://vpnoverview.com/privacy/social-media/omegle-alternatives/
- https://randomchat.io/blog/is-omegle-coming-back-in-2026
- https://www.hay.fun/
- https://play.google.com/store/apps/details?id=com.hay.android

**Legal**
- https://www.cms-digitallaws.com/en/dsa/article-19/
- https://digitaldecade.hannessnellman.com/articles/art-19-dsa-exclusion-for-micro-and-small-enterprises/
- https://www.taylorwessing.com/en/insights-and-events/insights/2024/12/illegal-harms-safety-duties-under-uks-online-safety-act-to-apply-from-17-march-2025
- https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/enforcing-the-online-safety-act-scrutinising-illegal-harms-risk-assessments
- https://uk.practicallaw.thomsonreuters.com/w-042-9346
- https://www.legislation.gov.uk/ukpga/2023/50/contents
- https://www.cookieyes.com/blog/ip-address-personal-data-gdpr/
- https://techgdpr.com/blog/is-an-ip-address-considered-personal-data/

**Prior art**
- https://binora.github.io/vibes/
- https://www.slashvibe.dev/
- https://github.com/VibeCodingInc/vibe-mcp
- https://github.com/limone-eth/terminally.social
- https://github.com/Nandinitalwar/claude-friends
- https://github.com/coderoulette/coderoulette
- https://github.com/xhluca/agent-talk
- https://github.com/bcurts/agentchattr
- https://github.com/garniergeorges/claude-presence
- https://github.com/a1473838623/agent-beacon
- https://github.com/sara-star-quant/presence-mcp
- https://gamerant.com/omegle-shut-down-leif-k-brooks-letter/
- https://dev.to/agent-room/how-a-claude-code-stop-hook-unlocks-async-multi-agent-collaboration-no-polling-required-2e0e
- https://www.salesforce.com/introducing-slack-code/
- https://spin.atomicobject.com/agent-wait-26-things-to-do/
