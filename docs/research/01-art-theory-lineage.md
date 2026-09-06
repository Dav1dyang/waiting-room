# claude-omegle: art, game-design, and media-theory lineage

Research brief for the project author. Compiled 2026-09-05.

**The concept under study.** A Claude Code plugin. Whenever your coding agent starts a long task, it opens a live video call with a stranger who is also waiting on their own agent. The call hangs up automatically the moment one person's agent finishes. Every wait is a different stranger. The duration of each human encounter is set by the machines, not the humans.

**How to read this.** Sections A through F are the lineage, 30 entries. Section G is the prior-art scan, which is the section with the most immediate practical consequence. Section H is the distilled design guidance. Section I is naming. Section J collects sources.

**Verification standard.** Every factual claim below was checked against a fetched page, not recalled. Where a commonly repeated claim did not survive checking, it is corrected in place and flagged. Anything unconfirmed is marked "(unverified)". Several things you may have heard about these works are wrong, and those corrections are called out because getting them wrong in a project write-up is worse than omitting them. One style note: this document uses no em-dashes, so dashes appearing inside direct quotations have been normalised to commas or ellipses. The wording of every quotation is otherwise verbatim.

---

## A. Telepresence encounters between strangers

### A1. Kit Galloway and Sherrie Rabinowitz, "Hole in Space" (1980)

A "Public Communication Sculpture" that put life-size, head-to-toe live video between a storefront at Lincoln Center in New York and The Broadway department store in the open-air Century City mall in Los Angeles. It ran on the nights of 11, 13 and 14 November 1980, two to three uninterrupted hours each evening, with the satellite link provided by Western Union's Westar satellites. Crucially, it was unannounced: no signs, no sponsor logos, no credits, no explanation, and deliberately no self-view monitors, which the artists said "would have degraded the situation into a self-conscience videoconference" [sic]. The three nights produced a now-canonical arc: night one was confusion and discovery ("They're in New York? I'm in Los Angeles, right?"), night two turned into performance as word spread (charades, songs, jokes, one LA group brought a large picture of Ronald Reagan), and night three brought organized transcontinental reunions, including a woman meeting her brother for the first time in fifteen years.

**Why it matters here.** This is the origin document for the whole idea that an unexplained, unbranded video window between strangers is enough. It also gives you the three-night arc as a product-lifecycle prediction: confusion, then performance, then genuine use. Expect claude-omegle's first week to look like night one and its second like night two. And the no-self-view decision is a real design lever: Hole in Space argued that seeing yourself is what turns an encounter into a videoconference.

Source: https://www.ecafe.com/getty/HIS/

Note: one scholarly account (USC *Spectator* 41:1) attributes the link to NASA's CTS satellite; prefer Westar, which is sourced to Galloway directly. Whether the audio was truly delay-free is contested: Galloway says geostationary latency "was not a problem," while the *Spectator* analysis describes audible lag and echo in the footage.

### A2. Paul Sermon, "Telematic Dreaming" (1992)

Commissioned for the Finnish Ministry of Culture's summer exhibition in Kajaani, June 1992, with support from Telecom Finland, and themed on Baudrillard's "The Ecstasy of Communication." Two double beds in separate locations are linked over ISDN. A camera above the lit bed sends person A's image to a projector above a blacked-out bed, laying A's body down onto person B, and a return feed puts the composite on monitors around A. Participants communicate by gesture, not speech, with roughly 1.5 seconds between cause and effect, and Sermon reports "an alarmingly real sense of touch." The work also produced the field's most important cautionary incident: in the 1994 version, performer Susan Kozel was violently attacked by two male gallery visitors acting on her projected body, and she described a complete withdrawal of physical embodiment from her virtual body during it.

**Why it matters here.** The intimacy and the assault are the same mechanism. A stranger's live image in your private space produces disproportionate feeling in both directions, and any project that puts a stranger's face into your working environment inherits both halves. Sermon's own note that visitors were "reluctant to enter" not because of the technology but because of "the potential interaction" is the honest description of the friction claude-omegle will face at the moment of joining.

Correction: this is video projection, not chroma-key. The blue-screen and keying work in Sermon's practice is "Telematic Vision," a different piece.

Source: https://www.paulsermon.org/dream/dream.html

### A3. Rafael Lozano-Hemmer, "The Trace" (1995) and "Body Movies" (2001)

"The Trace" is a telepresence installation linking two rooms over ISDN with robotic spotlights, wireless 3D tracking and projection, so that two remote participants can "telembody," occupying identical positions in a shared telematic space "to the point where they are inside each other." It premiered at Fundación Arte y Tecnología, Madrid, in 1995. "Body Movies: Relational Architecture 6" premiered at Schouwburgplein, Rotterdam, commissioned by V2_, projecting 1,200 portraits of people photographed on the streets of the host city, visible only inside the shadows cast by passers-by, with silhouettes from 2 to 25 metres. Lozano-Hemmer's stated aim is to "misuse technologies of the spectacular so they can evoke a sense of intimacy and complicity."

**Why it matters here.** "The Trace" is the purest prior expression of two remote people being placed in the same machine-defined coordinate space. "Body Movies" is the reminder that co-presence gets interesting when the participants have to do something together to make the work appear, rather than simply being shown to each other. That is an argument for giving claude-omegle's pair a tiny shared task, not just a video feed.

Sources: https://www.lozano-hemmer.com/the_trace.php and https://www.lozano-hemmer.com/body_movies.php

### A4. Amar Bakshi / Shared_Studios, "Portals" (2014 onward)

Founded 2014. The first Portal connected New York and Tehran in December 2014, running one-on-one conversations of about eight minutes each, opened with the prompt "What would make today a good day for you?" The enclosure is a standard shipping container painted dark gold, chosen after trying black, white and silver, because gold "connoted more of the sacred than the commercial"; the interior is carpeted grey "so people would feel protected," the technology is hidden, and the camera is embedded in the door. Over a million people have passed through, across more than 100 Portals in 42 countries. Shared Studios today runs primarily as an education programme.

**Why it matters here.** Three transferable design decisions. First, the opening prompt: a stranger encounter with no agenda tends to collapse, and one good question rescues it. Second, the enclosure: the container is a device for making a stranger encounter feel safe and consequential rather than exposed. Third, the duration: eight minutes was chosen by the organizers as enough for something to happen and short enough to bear. claude-omegle's duration is set by a compile, which may be forty seconds or forty minutes, and that variance is the concept's central unsolved problem.

Source: https://www.sharedstudios.com/ and https://amarbakshi.com/story

### A5. The Benediktas Gylys "Portal" network: Vilnius-Lublin (2021) and New York-Dublin (2024)

A separate lineage from Shared_Studios, and the one that carries the moderation lesson. The first circular Portal sculptures were unveiled in Vilnius and Lublin on 26 May 2021, designed by engineers at Vilnius Gediminas Technical University, circular to evoke time and science fiction, 11 tons each. (Cost is contested: Wikipedia via The Calvert Journal gives EUR 111,000 total, while Sactown Magazine reports just over USD 200,000 per sculpture plus an annual fee.) The New York-Dublin Portal opened 8 May 2024 between the Flatiron South Public Plaza and North Earl Street in Dublin, 24-hour live video with **no audio**, delivered by Dublin City Council and the Flatiron NoMad Partnership with Portals.org, and it drew over 340,000 visitors on the Dublin side.

**The shutdown, precisely.** On 13 May 2024 the screens were switched off after "inappropriate behavior." Reported incidents: pornography and 9/11 imagery held up to the Dublin lens, profanities projected from phone screens, indecent exposure, and an OnlyFans model (Ava Louise) exposing herself on the New York side. RTE reports the Dublin end was cut at 10pm on 14 May by Dublin City Council and portals.org. It reopened on 19 May with a proximity-based fix: stepping too close and obstructing the camera triggers a blur for everyone on both sides. Reopening also brought reduced hours (New York 6am to 4pm, Dublin 11am to 9pm), fencing on the New York side, extra signage, and on-site security, which Dublin had lacked and New York had.

**Why it matters here.** This is the single most useful case in the document. A well-funded, civic-backed, physically supervised stranger-video installation was broken by a very small minority within five days of launch, and the fix that worked was not human moderation but an automatic, mechanical, blameless intervention triggered by proximity. That is exactly the shape of intervention claude-omegle should copy.

Important correction: Wikipedia's lead sentence says the Portal closed on 2 September 2024 "due to inappropriate behaviour." Its own body text and the Irish Times contradict this. Dublin's Jamie Cudden said it "was intended as a short arts project, it was due to close after six months anyway," and the link moved to Philadelphia in October 2024. Do not repeat the causal claim.

Sources: https://en.wikipedia.org/wiki/New_York%E2%80%93Dublin_Portal, https://www.rte.ie/news/dublin/2024/0514/1449041-dublin-portal/, https://www.cbsnews.com/newyork/news/nyc-dublin-portal-reopens/

---

## B. Random-stranger chat as a cultural object

### B1. Omegle (2009-2023) and why Leif K-Brooks shut it down

Launched 25 March 2009 by an 18-year-old Leif K-Brooks from his parents' house in Vermont. The 2009 homepage read: "Omegle is a brand-new service for meeting new friends. When you use Omegle, we pick another user at random and let you have a one-on-one chat with each other. Chats are completely anonymous." No accounts, no registration. The "Talk to strangers!" tagline appears by March 2010, the same month video was added. Its Spy (question) mode is directly relevant: a third stranger submits a question and watches two other strangers discuss it, so the frame of the encounter is set by someone outside it. Traffic went from roughly 34 million monthly visits in January 2020 to 65 million in January 2021.

**The shutdown.** Omegle closed on 8 November 2023. The proximate cause was legal: *A.M. v. Omegle.com, LLC* (D. Oregon, filed November 2021, brought by Carrie Goldberg's firm). On 13 July 2022, Judge Michael Mosman denied Section 230 immunity on a product-design theory, reasoning that Omegle could satisfy its duty "by designing its product differently, for example, by designing a product so that it did not match minors and adults," without touching user content. The case was dismissed on 2 November 2023 following a settlement, and the site went dark a week later. From K-Brooks's farewell letter: "It was the idea of 'meeting new people' distilled down to almost its platonic ideal"; "Operating Omegle is no longer sustainable, financially nor psychologically. Frankly, I don't want to have a heart attack in my 30s"; "The battle for Omegle has been lost, but the war against the Internet rages on."

**Why it matters here.** The name you are currently using carries this. Note also that the 8 November letter never mentions the lawsuit; the line "I thank A.M. for opening my eyes to the human cost of Omegle" was added later, between the 15 and 20 November archive captures. And omegle.com is live again as of 2026 under a new registrant, RC Tech America Inc., serving a video-chat SPA with no known relation to K-Brooks (unverified who operates it).

Source: https://web.archive.org/web/20231109003559/https://www.omegle.com/

### B2. Chatroulette (2009 onward) and the 2010 nudity collapse

Written in two days and two nights by a 17-year-old Andrey Ternovskiy in his Moscow bedroom, launched 16 November 2009, named after *The Deer Hunter*. Growth was violent: 300 users in December 2009 became 10,000 by early February 2010, and comScore counted 944,000 worldwide visitors in January 2010 rising to 3.9 million in February. The canonical statistics come from Robert J. Moore's RJMetrics study of 2,883 sessions published on TechCrunch on 16 March 2010: 89 percent male, 47 percent American, and "1 in 8 spins yield something R-rated (or worse)." That is roughly 13 percent, and it is frequently mis-cited; the study gives no separate figure for male genitalia specifically.

**The recovery.** Chatroulette did not die, it moderated. In June 2020 it brought in the AI vendor Hive; CTO Andrew Done said the classifier was "so accurate that using humans in the moderation loop hurts the system's performance." Hive processed over 600 million frames, inappropriate-content conversations fell 75 percent, women rose from 11 percent to 34 percent of users, and traffic nearly tripled to 4 million monthly uniques. It is still live in 2026, operated by CR Services AG in Zug, Switzerland, with over a million Play Store installs.

**Why it matters here.** Two lessons. The demographic skew (89/11) is what happens by default to any unmoderated stranger-video product, and a dev-tool audience will skew similarly. And the fix that worked was automated classification, not humans, which is affordable for a hobbyist project in a way that a moderation team is not.

Source: https://www.wired.com/story/chatroulette-rise-again-help-ai/

### B3. Merton, "Chat Roulette Funny Piano Improv" (2010)

Uploaded 11 March 2010 (not February, as often stated). An anonymous pianist in Colorado, hooded, improvises songs in real time about whoever appears in front of him. The original video reached 4,327,746 views and was briefly the top-rated YouTube video of all time before being taken down over a privacy complaint; the re-upload of 22 March 2010 stands at over 13 million views. Ben Folds performed the act live in Charlotte on 20 March 2010, improvising over Chatroulette and playing on the rumour that he was Merton. Merton never revealed his identity, saying it "won't be anyone you've ever heard of anyway."

**Why it matters here.** Merton is the proof that a random-stranger channel is a raw material, and that the value came from someone bringing a form to it. Nobody remembers a Chatroulette conversation; everybody remembers Merton. If claude-omegle produces artifacts (a transcript, a shared drawing, a duet, a joint README), it can outlive its own sessions.

Source: https://www.youtube.com/watch?v=JTwJetox_tU

### B4. Eva and Franco Mattes, "No Fun" (2010)

The artists staged a suicide on Chatroulette. Franco hung from a noose in their New York studio, slowly swinging, for hours; a laptop in frame showed viewers their own live feed to prove it was not pre-recorded. The resulting 15-minute video records the reactions. Thousands of people saw it. **Exactly one called the police.** It was shown at Postmasters Gallery, New York, 15 May to 19 June 2010, then at [plug.in] Basel and elsewhere, usually on a laptop on an inflatable mattress. The Brooklyn Rail's Cora Fisher read it as a demonstration of the bystander effect and noted that the ethical backlash (the video was banned from YouTube) was "perhaps more reassuring than most live responses captured by the artists."

**Why it matters here.** This is the coldest available data on what strangers on video actually owe each other, which is: almost nothing. Random pairing does not by itself create obligation. Whatever obligation claude-omegle wants has to be built into its structure.

Also worth knowing in this vein: Petra Cortright's "VVEBCAM" (2007), which used spam keywords to lure strangers to a webcam video and made their views and comments part of the work, and Jon Rafman's "Nine Eyes of Google Street View" (2008 onward), on the machine's indifferent gaze at unwitting strangers. https://anthology.rhizome.org/vvebcam and https://anthology.rhizome.org/9-eyes

Source: https://0100101110101101.org/no-fun/

### B5. Miranda July, "Somebody" (2014-2015)

An iOS app made with Miu Miu. You send a message to a friend, but it does not go to your friend; it goes to the Somebody user physically nearest your friend, who then delivers it out loud, in person, acting as your stand-in. You choose your deliverer from photos and performance ratings, and you can attach stage directions like "[crying]" or "[hug]." It premiered at the Venice Film Festival on 28 August 2014 alongside a short film, Miu Miu Women's Tales #8. At its peak, one in four messages were actually delivered and about ten thousand people used it daily. It shut down 31 October 2015 by choice, rather than becoming a start-up: "On October 31, 2015 somebody died. That somebody was Somebody."

**Why it matters here.** July's design turns a stranger into infrastructure and makes that the point, which is exactly what claude-omegle does to the person on the other end of the call. The one-in-four delivery rate is also a sober number: a stranger-dependent system with a soft obligation runs at roughly 25 percent. And the deliberate shutdown is a model for a project that is a work rather than a company.

Source: https://somebodyapp.com/

### B6. Lauren Lee McCarthy: "Social Turkers" (2013), "Follower" (2016), "LAUREN" (2017), "SOMEONE" (2019)

McCarthy's practice is the closest existing art-world analogue to the claude-omegle premise, which is a machine deciding the terms of human contact. In "Social Turkers" (2013) she went on twenty OkCupid dates, streamed them, and paid Mechanical Turk workers to watch and text her instructions she had to perform immediately. "Follower" (January 2016) is a service that provides a real-life follower for a day; you apply, you download an app, you wait, you do not know when it will happen, and you end up with one photograph taken by your Follower. "LAUREN" (September 2017) has her become a human Amazon Alexa, remotely watching over a household 24/7 and controlling their home. "SOMEONE" (2019) scaled that to four homes with a gallery command centre at 205 Hudson in New York where visitors could step in as the home assistant when occupants called out for "Someone."

**Why it matters here.** McCarthy has already proven the frame that makes claude-omegle art rather than a novelty: the interesting question is not "can a machine connect two people" but "what happens to a person when a machine assigns them a role in someone else's life." Note "Follower"'s core mechanic, which claude-omegle shares: you consent in advance and then you wait, not knowing when.

Source: https://lauren-mccarthy.com/SOMEONE (note lauren-mccarthy.com now redirects to get-lauren.net)

### B7. Kyle McDonald: "People Staring at Computers" (2011), "Sharing Faces" (2013), and "How We Act Together" (2016, with McCarthy)

"People Staring at Computers" installed software on the display Macs in two New York Apple Stores that photographed shoppers' faces once a minute and uploaded them, then on 3 July 2011 triggered a full-screen slideshow of those faces on every free machine in the 14th Street store. Apple contacted the Secret Service, who raided McDonald's apartment on 7 July 2011 and seized computers, an iPod, a flash drive and a camera card under 18 U.S.C. 1030; the US Attorney declined to prosecute. "Sharing Faces" (2013) ran for eight months between Anyang, Korea and Yamaguchi, Japan, matching your expression and pose in real time against roughly 415,000 stored photos of someone who had once stood in front of the other installation. "How We Act Together" (2016, Schirn Kunsthalle Frankfurt, with Lauren McCarthy) commands you to perform gestures on webcam until computer vision judges you have done them well enough, and only then records you and streams you to future participants, who cannot tell whether the people they see are live or recorded.

**Why it matters here.** "Sharing Faces" is the asynchronous version of claude-omegle's promise: a stranger's face, matched to your state by a machine, with no live obligation. It is the safest fallback design if live video proves unworkable. "How We Act Together" is the sharpest precedent for the machine as gatekeeper of the human encounter. And "People Staring at Computers" is the reminder that capturing faces without a clean consent story is the fastest route to a legal problem.

Sources: https://kylemcdonald.net/psac/, https://github.com/kylemcdonald/sharingfaces, https://get-lauren.net/How-We-Act-Together

---

## C. Relational aesthetics and constructed situations

### C1. Nicolas Bourriaud, "Relational Aesthetics" (1998 French, 2002 English), and Rirkrit Tiravanija

Bourriaud's *Esthétique relationnelle* (Les Presses du réel, 1998; English trans. Pleasance, Woods and Copeland, 2002) named a tendency in 1990s art. His glossary defines **relational art** as "a set of artistic practices which take as their theoretical and practical point of departure the whole of human relations and their social context, rather than an independent and private space," and **relational aesthetics** as "aesthetic theory consisting in judging artworks on the basis of the inter-human relations which they represent, produce or prompt." His governing metaphor is borrowed from Marx: "the work of art represents a social interstice... a space in human relations which fits more or less harmoniously and openly into the overall system, but suggests other trading possibilities than those in effect within this system." The exemplar is Rirkrit Tiravanija, who cooked and served pad thai at his 1990 show at Paula Allen Gallery, and in *untitled (free)* (303 Gallery, 1992) moved the gallery's back-office contents into the exhibition space and turned the emptied office into a kitchen serving free Thai curry.

**Why it matters here.** claude-omegle is a relational work almost by definition: it produces nothing but relations, in an interstice, using time that the market has already paid for. Bourriaud gives you the vocabulary and the defensible claim that the encounter itself is the artwork.

Correction: the 1992 dish was Thai vegetable curry; pad thai belongs to the 1990 Paula Allen piece. The title picked up "still" at the 1995 Carnegie International, so MoMA catalogues it as *untitled (free/still)*, 1992/1995/2007/2011-.

Sources: https://www.lespressesdureel.com/EN/ouvrage.php?id=5 and https://www.moma.org/collection/works/147206

### C2. Claire Bishop, "Antagonism and Relational Aesthetics" (2004)

*October* no. 110, Fall 2004, pages 51-79. Bishop's attack is the necessary counterweight and the sharpest available critique of claude-omegle. Her core move: "If relational art produces human relations, then the next logical question to ask is what types of relations are being produced, for whom, and why?" And: "The quality of the relationships in 'relational aesthetics' are never examined or called into question." She argues via Laclau and Mouffe that democracy requires antagonism, that "the presence of the 'Other' prevents me from being totally myself," and that Bourriaud's works instead produce a comfortable microtopia: "Tiravanija's microtopia gives up on the idea of transformation in public culture and reduces its scope to the pleasures of a private group who identify with one another as gallery-goers." Her evidence is concrete; she reproduces Jerry Saltz's account of eating at 303 Gallery alongside dealers Paula Cooper, Lisa Spellman, David Zwirner and Gavin Brown. Her counter-examples are Santiago Sierra and Thomas Hirschhorn.

**Why it matters here.** Read this as a direct prediction about claude-omegle. Its users will be people who pay for Claude Code, who work in software, who speak English, and who are waiting on a build. That is a microtopia, and Bishop's charge that "it is still predicated on the exclusion of those who hinder or prevent its realization" lands hard. If the project wants to be more than a cozy in-group novelty, it needs either an honest acknowledgement of who is excluded or a deliberate source of friction.

Note: "microtopia" is Bourriaud's word (*RA* p. 13), which Bishop turns against him. She is not its coiner.

Source: https://sciami.com/scm-content/uploads/sites/7/2017/04/Claire-Bishop-antagonism-and-relational-aesthetics-october-2004.pdf

### C3. Tino Sehgal, "This Progress" (2010), and the Situationist "constructed situation"

Guggenheim New York, 29 January to 10 March 2010, the first live work the museum acquired. The rotunda was stripped of objects. A visitor entering was met by a child who asked a question about progress and walked them up the ramp, then handed them to a teenager, then a young adult, then an older adult, each continuing the conversation. Sehgal calls his works "constructed situations," the artwork being "the constructed situation which arises between the audience and the interpreters," and enforces a strict no-documentation rule: no written instructions, no catalogue, no photographs, and sale by oral contract before a notary and witnesses. The term traces to Guy Debord's "Report on the Construction of Situations" (June 1957), whose central idea is "the construction of situations, that is to say, the concrete construction of momentary ambiences of life and their transformation into a superior passional quality."

**Why it matters here.** Sehgal is the strongest argument for a design decision claude-omegle should consider seriously: record nothing. No transcripts, no recordings, no logs, no ratings. That is simultaneously the most defensible privacy posture, the strongest artistic position, and the hardest thing to combine with a moderation story. Also note the age-graded relay: Sehgal built escalating structure into the encounter instead of letting it drift, which is the antidote to the awkward-silence failure mode.

Careful with attribution: the crisp definition "a moment of life concretely and deliberately constructed by the collective organization of a unitary ambience and a game of events" is from "Definitions," *Internationale Situationniste* #1 (June 1958), not the 1957 Report.

Sources: https://www.bopsecrets.org/SI/report.htm and https://brooklynrail.org/2010/03/artseen/tino-sehgal/

### C4. Marina Abramović, "The Artist Is Present" (2010)

MoMA, 14 March to 31 May 2010. Abramović sat immobile in the atrium and visitors took turns sitting silently opposite her, for as long as they wished, whenever the museum was open. She sat for 736 hours and 30 minutes (the figure comes from her own memoir, *Walk Through Walls*, pp. 298-299, not from MoMA). Marco Anelli photographed 1,545 sittings, which is the basis for the widely quoted sitter count. Ulay appeared early in the run and the moment of contact across the table is the show's most reproduced image.

**Why it matters here.** This is the proof that silence and mutual gaze between strangers, with no task and no conversation, is not empty but overwhelming. If claude-omegle finds that conversation is too much to ask of a person mid-task, "sit here together and do not talk" is a fully validated alternative, and arguably the stronger one.

Note: the frequently repeated details about people crying and queueing overnight appear on Wikipedia without citation; treat as unverified.

Source: https://www.moma.org/calendar/exhibitions/964

---

## D. Waiting, boredom, and the stranger

### D1. Jason Farman, "Delayed Response: The Art of Waiting from the Ancient to the Instant World" (2018)

Yale University Press, 2018, 232 pages. Farman argues that the delay between call and answer "has always been an important part of the message," and builds the case through pneumatic mail tubes in New York, Elizabethan wax seals, Aboriginal Australian message sticks, Civil War soldiers' letters, space-exploration light-lag, and progress bars. Two lines carry the argument: "time [itself] is a medium that communicates" (p. 5) and "those in positions of power reiterate that power by making us wait" (p. 190). He also observes that "while waiting is an unavoidable part of living in the world as a social being, we flee from it whenever possible because it puts us in positions of powerlessness."

**Why it matters here.** Farman gives claude-omegle its thesis sentence: the wait is not the absence of the experience, it is the experience. He also gives it its political edge. Who makes you wait is a statement about power, and in agentic coding the machine now makes you wait, which is a genuinely new arrangement worth naming.

Correction: the "three-second rule of web latency" is not attributable to Farman on any evidence found. The latency statistic he actually gives concerns video buffering abandonment (20 percent leave after five seconds, half after ten, 70 percent after twenty).

Source: https://yalebooks.yale.edu/book/9780300225679/delayed-response/

### D2. Neta Alexander, "Rage against the Machine: Buffering, Noise, and Perpetual Anxiety in the Age of Connected Viewing" (2017)

*Cinema Journal* 56, no. 2 (2017): 1-24. From the abstract: "Buffering, namely the need to preload data before streaming a video or audio file, epitomizes the oft-ignored ruptures and disruptions of digital engagement. Whereas buffering is often read as 'noise' or as a technical nuisance awaiting a solution, a closer look can challenge our notion of mediation, immersion, and control." She situates buffering within a longer history of spectatorial and sonic noise and names the "perpetual anxiety" it invokes, along with "the tension between pleasure and pain embodied in recognizing the imperfections of a supposedly seamless techno-utopia."

**Why it matters here.** Alexander is the theorist of the spinner. Her point that the interruption is where the infrastructure becomes visible is precisely what claude-omegle exploits: the moment the machine stalls is the moment you can see it, and she argues that is a moment of insight, not merely failure.

Do not confuse this with her chapter "Catered to Your Future Self" in *The Netflix Effect* (Bloomsbury, 2016), which is about recommendation algorithms, not buffering. Also, "Winter 2017" as the issue season is likely but could not be confirmed from a fetchable page (unverified).

Source: https://api.openalex.org/works/doi:10.1353/cj.2017.0000

### D3. Walter Benjamin, boredom as "the dream bird" (1936)

From "The Storyteller: Reflections on the Works of Nikolai Leskov" (1936), section VIII, in the Zohn translation. The full passage matters more than the famous line: "This process of assimilation, which takes place in depth, requires a state of relaxation which is becoming rarer and rarer. If sleep is the apogee of physical relaxation, boredom is the apogee of mental relaxation. Boredom is the dream bird that hatches the egg of experience. A rustling in the leaves drives him away. His nesting places, the activities that are intimately associated with boredom, are already extinct in the cities... With this the gift for listening is lost and the community of listeners disappears."

**Why it matters here, and it cuts both ways.** Benjamin is the strongest argument *against* claude-omegle. He says that boredom is productive, that it is where experience is made, and that a rustling in the leaves drives the bird away. A video call with a stranger is a very loud rustling. The honest framing of the project is that it takes a scarce and valuable emptiness and fills it, and the project should say so rather than pretend that filling the wait is obviously good.

Note: this is "The Storyteller," not the Arcades Project. The Arcades has separate boredom material in Convolute D ("Boredom, Eternal Return"), whose epigraphs include Hebel's "Boredom waits for death" and Hugo's "Waiting is life."

Source: https://arl.human.cornell.edu/linked%20docs/Walter%20Benjamin%20Storyteller.pdf

### D4. Georg Simmel, "The Stranger" (1908), and Zick Rubin's airport study (1975)

Simmel's excursus in *Soziologie* (1908) defines the stranger not as "the wanderer who comes today and goes tomorrow, but rather as the person who comes today and stays tomorrow," and describes "the unity of nearness and remoteness involved in every human relation." The mechanism claude-omegle depends on is his: "he often receives the most surprising openness, confidences which sometimes have the character of a confessional and which would be carefully withheld from a more closely related person." Simmel notes this is "chiefly (but not exclusively) true of the stranger who moves on," which is the exact case here. Zick Rubin, "Disclosing oneself to a stranger: Reciprocity and its limits," *Journal of Experimental Social Psychology* 11, no. 3 (May 1975): 233-260, ran two field experiments on reciprocal self-disclosure with strangers in the departure lounges of a large metropolitan airport.

**Why it matters here.** Simmel explains why a call with a stranger who will vanish when your build finishes might be more valuable than a call with a colleague. Complete non-recurrence is the enabling condition of candour, not a defect.

Corrections: Rubin's study was airport departure lounges only, with no bus terminal. Rubin did not coin "stranger on a train"; that phrasing comes from Bargh, McKenna and Fitzsimons (2002), who cite him. The specific experimental manipulations and results could not be verified from a fetchable source (unverified), so cite the setting and framing only.

Sources: http://www.osea-cite.org/tourismworkshop/resources/Simmel_The_Stranger.pdf and https://eric.ed.gov/?id=EJ120409

### D5. Erving Goffman's "civil inattention" (1963) and Sherry Turkle's "Alone Together" (2011)

Goffman, *Behavior in Public Places* (Free Press, 1963), p. 84, describes the most frequent of interpersonal rituals: "one gives to another enough visual notice to demonstrate that one appreciates that the other is present... while at the next moment withdrawing one's attention." The eyes may pass over the other's but "no 'recognition' is typically allowed"; he calls it "a kind of dimming of lights." Stefan Hirschauer's gloss is useful: "a display of disinterestedness without disregard... a competence to refuse relations without creating non-persons." Turkle's *Alone Together: Why We Expect More from Technology and Less from Each Other* (Basic Books, 2011) argues the opposite direction, that networked connection substitutes for and degrades the real thing.

**Why it matters here.** Goffman names the default behaviour two strangers on a video call will reach for, and it is the right one: acknowledge, then look away, then work. claude-omegle does not need conversation to succeed; it needs a protocol for co-presence, and civil inattention is that protocol, already fully specified and universally known. Turkle is the standing objection: a stranger on a screen while you wait for a machine may be exactly the substitute-for-connection she warns about.

Sources: https://pmc.ncbi.nlm.nih.gov/articles/PMC10508291/ and https://archive.org/details/alonetogetherwhy0000turk

### D6. The engineering of waiting: Myers (1985), Buell and Norton (2011), Houston, and CHI 2025

Four data points, and two of the four are usually misreported.

**Brad A. Myers, "The importance of percent-done progress indicators for computer-human interfaces," CHI '85, pages 11-17.** What it actually shows: people *prefer* to have progress indicators. What it does **not** show, and this is the common misattribution: it does not demonstrate that the wait feels shorter or that people tolerate longer tasks. His abstract states that the relevant part of the experiment produced results that "were not statistically significant" and in fact contradicted previously published findings on constant response time.

**Ryan W. Buell and Michael I. Norton, "The Labor Illusion: How Operational Transparency Increases Perceived Value," *Management Science* 57, no. 9 (September 2011): 1564-1579** (issue 9, not 11). This is the study that does establish the claim: "because of what we term the labor illusion, when websites engage in operational transparency by signaling that they are exerting effort, people can actually prefer websites with longer waits to those that return instantaneous results, even when those results are identical." Experiment 2: with transparency, participants chose the waiting option over instantaneous results 62 percent of the time at 30 seconds and 63 percent at 60 seconds; without transparency, 42 percent at 30 seconds and 23 percent at 60. Note that the famous "searching Delta... searching United..." illustration does not appear in the paper; the actual manipulation was "a continually changing list of which sites were being searched."

**The Houston airport anecdote.** Alex Stone, "Why Waiting Is Torture," *New York Times*, 18 August 2012. The real numbers, which are usually inverted: after adding baggage handlers the average wait fell to eight minutes, made up of one minute walking plus seven minutes standing at the carousel, so 88 percent of the time was unoccupied. The airport then moved arrival gates away and routed bags to the outermost carousel, making the walk six times longer, and "complaints dropped to near zero." Stone also quotes MIT's Richard Larson: people overestimate time spent in line by about 36 percent. Flag this honestly: the op-ed names no airport, no date, no study and no source, so present it as a reported anecdote, not a documented case.

**Lee, Chung, Song, Chang and Kim, "While We Wait... How Users Perceive Waiting Times and Generation Cues during AI Image Generation," CHI EA 2025.** Interviews with 11 users of AI image tools found that people generally accepted and sometimes valued waiting time, viewing it "as an inherent part of the creative process," and that participants "rarely notice generation cues." The authors conclude that waiting and progress signalling need reconceptualization for generative AI.

**Why it matters here.** Together these say something specific. Occupied time beats unoccupied time (Houston). Visible work raises perceived value (Buell and Norton). But progress bars alone do less than folklore claims (Myers), and in generative AI people barely look at the cue and do not resent the wait (CHI 2025). claude-omegle's real opportunity is not to hide the wait or decorate it but to occupy it, and the CHI finding suggests users will accept that framing rather than experience it as an apology for slowness.

Sources: https://api.crossref.org/works/10.1145/317456.317459, https://www.hbs.edu/ris/Publication%20Files/Norton_Michael_The%20labor%20illusion%20How%20operational_f4269b70-3732-4fc4-8113-72d0c47533e0.pdf, https://web.archive.org/web/2013id_/http://www.nytimes.com/2012/08/19/opinion/sunday/why-waiting-in-line-is-torture.html, https://dl.acm.org/doi/10.1145/3706599.3719725

---

## E. Waiting and lobbies in games

### E1. Namco's loading-screen minigame patent (1994-2015) and Ridge Racer's Galaxian

US Patent 5,718,632, inventor Yoichi Hayashi, assigned to Namco. Priority 2 December 1994, filed 27 November 1995, granted 17 February 1998, expired 27 November 2015. It claims loading an auxiliary game first, "then loading the main-game program code while the auxiliary game is running." The demonstration case is the PlayStation port of Ridge Racer (Japan, 3 December 1994), which lets you play a full round of Galaxian while the CD loads, unlocking eight additional cars if you win. (The 1993 arcade Ridge Racer does not have this; the Galaxian minigame is PlayStation-only, and Sakagami included it because he had worked on Galaxian's arcade team.) The EFF's assessment is that the patent probably would not have survived a challenge, but that Namco never had to sue: the chilling effect alone kept loading-screen games out of the industry for twenty years.

**Why it matters here.** This is the closest historical parallel to claude-omegle's whole premise, and its lesson is discouraging in a useful way. For two decades the idea "put something in the loading screen" was obvious, technically easy, and almost nobody did it. The obstacle was not desire or difficulty; it was a structural blocker. Worth asking what the structural blocker is here, and the answer is probably not patents but the moderation and liability story.

Sources: https://patents.google.com/patent/US5718632A/en and https://www.eff.org/deeplinks/2015/12/loading-screen-game-patent-finally-expires

### E2. "Journey" (thatgamecompany, 2012)

Released for PS3 on 13 March 2012. You are silently paired with an anonymous stranger. There is no text chat, no voice chat and no username; the only communication is a musical chirp, and the other player's name is revealed only after the credits. Jenova Chen on why: "If you see 'iownyourdad' or 'ikillyourmom', you just instantly stop putting on those colored glasses, and it's not a human-human interaction anymore." And on the shape of it: "Journey is just like hiking. You go to hike a mountain, and there are other hikers you might meet." Most importantly for this project, Chen deliberately built **no lobbies**, because "other players have to be able to connect at any time, not just the beginning of the game." He also insisted "the cooperation is not forced; you're totally fine doing it yourself."

**Why it matters here.** Journey is the best existing answer to how you make an anonymous stranger encounter feel good rather than threatening: strip identity, restrict the communication channel to something too narrow to carry hostility, and make cooperation optional. If claude-omegle's video call feels like too much, Journey is the argument for a much thinner channel (a shared cursor, a heartbeat, a chime) that still registers as another human being.

Source: https://blog.playstation.com/2011/01/11/jenova-chen-explains-journey-social-relevance-and-artistic-inspirations/

### E3. "Kind Words" (2019) and "Death Stranding" (2019)

*Kind Words (lo fi chill beats to write to)*, Popcannibal, Humble Bundle Original 6 July 2019, Steam 12 September 2019. Players anonymously write short requests for letters about their problems, and other players write letters of comfort or gentle advice; separately, "paper airplanes" carry tiny unprompted messages of kindness across other players' screens. There are no reply chains: you send a letter and get no reaction, which removes the reward loop that trolling depends on. Designer Ziba Scott: "Out of well over half a million letters written, we've had to address just shy of 3 percent of that content, and most of that is off-topic, not trolling." It won Game Beyond Entertainment at the 2020 BAFTA Games Awards. *Death Stranding* (Kojima Productions, 8 November 2019) makes other players' ropes, bridges, generators, supplies and messages appear in your world, lets you "like" them, and never lets you meet them directly. Kojima's stated theme, from 2016: "the first tool mankind invented was the stick... And the next thing mankind invented was the rope... Connection is the theme of the whole game."

**Why it matters here.** Both are proofs that asynchronous, anonymous, low-bandwidth contact with strangers can be warm and can be moderated cheaply. Kind Words in particular is the design answer to claude-omegle's hardest problem: it achieved a 3 percent intervention rate by removing the feedback that makes abuse rewarding, not by hiring moderators. If live video proves untenable, a "leave a note for the next person who is waiting" mechanic is a fully validated fallback.

Corrections: the paper airplanes are a separate broadcast mechanic, not the reply channel. Kind Words was only *nominated* at The Game Awards and got an IGF honorable mention; it has no Games for Change award. "Ladders" as a Death Stranding structure could not be sourced from a fetched page (unverified); use ropes, bridges and generators.

Sources: https://en.wikipedia.org/wiki/Kind_Words_(video_game), https://kotaku.com/kind-words-a-game-about-sending-nice-letters-to-strang-1840537946, https://gameinformer.com/b/features/archive/2016/06/15/an-interview-with-hideo-kojima.aspx

### E4. Lobbies as social space: Among Us and Fortnite

*Among Us* (InnerSloth, mobile 15 June 2018, Steam 16 November 2018, exploded in 2020 via Twitch) has a lobby where players spawn, customise their character at a wardrobe crate, and wait for the host to start. The load-bearing fact, documented on the community wiki rather than any official source: **the lobby is the only location where all players can use chat at any time.** Everywhere else, chat is restricted. In *Fortnite* (26 September 2017), Spawn Island is where all players gather before the Battle Bus; players can build, destroy, loot and attack, none of it persists, and nobody can lose health. Both are consequence-free spaces attached to a consequential game.

**Why it matters here.** Two structural insights. First, the waiting room is often where the only unrestricted sociality in a system lives, precisely because it is outside the stakes. Second, both designs make the waiting room consequence-free by construction. claude-omegle's call is similarly outside the stakes of your work, and it should be designed to stay that way: nothing said in the wait should follow you.

Be careful citing this. Wikipedia and the official sites describe neither lobby; the details come from user-generated wikis. And there is essentially **no** academic literature on game lobbies as social spaces. The nearest adjacent work is Steinkuehler and Williams, "Where Everybody Knows Your (Screen) Name: Online Games as 'Third Places'," *JCMC* 11(4), 2006, which is about MMO worlds, not lobbies. Do not overstate this.

Source: https://academic.oup.com/jcmc/article/11/4/885/4617703

### E5. Idle games as a critique of waiting: "Cow Clicker" (2010) and "Cookie Clicker" (2013)

Ian Bogost launched *Cow Clicker* on 21 July 2010 as a deconstructive satire of Facebook social games, distilled to clicking a cow on a timer (the interval, commonly given as six hours, is unverified here). It amassed over 50,000 players who largely enjoyed it unironically, and Bogost ended it on 7 September 2011 with the "Cowpocalypse," rapturing every cow out of the game, after which "some devoted players still click where a cow used to be." His critique is the most quotable thing in this document on the subject of machine-imposed waiting: social games commit "the disrespect of time that we might otherwise spend doing more valuable things, or even just pondering the thoughtful and unexpected ideas that an asynchronous game might raise. Social games so covet our time that they abuse us while we are away from them, through obligation, worry, and dread over missed opportunities." Julien Thiennot (Orteil) wrote *Cookie Clicker* in a single evening on 8 August 2013, posted it to 4chan, and had 50,000 players within hours; it is credited with establishing the idle genre.

**Why it matters here, and it is a warning.** Bogost's line about games that "abuse us while we are away from them, through obligation, worry, and dread over missed opportunities" describes a real failure mode for claude-omegle. If the plugin creates an expectation that you should be on a call whenever your agent runs, it has converted free time into obligation. Bogost also became captured by his own satire ("Perhaps I became consumed myself"), which is a live risk for a project that is half joke and half sincere.

Sources: https://bogost.com/blog/cow_clicker_1/ and https://en.wikipedia.org/wiki/Cookie_Clicker

---

## F. Co-presence while working

### F1. Focusmate (founded c. 2016-2017, launched 2018) and body doubling

Founded by Taylor Jacobson, with the origin experiment in 2015 and public launch on Product Hunt in March 2018 (the founding year is genuinely contested: Tracxn says 2016, Starter Story says 2017, the company states none). You book a 25, 50 or 75-minute slot, get matched with a stranger, join a video call, greet them, state your goal, keep your video on, work in silence, and check in at the end. Self-reported scale: over 12 million completed sessions, over 500 million minutes, 150-plus countries.

**Why it matters here.** Focusmate is the single most important commercial validation for claude-omegle. It proves that a real, sustained, paying population will sit on video with a stranger while working, in silence, for the accountability effect. The greet-goal-work-check-in ritual is a proven script; claude-omegle should steal it wholesale, compressed. The key structural difference is the timer: Focusmate's is chosen by a human in advance, and claude-omegle's is set by a compile, which is the genuinely novel move.

Two cautions. **Do not credit Focusmate with "body doubling."** The term was coined in 1996 by ADHD coach Linda Anderson, confirmed in peer-reviewed work (Eagle, Baltaxe-Admony and Ringland, ASSETS '23). And there is **no independent peer-reviewed study of Focusmate's effectiveness**; the "99 percent of members report improved productivity, average 143 percent increase" figure is a vendor survey of 834 members from February 2024. Cite it as such or not at all.

Sources: https://www.focusmate.com/how-it-works and https://doi.org/10.1145/3597638.3614486

### F2. Flow Club (2021) and the "study with me" / gongbang genre

Flow Club was founded in 2021 by Ricky Yean and David Tran, and it differs from Focusmate in exactly the ways claude-omegle would have to choose between: groups of up to nine rather than pairs, a volunteer community host who runs the session, optional focus music, and 30 to 180-minute blocks. Their stated rationale for the group size is precise: "Just big enough where you're not on the spot, but small enough that you're not completely invisible." It is still operating as of September 2026. The adjacent mass phenomenon is *gongbang* (공부방송, "study broadcast"), the Korean-origin "study with me" genre live since about 2018, where creators stream hours of themselves silently studying; Bot no Jam has roughly 320,000 subscribers and a first live video with 530,000 views. Twitch formalised it as a "Co-Working & Studying" category. The academic answer to why people watch is Lee et al., CHI '21: viewers use these videos "to create a personalized ambience at a lower cost, to find controllable peer pressure, and to get emotional support."

**Why it matters here.** "Controllable peer pressure" is the exact phrase for what claude-omegle offers, and the gongbang genre proves the appetite exists at enormous scale with **zero** interaction, which is a strong argument that one-way or broadcast modes deserve consideration alongside the paired call. Flow Club's group-of-nine finding also suggests a pair may be the worst size: too exposed to ignore, too small to hide in.

Sources: https://www.flow.club/vs-focusmate and https://doi.org/10.1145/3411764.3445222

### F3. Airtime (2012), Houseparty (2016-2021), Clubhouse (2020-)

The commercial graveyard, and the survivor. **Airtime** launched 5 June 2012 from Sean Parker and Shawn Fanning as an explicitly "safer Chatroulette," matching Facebook users by mutual friends, similar interests or proximity. Its launch event was a public disaster: microphones failed, Jimmy Fallon interviewed the founders, and Olivia Munn, Joel McHale, Ed Helms, Julia Louis-Dreyfus, Jim Carrey, Alicia Keys and Snoop Dogg improvised through mounting technical collapse while Parker called it "a fucked up situation" on stage. Parker's own retrospective in 2016: "The product didn't work. Demos crashed, the Facebook invite system refused to function... No one used it." **Houseparty** (Life on Air, February 2016, from the Meerkat team) was explicitly friends-only, splitting the screen up to eight ways, notifying your friends when you opened it, and letting you "lock" a room. Epic acquired it on 12 June 2019; it recorded 50 million sign-ups in a single month during the 2020 lockdowns, roughly 70 times normal in some markets; Epic announced its shutdown on 9 September 2021 and it went dark in October. **Clubhouse** launched in March 2020, invite-only, iOS-only, with a "hallway" feed showing which live audio rooms your network was in. It went from 3.5 million downloads on 1 February 2021 to 8.1 million by 15 February, raised at a 4 billion dollar valuation, then lost 21 percent of weekly actives in three weeks and halved its staff in April 2023. It is still live and shipping roughly twice a week as of September 2026.

**Why it matters here.** The pattern is unambiguous and unkind. Every attempt to make stranger video into a mainstream consumer product has failed, and the two things that survive are the narrow ones: friends-only (Houseparty, until Epic lost interest) and purpose-bound (Focusmate). claude-omegle is purpose-bound by construction, which is the right side of that line, but it should not be mistaken for a social network. Note also the Clubhouse correction: the hype collapsed and the headcount halved, but the app did not die.

Sources: https://techcrunch.com/2016/04/21/airtime/, https://techcrunch.com/2021/09/09/epic-games-to-shut-down-houseparty-in-october-including-the-video-chat-fortnite-mode-feature/, https://apps.apple.com/us/app/clubhouse/id1503133294

---

## G. Prior-art scan

**Headline result: the exact concept is unoccupied, but the neighbourhood is crowded, and that is the more useful finding.**

Nothing found anywhere pairs *humans* on live video because both their AI agents are busy, and auto-terminates when an agent finishes. But there is a substantial and fast-growing ecosystem of Claude Code plugins that fill agent wait time, and every single one of them is **solo**. That is the gap, and it is a narrow one.

### G1. Nothing directly matches

Searched via WebSearch, the GitHub search API and the Hacker News Algolia API. Nine GitHub repo searches returned literally zero results, including `claude code video call stranger waiting agent`, `omegle developers waiting build compile chat`, `"coding agent" webrtc random pairing strangers waiting`, and `claude code hook opens video call when agent starts`. HN Algolia returned zero for `random video call match developers while coding` and `"waiting for" AI social connect strangers`.

The two queries named in the original research brief were run last, directly against Hacker News's Algolia API after the WebSearch budget was exhausted. `chatgpt waiting room` (stories) returned twelve unrelated Show HN and Ask HN items, none about a social waiting room during AI generation. `loading screen social AI` returned eight unrelated items, none about connecting people during AI wait time. A third query, `"waiting room" AI social strangers`, returned **zero hits**. The literal phrase searches on the open web (as opposed to HN) could not be run, so treat those two specific string searches as HN-only.

**Caveat that must be stated: Reddit was not searchable.** reddit.com blocks the crawler at the domain level, so r/ClaudeAI and r/cursor were never checked. That is a real hole in the negative result and should be closed manually.

### G2. The closest mechanic found anywhere is a pair of Zoom patents

- **US 11,936,813 B2, "Collaborative virtual waiting room with connection modes"** (Zoom, filed 7 March 2023, granted 19 March 2024). Users waiting for a contact-centre agent are placed in a collaborative virtual waiting room and "virtually interact with at least a subset of the waiting users" by video, audio or text, and the claim specifies that "responsive to an indication to activate a private session between the user device and an agent device... the user [is] removed from the virtual waiting room." https://patents.google.com/patent/US11936813B2/en
- **US 11,627,224 B1, "Queue management of collaborative virtual waiting rooms"** (Zoom, granted 11 April 2023), same family, text-first. https://patents.google.com/patent/US11627224B1/en

This is structurally the same idea: strangers socialise during a machine-determined wait, and the socialising is terminated by the machine event. The domain is a call-centre queue rather than LLM inference. Worth knowing about, though a patent on a virtual waiting room in a different field is unlikely to be a practical obstacle (not legal advice).

### G3. The solo wait-fillers, which is the real prior art

This category grew fast and is the direct competitive set. Every one is single-player.

| Project | What it is | URL |
|---|---|---|
| **while-you-wait** | Claude Code plugin: "Turn your AI agent's thinking time into your time." Quizzes, snake, typing trainer, repo chat. Auto-pauses when Claude needs you. Structurally the same plugin, with content instead of a person. | https://github.com/AlexandreSoteras/while-you-wait |
| **claudemon** | "Wild Pokemon appear while you work in Claude Code." Every 20 seconds of Claude's work is a step through tall grass. Product Hunt #7 of the day, 139 upvotes. Its only social feature is offline code-based trading. | https://github.com/zamarrowski/claudemon |
| **waitingfor.ai** | "A meditative waiting room for Claude/Codex," Show HN 11 July 2026. The author built it because he "kept finding myself getting distracted during those unpredictable stretches while Claude or Codex was working." Explicitly a solitary space. | https://waitingfor.ai/ |
| **elevator-music** | Plays elevator music while Claude waits. Show HN, 56 points, the highest-scoring item found in the space. | https://github.com/Sevii/agent-marketplace/blob/main/plugins/elevator-music/README.md |
| **claude-arcade** (three unrelated projects with the same name) | Terminal minigames while Claude works. | https://github.com/nesteazy-rishabh/claude-arcade, https://github.com/bearjew91/claude-arcade, https://claude-arcade.lovable.app/ |
| **claude-code-arcade** | Games rendered in the status line. | https://github.com/jystervinou/claude-code-arcade |
| **runlaid** | "100 Satirical Mini-Games That Play While Claude Works." | https://github.com/iam25th1/runlaid |
| **return-space-for-claude** | Rings a singing bowl and opens a breathing companion while Claude works. | https://github.com/oasihani/return-space-for-claude |
| **Bacon** | "An ad network that pays developers while their Claude works." Show HN 17 June 2026. Monetises the same dead time. | https://news.ycombinator.com/item?id=48572417 |
| **repotato** | Browse and support GitHub repos from the terminal while Claude works. The closest thing to social, but asynchronous discovery, not contact. | https://github.com/mnlt/repotato |
| clawdgotchi, Clawdachi, sidecrab, MenubarCC | Desktop pets that react to Claude's state. | https://github.com/stevysmith/clawdgotchi |

**The pattern across roughly fifteen projects: every one fills the wait with content, a game, a pet, or an animation. Not one fills it with another person.** That is the claim claude-omegle can make honestly.

### G4. The plumbing already exists

Claude Code's hook system provides exactly the primitives the concept needs. The `Stop` event fires when Claude finishes responding, `SubagentStop` for subagents, and `Notification` supports matchers including `agent_completed`, `agent_needs_input`, `idle_prompt` and `permission_prompt`. Docs: https://code.claude.com/docs/en/hooks and https://code.claude.com/docs/en/hooks-guide

There is a dense community of notification hooks built on this (echook, claudio, ccnudge, claude-code-webhook, crai, vibechime, claude-lamp, warpdotdev/claude-code-warp), all of which do agent-start and agent-finish signalling. **Nobody has wired those events to a video call.** That is a one-line summary of the opportunity.

### G5. Loading-screen art for LLM latency already exists, inside Claude Code

Claude Code ships roughly 187 rotating "spinner verbs" (Pondering, Percolating, Schlepping, Baking, Marinating, Simmering, Flibbertigibbeting), which the community has catalogued, taxonomised into cerebral, culinary, kinetic and whimsical categories, and written dictionaries about. Since roughly v2.1.23 (January 2026) users can override them via `spinnerVerbs` in `~/.claude/settings.json`, and there are third-party collections of 3,600-plus custom verbs across 113 themed categories, plus at least one devotional reskin (claude-adhkar, which replaces the verbs with Arabic adhkar).

**This is significant for the project's framing.** The premise "the LLM wait is unclaimed aesthetic territory" is not quite true. It is already the most affectionately decorated surface in the product, and there is an existing community practice of treating it as expressive space. claude-omegle is the next move in an established genre, not the opening of one.

Sources: https://deepakness.com/raw/claude-spinner-verbs/, https://danielmiessler.com/blog/customized-spinner-verbs-in-claude-code, https://github.com/wynandw87/claude-code-spinner-verbs

**What was NOT found:** no gallery, net-art or installation work specifically about LLM latency, the spinner, or waiting for generation. Searched repeatedly through Rhizome's Net Art Anthology, post-internet art indexes and general art search. The only near-miss was Patrick Lichty's "Aesthetics of the Latent Space," which is about latent space, not latency. That territory is genuinely open.

### G6. The discourse exists and is thin

People are asking the question and not answering it.

- Ask HN, "What do you do while you wait for your agent?" (11 August 2026). The body is literally "Mahjjong? Rawdogging? Sit Ups? Sudoku?" One commenter just links xkcd 303. https://news.ycombinator.com/item?id=49257326
- Ask HN, "How do you cope with the broken rythm of agentic coding?" (12 March 2026). Best articulation found: "waiting 10 to 30 seconds until the next question/confirmation. Those very small wait times do not let me reach a concentration state... I feel I am hovering the code." https://news.ycombinator.com/item?id=47356614
- Ask HN, "What should I do when the coding agents run?" (25 January 2026), zero comments. https://news.ycombinator.com/item?id=46753695
- Victor Ko, "From 'Compiling!' to 'Agent Thinking!' The Excuse That Took 20 Years to Recompile." The closest published commentary to the concept's premise. https://medium.com/riuzzang/from-compiling-to-agent-thinking-the-excuse-that-took-20-years-to-recompile-0e83b66ed869
- **xkcd 303, "Compiling" (15 August 2007).** Two developers sword-fighting on office chairs; the manager shouts "Get back to work!"; the reply is "Compiling!" This is the cultural ancestor of the entire premise, and it is about the *social* use of machine wait time, which is exactly the thread claude-omegle picks up. https://xkcd.com/303/

### G7. Agent-to-agent projects exist, human-to-human does not

`claude-link` is P2P WebRTC between two Claude Code sessions, text-only, and its README explicitly notes it is designed so "the agent code alone is not enough for a **stranger** to find you." It has the right transport and deliberately rejects stranger matching. `agent-talk` lets your agent message other agents "including ones run by other people." `claude-threads` puts humans and an agent in a shared Slack channel. None of these are wait-triggered, video, or between strangers.

https://github.com/AlexZihaoXu/claude-link, https://github.com/xhluca/agent-talk

### G8. "Omegle for X" for developers exists, without the wait trigger

Devgle (https://devgle.vercel.app/), OmeDEV (https://github.com/playsrc/omedev), xappy.fun ("Omegle for Indie Hackers and Builders," Show HN October 2025), BrainsMingle, PitchStage. All are random video chat for a professional niche. None is triggered by anything. The wait trigger is the novel component, not the stranger matching.

### G9. Closeness ranking

Zoom's virtual-waiting-room patents (same mechanic, wrong domain) > while-you-wait, claudemon, waitingfor.ai, elevator-music and the arcade family (same trigger, same hook plumbing, solo content instead of a person) > Focusmate (same social mechanic, human-chosen timer) > Devgle and OmeDEV (same stranger mechanic, no trigger) > claude-link and agent-talk (right transport, wrong participants).

**The specific fusion, a stranger on video, matched by agent-busy, hung up by agent-done, is unoccupied.**

---

## H. Eight insights the concept should absorb

### 1. The blameless exit is the concept's single best idea, and it needs a floor

Omegle's "Next" button was a rejection, and everyone on the other side of it knew that. A machine-imposed hang-up is structurally different: nobody chose to leave, so nobody was left. That is a genuine improvement on every stranger-chat product ever shipped, and it is the thing to build the pitch around. But it only works above a duration floor. A call that connects and drops after forty seconds is not a blameless exit, it is a machine-generated insult, and it will feel worse than being Nexted. Set a minimum session length, or only dial for tasks predicted to exceed it, and consider a grace period after the agent finishes so the exit is a goodbye rather than a cut.

### 2. Video with strangers always needs a moderation story, and the only affordable one is automatic

The New York-Dublin Portal was civic, funded, physically supervised, and broken within five days. Chatroulette's default state was 89 percent male with roughly one in eight spins R-rated, and it only recovered by handing moderation to a classifier so good that "using humans in the moderation loop hurts the system's performance." Omegle was closed by a product-design ruling that survived Section 230 specifically because the *matching* was the alleged defect, independent of any content. A hobbyist project cannot staff moderation. The Portal's actual fix is the model: a mechanical, automatic, blameless intervention (proximity blur) rather than a human judgment. Ship with an off-the-shelf nudity classifier, a one-tap block, and a documented policy, on day one, not after the first incident.

### 3. Strangers-on-video-while-working is a proven, sustainable behaviour

Focusmate reports over 12 million completed sessions of exactly this: a stranger, on video, in silence, while you work. Gongbang proves the appetite at even larger scale with zero interaction. The behavioural question is settled; you do not need to convince anyone that this is a thing people will do. Steal Focusmate's script (greet, state your goal, work, check out) compressed into whatever the agent gives you, because an unstructured stranger call collapses and a ritualised one does not.

### 4. Waiting is designable material, not dead time, and the users already agree

Farman: "time itself is a medium that communicates." Alexander: the buffer is where the infrastructure becomes visible. Buell and Norton: with visible effort, people chose a 60-second wait over instant results 63 percent of the time. And the 2025 CHI study found that users of generative AI tools already accept waiting "as an inherent part of the creative process" and barely notice progress cues. That last finding is the permission slip: you are not apologising for latency, you are furnishing a room the users have already agreed to sit in. Frame the plugin as occupying the wait, not as compensating for it.

### 5. Bishop's critique lands, and the encounter is currently too cozy

Everyone claude-omegle connects is a paying Claude Code user, working in software, waiting on a build, probably English-speaking, probably in a handful of time zones. That is Bourriaud's microtopia exactly, and Bishop's charge holds: "the quality of the relationships in relational aesthetics are never examined or called into question," and the microtopia "is still predicated on the exclusion of those who hinder or prevent its realization." The strongest version of the project introduces friction rather than removing it. Options: a machine-set topic (Omegle's Spy mode already did this, and Sehgal's escalating age chain is the art-world version), deliberate cross-pairing by geography or seniority, or surfacing what the two people's agents are actually doing so the mismatch is visible.

### 6. Restrict the channel before you widen it

Journey removed text, voice and usernames and kept a chirp, because "if you see 'iownyourdad'... it's not a human-human interaction anymore." Kind Words removed the reply loop and got trolling down to a fraction of 3 percent of content without a moderation team. Death Stranding lets you leave a rope and receive a like and never meet. Abramović proved that silent mutual gaze with no task is not empty but overwhelming. Goffman named the protocol two strangers will actually reach for, which is civil inattention: acknowledge, then dim the lights, then work. Full duplex video with audio is the *most* expensive and most dangerous version of this idea. Build the thin version first: video on, audio off, no names, a wave and a nod. It is cheaper, safer, closer to what people want during focused work, and more defensible as art.

### 7. Boredom is being taken from someone, and the project should say so

Benjamin's dream bird is the honest objection: boredom is where experience is hatched, and "a rustling in the leaves drives him away." Bogost's charge against social games is the operational version: they commit "the disrespect of time that we might otherwise spend doing more valuable things, or even just pondering the thoughtful and unexpected ideas that an asynchronous game might raise," and they "abuse us while we are away from them, through obligation, worry, and dread over missed opportunities." If claude-omegle becomes something you feel you *should* be doing during every agent run, it has converted your last unstructured minutes into an obligation and made things worse. Design against that explicitly: default off, easy to skip, no streaks, no ratings, no score, no history.

### 8. The wait is already decorated, and the hard part is not the idea

Two honest weaknesses to hold together. First, the aesthetic territory is not empty: Claude Code's 187 spinner verbs are a beloved, user-customisable loading-screen art project already inside the product, and roughly fifteen shipped plugins fill agent wait time with games, pets and music. claude-omegle is a move within an existing genre, and its only real novelty is putting a *person* there. Second, the Namco patent teaches that "obvious idea, easy to build, nobody did it for twenty years" usually means there is a structural blocker rather than a lack of imagination. Here the blocker is not patents; it is that a two-person random video product carries a liability and moderation burden out of proportion to a hobby project, on a user base too small to sustain matching. Both of those are survivable, but only if faced up front. The cold-start problem in particular is severe: this needs many people waiting simultaneously to work at all, and a plugin with a hundred users will produce mostly empty calls.

---

## I. Alternative names

Avoiding the Omegle trademark and legacy is worth doing, and there is a further reason: omegle.com is live again as of 2026 under a new registrant (RC Tech America Inc.), so the name now points at an active third-party product rather than a dead one.

1. **Interstice**. From Bourriaud's "social interstice," the space in human relations that suggests other trading possibilities than the surrounding system. Precisely names what the plugin occupies, and gives the project its theory for free.
2. **Blocking**. A blocking call is what your agent is making you do, and it is also what happens to your attention. Native to the audience, quietly funny, no product conflict found.
3. **Yield**. A thread yields to let something else run, and you yield to a stranger. Two-word explanation, one-word name.
4. **Meanwhile**. The plainest and warmest option. Describes the thing exactly with no cleverness, which ages better than a pun.
5. **Dream Bird**. From Benjamin, "boredom is the dream bird that hatches the egg of experience." Distinctive, memorable, and it puts the project's central tension (are you hatching the egg or scaring the bird?) in the name.
6. **Civil Inattention**. Goffman's term for the exact behaviour the product should encourage: acknowledge, then look away, then work. Too long for a package name, excellent as a tagline under a shorter one.
7. **Long Poll**. A long poll is a request held open waiting for something to happen, and a poll is also a person you are checking in with. Dev-native, slightly obscure, which is a feature.
8. **Second Person**. The grammatical mode of address and, literally, the other human. Works as a name and as a concept.
9. **Standby**. Broadcast and aviation both use it for the state of being ready and unoccupied. Neutral, calm, and it sets the right expectation (you are not obliged to perform).

**Names to avoid.** Anything ending in "-egle" or "-oulette" inherits both the trademark risk and the reputational one. "Dead Air" is taken (deadair.chat, a live communications platform). "Hole in Space" belongs to Galloway and Rabinowitz and should stay a citation, not a name. Searches were run for Interstitial, Meanwhile, Yield, Hold Music, Dead Air and Blocking Call, and only Dead Air produced a conflict. Interstice, Long Poll, Second Person, Dream Bird and Standby were **not** searched (the session's search budget ran out), so treat those five as unchecked. A proper trademark search is a separate exercise in any case.

---

## J. Sources

### A. Telepresence
- Hole in Space, artists' page: https://www.ecafe.com/getty/HIS/
- Howe Bukowski, *Spectator* 41:1 (Spring 2021), on Hole in Space: https://cinema.usc.edu/spectator/41.1/07_Bukowski.pdf
- Larry Press, "Hole in Space: the mother of all video chats": https://circleid.com/posts/20230120-hole-in-space-the-mother-of-all-video-chats
- Paul Sermon, Telematic Dreaming: https://www.paulsermon.org/dream/dream.html and https://www.paulsermon.org/dream/synopsis.html
- Sita Popat, "Missing in Action: Embodied Experience and Virtual Reality" (on Kozel): https://eprints.whiterose.ac.uk/id/eprint/103480/3/PopatMissing%20in%20Action.pdf
- Lozano-Hemmer, The Trace: https://www.lozano-hemmer.com/the_trace.php
- Lozano-Hemmer, Body Movies: https://www.lozano-hemmer.com/body_movies.php
- Shared Studios: https://www.sharedstudios.com/ and https://amarbakshi.com/story
- Vilnius-Lublin Portal: https://en.wikipedia.org/wiki/Vilnius%E2%80%93Lublin_Portal
- New York-Dublin Portal: https://en.wikipedia.org/wiki/New_York%E2%80%93Dublin_Portal
- RTE on the Dublin shutdown: https://www.rte.ie/news/dublin/2024/0514/1449041-dublin-portal/
- CBS on the reopening terms: https://www.cbsnews.com/newyork/news/nyc-dublin-portal-reopens/
- Irish Times on the actual ending: https://www.irishtimes.com/ireland/dublin/2024/10/22/philadelphia-here-we-come-dublin-portal-link-to-united-states-switches-from-new-york/

### B. Stranger chat
- Omegle farewell letter (archived 9 Nov 2023): https://web.archive.org/web/20231109003559/https://www.omegle.com/
- Omegle 2009 launch homepage: https://web.archive.org/web/20090328064809id_/http://omegle.com:80/
- Eric Goldman on the Section 230 ruling: https://blog.ericgoldman.org/archives/2022/07/omegle-denied-section-230-dismissal-am-v-omegle.htm
- C.A. Goldberg on A.M. v. Omegle: https://www.cagoldberglaw.com/omegle-lawsuit-cagoldberg-section-230/
- Lawfare on the shutdown and Section 230: https://www.lawfaremedia.org/article/what-the-omegle-shutdown-means-for-section-230
- BBC, "Omegle: Children expose themselves on video chat site": https://www.bbc.com/news/technology-56085499
- Wired on Chatroulette and AI moderation: https://www.wired.com/story/chatroulette-rise-again-help-ai/
- RJMetrics Chatroulette statistics, TechCrunch: https://techcrunch.com/2010/03/16/chatroulette-stats-male-perverts/
- Sam Anderson, "The Human Shuffle," New York Magazine: https://nymag.com/news/media/63663/
- Julia Ioffe, "Roulette Russian," The New Yorker: https://www.newyorker.com/magazine/2010/05/17/roulette-russian
- Merton, Chat Roulette Funny Piano Improv #1: https://www.youtube.com/watch?v=JTwJetox_tU
- Eva and Franco Mattes, No Fun: https://0100101110101101.org/no-fun/
- Brooklyn Rail on No Fun: https://web.archive.org/web/20251209040317/https://brooklynrail.org/2010/06/artseen/eva-and-franco-mattes-aka-0100101110101101org-reality-is-overrated/
- Petra Cortright, VVEBCAM: https://anthology.rhizome.org/vvebcam
- Jon Rafman, Nine Eyes: https://anthology.rhizome.org/9-eyes
- Miranda July, Somebody: https://somebodyapp.com/ and https://mirandajuly.com/somebody-app/
- Lauren Lee McCarthy: https://lauren-mccarthy.com/SOMEONE, https://lauren-mccarthy.com/Social-Turkers, https://lauren-mccarthy.com/Follower
- McCarthy and McDonald, How We Act Together: https://get-lauren.net/How-We-Act-Together
- Kyle McDonald, People Staring at Computers: https://kylemcdonald.net/psac/
- Kyle McDonald, Sharing Faces: https://github.com/kylemcdonald/sharingfaces
- Post-Omegle landscape (LBC): https://www.lbc.co.uk/article/video-chatrooms-british-children-5HjdF9B_2/

### C. Relational aesthetics
- Bourriaud, Relational Aesthetics (publisher): https://www.lespressesdureel.com/EN/ouvrage.php?id=5
- Bourriaud, English text (mirror): https://kyl.neocities.org/books/%5BART%20BOU%5D%20relational%20aesthetics.pdf
- Tiravanija, untitled (free/still), MoMA: https://web.archive.org/web/2023/https://www.moma.org/collection/works/147206
- Tiravanija, untitled 1990 (pad thai), MoMA PS1: https://www.momaps1.org/en/events/318-rirkrit-tirvanija-s-untitled-1990-pad-thai
- Bishop, "Antagonism and Relational Aesthetics," October 110 (2004): https://sciami.com/scm-content/uploads/sites/7/2017/04/Claire-Bishop-antagonism-and-relational-aesthetics-october-2004.pdf
- Bishop abstract, CUNY Academic Works: https://academicworks.cuny.edu/gc_pubs/96/
- Tino Sehgal, This Progress, Brooklyn Rail: https://brooklynrail.org/2010/03/artseen/tino-sehgal/
- Debord, "Report on the Construction of Situations" (1957): https://www.bopsecrets.org/SI/report.htm
- SI "Definitions," Internationale Situationniste #1 (1958): https://www.bopsecrets.org/SI/1.definitions.htm
- Abramović, The Artist Is Present, MoMA: https://web.archive.org/web/2023/https://www.moma.org/calendar/exhibitions/964
- Marco Anelli, Portraits in the Presence of Marina Abramović: https://marcoanelli.com/portraits-in-the-presence-of-marina-abramovic/

### D. Waiting and the stranger
- Farman, Delayed Response (Yale UP): https://yalebooks.yale.edu/book/9780300225679/delayed-response/
- LARB review of Farman: https://lareviewofbooks.org/article/i-hate-to-wait-on-jason-farmans-delayed-response-the-art-of-waiting-from-the-ancient-to-the-instant-world/
- Cynthia Wang review, International Journal of Communication 14 (2020): https://ijoc.org/index.php/ijoc/article/download/14965/3085/45587
- Alexander, "Rage against the Machine," Cinema Journal 56(2): https://api.openalex.org/works/doi:10.1353/cj.2017.0000
- Benjamin, "The Storyteller" (full text): https://arl.human.cornell.edu/linked%20docs/Walter%20Benjamin%20Storyteller.pdf
- Benjamin, The Arcades Project (Convolute D): https://monoskop.org/images/e/e4/Benjamin_Walter_The_Arcades_Project.pdf
- Simmel, "The Stranger" (Wolff trans.): http://www.osea-cite.org/tourismworkshop/resources/Simmel_The_Stranger.pdf
- Rubin (1975), ERIC record: https://eric.ed.gov/?id=EJ120409
- Goffman, civil inattention, quoted and sourced: https://pmc.ncbi.nlm.nih.gov/articles/PMC10508291/
- Hirschauer, "On Doing Being a Stranger": https://www.theorie.soziologie.uni-mainz.de/files/2019/09/2005_TheSoBe_On-Doing-Being-a-Stranger.pdf
- Turkle, Alone Together: https://archive.org/details/alonetogetherwhy0000turk
- Myers (1985), CHI '85: https://api.crossref.org/works/10.1145/317456.317459
- Buell and Norton, "The Labor Illusion" (HBS PDF): https://www.hbs.edu/ris/Publication%20Files/Norton_Michael_The%20labor%20illusion%20How%20operational_f4269b70-3732-4fc4-8113-72d0c47533e0.pdf
- Alex Stone, "Why Waiting Is Torture," NYT (archived): https://web.archive.org/web/2013id_/http://www.nytimes.com/2012/08/19/opinion/sunday/why-waiting-in-line-is-torture.html
- Lee et al., "While We Wait...," CHI EA 2025: https://dl.acm.org/doi/10.1145/3706599.3719725

### E. Games
- Namco patent US 5,718,632: https://patents.google.com/patent/US5718632A/en
- EFF on the patent expiry: https://www.eff.org/deeplinks/2015/12/loading-screen-game-patent-finally-expires
- Game Developer on the expiry: https://www.gamedeveloper.com/business/2015-the-year-we-get-loading-screen-mini-games-back
- Jenova Chen on Journey (PlayStation Blog): https://blog.playstation.com/2011/01/11/jenova-chen-explains-journey-social-relevance-and-artistic-inspirations/
- Jenova Chen (Game Developer): https://www.gamedeveloper.com/design/a-personal-journey-jenova-chen-s-goals-for-games
- Kind Words: https://en.wikipedia.org/wiki/Kind_Words_(video_game) and https://store.steampowered.com/app/1070710/
- Kotaku on Kind Words moderation: https://kotaku.com/kind-words-a-game-about-sending-nice-letters-to-strang-1840537946
- Kojima on rope vs stick, Game Informer (2016): https://gameinformer.com/b/features/archive/2016/06/15/an-interview-with-hideo-kojima.aspx
- Steinkuehler and Williams, "Online Games as Third Places," JCMC 11(4): https://academic.oup.com/jcmc/article/11/4/885/4617703
- Ian Bogost on Cow Clicker: https://bogost.com/blog/cow_clicker_1/
- Wired on Cow Clicker: https://www.wired.com/2011/12/ff-cowclicker/
- Cookie Clicker: https://en.wikipedia.org/wiki/Cookie_Clicker

### F. Co-presence
- Focusmate, how it works: https://www.focusmate.com/how-it-works
- Eagle, Baltaxe-Admony and Ringland, body doubling, ASSETS '23: https://doi.org/10.1145/3597638.3614486
- ADDA on Linda Anderson and the body double: https://add.org/the-body-double/
- Flow Club vs Focusmate: https://www.flow.club/vs-focusmate
- Lee et al., "Personalizing Ambience and Illusionary Presence," CHI '21: https://doi.org/10.1145/3411764.3445222
- Korea Herald on gongbang: https://www.koreaherald.com/view.php?ud=20180617000188
- Sean Parker on Airtime's failure: https://techcrunch.com/2016/04/21/airtime/
- Houseparty shutdown: https://techcrunch.com/2021/09/09/epic-games-to-shut-down-houseparty-in-october-including-the-video-chat-fortnite-mode-feature/
- Clubhouse: https://en.wikipedia.org/wiki/Clubhouse_(app) and https://apps.apple.com/us/app/clubhouse/id1503133294

### G. Prior art
- Claude Code hooks reference: https://code.claude.com/docs/en/hooks
- Claude Code hooks guide: https://code.claude.com/docs/en/hooks-guide
- Zoom, collaborative virtual waiting room patent: https://patents.google.com/patent/US11936813B2/en
- Zoom, queue management patent: https://patents.google.com/patent/US11627224B1/en
- while-you-wait: https://github.com/AlexandreSoteras/while-you-wait
- claudemon: https://github.com/zamarrowski/claudemon
- waitingfor.ai: https://waitingfor.ai/ and https://news.ycombinator.com/item?id=48872779
- elevator-music: https://github.com/Sevii/agent-marketplace/blob/main/plugins/elevator-music/README.md
- claude-link: https://github.com/AlexZihaoXu/claude-link
- Spinner verbs list: https://deepakness.com/raw/claude-spinner-verbs/
- Customising spinner verbs: https://danielmiessler.com/blog/customized-spinner-verbs-in-claude-code
- Ask HN, "What do you do while you wait for your agent?": https://news.ycombinator.com/item?id=49257326
- Ask HN, "How do you cope with the broken rythm of agentic coding?": https://news.ycombinator.com/item?id=47356614
- xkcd 303, Compiling: https://xkcd.com/303/

---

## Appendix: claims that did not survive verification

Recorded so they do not creep back in.

1. **Buell and Norton is Management Science 57(9), not 57(11).**
2. **Myers (1985) does not show that waits feel shorter with a progress bar.** He shows preference; the related test was not statistically significant and contradicted prior published results.
3. **The Houston numbers are usually inverted.** One minute walking plus seven at the carousel equals an eight-minute wait; the fix made the walk six times longer. And the anecdote is unsourced in the original op-ed.
4. **"Searching Delta... searching United..."** does not appear in Buell and Norton. It is a popularisation.
5. **Rubin (1975) used airport departure lounges only.** No bus terminal. He also did not coin "stranger on a train"; Bargh, McKenna and Fitzsimons (2002) did.
6. **Farman does not state a "three-second rule" of web latency.**
7. **"Boredom is the dream bird" is from "The Storyteller" (1936), not the Arcades Project.**
8. **The NYC-Dublin Portal did not close because of misbehaviour.** It was a six-month arts installation that ended slightly early to make room for another work.
9. **Telematic Dreaming uses projection, not chroma-key.** The keying piece is Telematic Vision.
10. **Tiravanija's 1992 dish was Thai curry.** Pad thai was 1990.
11. **"Microtopia" is Bourriaud's word,** which Bishop turns against him.
12. **Body doubling was coined in 1996 by Linda Anderson,** twenty years before Focusmate.
13. **Ridge Racer's Galaxian minigame is PlayStation-only (1994).** The 1993 arcade game does not have it.
14. **Merton's video is from 11 March 2010, not February.**
15. **Kind Words won a BAFTA but has no Games for Change award,** and was only nominated at The Game Awards.
16. **Flow Club is 2021, not 2020.** Airtime matched on mutual friends, not friends-of-friends.
17. **Clubhouse did not die.** The hype collapsed and the staff halved; the app still ships.
18. **Focusmate's effectiveness has no independent peer-reviewed study.** The 143 percent figure is a vendor survey.
19. **There is essentially no academic literature on game lobbies as social spaces.** Among Us and Fortnite lobby details come from user-generated wikis only.
20. **Reddit could not be searched** during the prior-art scan. r/ClaudeAI and r/cursor remain unchecked.
