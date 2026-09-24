import { SITE_ADDON } from "@/lib/site/addon";
import type { Dict } from "./pl";

/**
 * English copy for the marketing site.
 *
 * Not a literal translation - the Polish original speaks to Polish agency
 * owners, so a few sentences are rewritten to make sense outside Poland.
 * Route keys (`href`) stay in Polish: `localeHref` maps them to `/en/...`.
 */
export const en: Dict = {
  nav: {
    links: [
      { href: "/#moduly", label: "Product" },
      { href: "/wzory", label: "Websites" },
      { href: "/integracje", label: "Integrations" },
      { href: "/cennik", label: "Pricing" },
      { href: "/blog", label: "Blog" },
      { href: "/o-nas", label: "About" },
    ],
    login: "Log in",
    loginLong: "Log in",
    cta: "Book a call",
    menu: "Menu",
    closeMenu: "Close menu",
    language: "Language",
  },

  footer: {
    tagline: "The operating system for real estate agencies. Built inside a working agency in Kraków, Poland.",
    madeIn: { before: "Built at ", company: "Spectra Nieruchomości", after: ", Kraków" },
    sections: [
      {
        title: "Product",
        links: [
          { href: "/", label: "Home" },
          { href: "/cennik", label: "Pricing" },
          { href: "/demo", label: "Demo" },
          { href: "/dla-agentow", label: "For agents" },
          { href: "/dla-wlascicieli", label: "For agency owners" },
        ],
      },
      {
        title: "Resources",
        links: [
          { href: "/blog", label: "Blog" },
          { href: "/o-nas", label: "About AgentSpace" },
          { href: "/kontakt", label: "Contact" },
        ],
      },
      {
        title: "Legal",
        links: [
          { href: "/polityka-prywatnosci", label: "Privacy policy" },
          { href: "/regulamin", label: "Terms of service" },
        ],
      },
    ],
    operator: "Operated by:",
    contact: "Contact:",
  },

  common: {
    bookCall: "Book a call",
    seeModule: "See the module",
    priceSuffix: "PLN / mo",
    from: "from",
  },

  home: {
    meta: {
      title: "AgentSpace | The operating system for real estate agencies",
      description:
        "One workspace for the whole agency: client CRM, shared property database, sales goals and pipeline, commission settlements, an AI Coach for call practice and an owner dashboard. Live from day one.",
    },
    hero: {
      eyebrow: "For real estate agencies",
      title: { a: "The whole agency ", b: "in one place" },
      lead: {
        a: "Clients, listings, goals, commissions and the agency website. Your agents work in one system, and you ",
        strong: "finally see the agency in numbers",
        b: ".",
      },
      ctaPrimary: "Book a call",
      ctaGhost: "See how it looks",
      note: "Live in one day · No fixed-term contract · Built by an agency owner",
      facts: [
        { value: 6, suffix: "", label: "modules in one system" },
        { value: 1, suffix: " day", label: "to go live, database import included" },
        { value: 30, suffix: " days", label: "to your first conclusions from data" },
      ],
    },
    marquee: ["Clients", "Listings", "Goals", "Commissions", "Calendar", "Documents", "AI Coach", "Website"],
    values: {
      eyebrow: "Why an agency needs this",
      title: { a: "Three things that change ", b: "in the first month" },
      items: [
        {
          title: "More deals actually closed",
          body: "No lead gets lost in a spreadsheet or in an agent's phone. Follow-ups remind themselves, and every agent knows what matters most today.",
        },
        {
          title: "Less chaos in the office",
          body: "Clients, properties, tasks, commissions and documents in one place. No more database scattered across sheets, WhatsApp and paper notes.",
        },
        {
          title: "You see who is really working",
          body: "Daily goals, pipeline progress and a team ranking calculated from real activity. You decide on numbers, not on impressions.",
        },
      ],
    },
    modules: {
      eyebrow: "Modules",
      title: { a: "Six modules, ", b: "one system" },
      lead: "You do not have to roll out everything at once. Most agencies start with the CRM and goals, then switch on the rest over the following weeks.",
      items: [
        {
          slug: "crm",
          name: "Client CRM",
          body: "Client records with history, notes and a pipeline. Separate types for sellers, buyers, landlords and tenants. The database stays with the agency, not in an agent's phone.",
        },
        {
          slug: "nieruchomosci",
          name: "Shared property database",
          body: "Listings visible to the whole team, with photos and status. The agent working with a buyer sees what a colleague has on the selling side.",
        },
        {
          slug: "cele",
          name: "Goals and sales pipeline",
          body: "An annual target broken down to the day: calls → meetings → listing agreements → sales. Daily tracker, weekly plan and a history of what was hit.",
        },
        {
          slug: "prowizje",
          name: "Commissions and deals",
          body: "A deal record with five stages and its documents. Commissions calculate themselves and the monthly target updates live. Reservation agreements generate straight to PDF.",
        },
        {
          slug: "ai-coach",
          name: "AI Coach",
          body: "Agents rehearse with an AI client: cold calls, listing appointments, rentals. 13 scenarios, 9 client personalities, voice, scoring and written feedback.",
        },
        {
          slug: "panel-wlasciciela",
          name: "Owner dashboard",
          body: "Ranking, the team's strong and weak areas, commissions per agent and a drill-down into any individual. A monthly report lands in your inbox.",
        },
      ],
    },
    inside: {
      eyebrow: "This is what it looks like inside",
      title: "A whole agency day in one system",
      lead: "From the morning plan, through listings and viewings, to commissions and documents at the notary. Below are eight screens the team uses every day. Click to see each one.",
      tabs: [
        {
          key: "pulpit",
          label: "Agent dashboard",
          note: "Today's goals, tasks and commission in one view. The agent knows what to do before the coffee is finished.",
        },
        {
          key: "nieruchomosci",
          label: "Listings",
          note: "A shared listing database with processed photos and the agency watermark. One checkbox publishes a listing on the agency website and on portals.",
        },
        {
          key: "klienci",
          label: "Client record",
          note: "The entire contact history in one place: calls, viewings and agreements. The next conversation attaches to the same history instead of creating a duplicate contact.",
        },
        {
          key: "cele",
          label: "Goals",
          note: "The annual target broken all the way down to today: calls, conversations, meetings, agreements. The agent sees what is left today, not in an abstract quarter.",
        },
        {
          key: "kalendarz",
          label: "Calendar",
          note: "Meetings, viewings and calls in one view, together with the rhythm of the day: when the team actually calls and when people actually pick up.",
        },
        {
          key: "prowizje",
          label: "Deals",
          note: "Five deal stages, the full document set and a commission that calculates itself, including the split between agents.",
        },
        {
          key: "dokumenty",
          label: "Documents",
          note: "Agreements, land register extracts and certificates sit with the listing and the client at the same time. Download links expire, so they do not circulate on WhatsApp.",
        },
        {
          key: "zespol",
          label: "Owner dashboard",
          note: "Commissions, calls and listings broken down per person. The system flags who needs a conversation before it turns into a problem.",
        },
      ],
    },
    field: {
      eyebrow: "A day at the agency",
      title: { a: "The work happens ", b: "in the field", c: ", not in spreadsheets" },
      lead: "The system should sit beside the work, not replace it. That is why everything an agent does during the day is one tap away on the phone.",
      tiles: [
        {
          alt: "Townhouse in the city centre",
          title: "Prospecting",
          body: "A call to an owner is saved as a contact and counts towards the daily goal immediately. The next conversation with that number attaches to the same history.",
        },
        {
          alt: "Living room",
          title: "Viewing",
          body: "You upload photos from your phone and the system adds the agency watermark and pushes the listing to the website and the portals.",
        },
        {
          alt: "Staircase",
          title: "Deal",
          body: "The agreement, certificates and commission in one place. The agent settlement calculates itself, including the split and the tax.",
        },
      ],
    },
    steps: {
      eyebrow: "Step by step",
      title: { a: "From first call to first conclusions - ", b: "30 days" },
      items: [
        {
          n: "01",
          title: "A call and an agency audit",
          body: "30 minutes. We look at how a lead travels through your agency today and where you actually lose deals. You get the findings whether or not we work together.",
        },
        {
          n: "02",
          title: "Live in one day",
          body: "We create the agency account, import your client and property database and invite your agents. We configure goals and the pipeline around how you work. No installation, no IT department.",
        },
        {
          n: "03",
          title: "First conclusions in 30 days",
          body: "After a month you have the full picture: who hits their goals, where the team loses leads, how the calls actually sound. From there you manage on numbers, not impressions.",
        },
      ],
    },
    problems: {
      eyebrow: "Sound familiar",
      title: { a: "Three things that cost an agency ", b: "the most" },
      lead: "None of them shows up in the P&L. All of them show up in the number of deals.",
      items: [
        {
          title: "The agency database lives in agents' phones",
          body: "An agent leaves and takes the contacts, the call history and the relationships. You are left with a spreadsheet nobody has updated in six months.",
        },
        {
          title: "You do not know what happens between stand-ups",
          body: "You know how many deals closed. You do not know how many calls were made, how many meetings happened, or which agent got stuck two weeks ago - until it is too late.",
        },
        {
          title: "New agents learn on your clients",
          body: "A new hire's first conversations are burned leads. With nowhere to practise, every mistake costs a real commission.",
        },
      ],
    },
    compare: {
      eyebrow: "Comparison",
      title: { a: "The same day at the agency, ", b: "two scenarios" },
      withLabel: "With AgentSpace",
      withoutLabel: "Without a system",
      rows: [
        { label: "Client database", with: "One shared client record with history and notes", without: "Spreadsheets, notebooks, WhatsApp and the agent's memory" },
        { label: "Owner's phone number", with: "Entered in the system, stays with the agency", without: "In the agent's phone, and it leaves when they do" },
        { label: "Knowing what the team does", with: "Ranking, daily goals, pipeline progress", without: "Whatever gets said at the morning stand-up" },
        { label: "Commission settlement", with: "Calculated automatically from the deal", without: "A spreadsheet somebody has to close by hand" },
        { label: "A new agent", with: "Practises with the AI from day one", without: "Learns on real clients" },
        { label: "Monthly report", with: "Arrives by e-mail on the 1st of the month", without: "You build it yourself on Sunday evening" },
      ],
    },
    onboarding: {
      eyebrow: "Onboarding",
      title: { a: "Your team starts working ", b: "the next day" },
      body: "We run the rollout ourselves, start to finish. We import your client and listing database, set up goals and the commission split around your model, and train the team on your own data.",
      items: [
        "Client and listing import from your current system",
        "Training on your data, not on sample records",
        "A named contact who picks up the phone, not a ticket queue",
        "Price frozen for 24 months on an annual agreement",
      ],
      cta: "Book your rollout",
    },
    manifest: {
      eyebrow: "In plain words",
      text: "We are not selling software. We are selling a calmer Monday: you know who is calling whom, which listing is stuck and where your deals actually come from.",
      points: [
        { title: "Built by an agency", body: "Written in Kraków, inside a working agency, against real deals." },
        { title: "A human answers", body: "You write to me, not to a ticket system. You get a reply the same day." },
        { title: "No lock-in", body: "Export your data to a spreadsheet whenever you want, without asking." },
      ],
      photos: [
        { alt: "Apartment interior", caption: "Viewing, Podgórze" },
        { alt: "House", caption: "Handing over the keys" },
        { alt: "Terrace", caption: "Photo session" },
      ],
    },
    origin: {
      eyebrow: "Where this came from",
      title: "A system written inside a real estate agency",
      quote: {
        a: "I run a real estate agency called ",
        company: "Spectra",
        b: " in Kraków. I know the moment when a good agent leaves and takes half the database with them, and I know what that costs an agency. ",
        accent: "AgentSpace is the system I needed myself for years.",
        c: " I build it for my own agency and open it up to agencies facing the same thing.",
      },
      author: "Wiktor Szostek",
      role: "Founder · Spectra Nieruchomości, Kraków",
    },
    sites: {
      eyebrow: "Add-on",
      title: { a: "An agency website that ", b: "updates itself" },
      lead: `Eight ready-made templates. A listing added in the system is on the website the same minute, and an enquiry from the website comes back into the CRM as a contact and a task for an agent. A separate service, ${SITE_ADDON.monthly} PLN per month.`,
      cta: "See all eight templates",
      priceLink: "What it costs",
    },
    pricing: {
      eyebrow: "Pricing",
      title: { a: "You pay for the size of the agency, ", b: "not per module" },
      lead: "Every plan includes the full feature set of its tier. No mid-month per-seat surcharges.",
    },
    notFor: {
      eyebrow: "Honestly",
      title: "AgentSpace is not for every agency",
      lead: "Better to say it now than three months in.",
      items: [
        {
          title: "You work solo or as a pair",
          body: "Rankings, the owner dashboard and team reports make no sense at that size. You would pay for features you will not use.",
        },
        {
          title: "You do not want to lead a team",
          body: "AgentSpace shows the data and hands you the tools, but it does not manage for you. If nobody opens the dashboard once a week and talks to the agent who is slipping, no system fixes that.",
        },
        {
          title: "You are looking for a listing syndication tool",
          body: "We are not a bulk portal publishing system. Portal export is on the roadmap, but today AgentSpace is the system an agency works in, not a listing distributor.",
        },
      ],
    },
    faq: {
      eyebrow: "Questions",
      title: "What people ask most often",
      items: [
        {
          question: "Is AgentSpace live today?",
          answer:
            "Yes. The system runs in production and is used daily in real estate agencies, including Spectra in Kraków, where it is built. Onboarding a new agency takes one working day.",
        },
        {
          question: "Will AgentSpace replace my current system?",
          answer:
            "In most agencies, yes. AgentSpace covers the client CRM, a shared property database, goals, commissions, tasks and documents. If you use a dedicated tool for bulk listing syndication, keep it alongside for now. We check this against your specific setup on the call.",
        },
        {
          question: "How long does onboarding take and who does it?",
          answer:
            "One working day. We create the account, import your client and property database, invite the agents and configure goals around how you work. We do it with you, we do not hand you an empty system.",
        },
        {
          question: "Will the agents accept it?",
          answer:
            "Agents adopt tools that help them and reject tools that monitor them. So AgentSpace starts with what the agent gets: a plan for the day, follow-ups drafted by AI, visible progress towards a goal and a place to rehearse before a hard call. The owner dashboard is a by-product of their daily work, not separate reporting.",
        },
        {
          question: "Do we have to record calls with real clients?",
          answer:
            "No. The AI Coach is a simulation - the agent practises with an AI client, not a real one. Zero GDPR exposure on your clients' side. Analysis of real recordings is on the roadmap and will be optional.",
        },
        {
          question: "Where is the agency data stored?",
          answer:
            "On servers in the European Union (Frankfurt). Your agency's data is isolated from other agencies, and only users you invite can reach it, according to their role: CEO, manager, agent.",
        },
        {
          question: "Is there a fixed-term contract?",
          answer:
            "No. Monthly billing, cancel whenever you want. We do not want to hold an agency with a contract - if the system does not deliver value, you should be able to walk away.",
        },
      ],
    },
    cta: {
      title: { a: "Ready to ", b: "put the agency in order", c: "?" },
      lead: "A 30-minute call. We will find where your agency loses deals - you keep the findings whether or not we work together.",
      button: "Book a call",
    },
  },

  coach: {
    eyebrow: "AI Coach",
    title: { a: "Agents rehearse the call ", b: "before they dial a client" },
    lead: "The client is artificial, the objections are real. The conversation runs by voice or text, and when it ends the agent gets a score and one concrete thing to fix. No being graded in front of the whole team.",
    pick: "Pick the objection you are practising",
    scoreTitle: "Call score",
    points: [
      { title: "13 scenarios", body: "Cold calls, prospecting, viewings, rentals and commission negotiation." },
      { title: "9 client types", body: "From monosyllabic to openly hostile. Each one reacts differently to the same argument." },
      { title: "Score and one tip", body: "Points for the opening, qualification, objections and the close, plus one thing to fix." },
    ],
    scenarios: [
      {
        key: "za-drogo",
        chip: "Your fee is too high",
        title: "Price objection",
        person: "Christopher, apartment owner",
        lines: [
          { who: "klient", text: "Three percent? Your competitor does it for one and a half.", tag: "price objection" },
          { who: "agent", text: "Understood. May I ask what exactly is included in that one and a half?", tag: "" },
          { who: "klient", text: "Well... a portal listing, and that is about it.", tag: "" },
          { who: "agent", text: "That is exactly why I asked. Our fee covers a photographer, a floor plan, home staging and running the negotiation. The last three apartments we sold on this street went for about 4 percent above what the neighbours were asking.", tag: "" },
          { who: "klient", text: "Hm. And realistically, how long does it take?", tag: "buying signal" },
        ],
        scores: [
          { label: "Handling the objection", value: 9 },
          { label: "Open questions", value: 8 },
          { label: "Argument from data", value: 9 },
          { label: "Closing", value: 6 },
        ],
        tip: "Good that you did not defend the price straight away. Close with a question about a meeting time before the client ends the call themselves.",
      },
      {
        key: "mam-biuro",
        chip: "I already have an agent",
        title: "Cold call",
        person: "Anna, listing found on a portal",
        lines: [
          { who: "klient", text: "Thank you, I already work with an agency.", tag: "brush-off" },
          { who: "agent", text: "Of course, I am not asking you to switch. One question: the apartment has been listed for six weeks, has the price been reduced yet?", tag: "" },
          { who: "klient", text: "Once, by twenty thousand. Still nothing.", tag: "" },
          { who: "agent", text: "That is typical when the photos do not convey the space. May I send you a free summary of actual sale prices on your street? No obligation, you can judge for yourself.", tag: "" },
          { who: "klient", text: "All right, send it to my e-mail.", tag: "agreed to contact" },
        ],
        scores: [
          { label: "Opening", value: 8 },
          { label: "Qualification", value: 9 },
          { label: "Objections", value: 8 },
          { label: "Booking a next step", value: 9 },
        ],
        tip: "Excellent pivot from a refusal to something concrete. Next time ask when to send it, so you have a reason to call again.",
      },
      {
        key: "sam-sprzedam",
        chip: "I will sell it myself",
        title: "Winning the listing",
        person: "Mark, private listing",
        lines: [
          { who: "klient", text: "Why would I need an agent? I can list it myself.", tag: "value objection" },
          { who: "agent", text: "It can work. How many calls did you take this week?", tag: "" },
          { who: "klient", text: "About fourteen. Half were agencies, the rest asked the price and vanished.", tag: "" },
          { who: "agent", text: "So you are spending time on conversations that lead nowhere. We take that part on ourselves and only show the apartment to verified buyers. You show up at the notary.", tag: "" },
          { who: "klient", text: "And what does the agreement look like?", tag: "asking about terms" },
        ],
        scores: [
          { label: "Opening", value: 7 },
          { label: "Fact finding", value: 9 },
          { label: "Showing the value", value: 9 },
          { label: "Closing", value: 7 },
        ],
        tip: "The question about the number of calls did all the work. When they ask about the agreement, offer a meeting instead of explaining terms on the phone.",
      },
    ],
  },

  coachFlow: {
    scenarios: ["Cold call", "Follow-up", "Price objections", "Fee negotiation", "I need to think about it"],
    personalities: ["Aggressive", "Hesitant", "Price-driven", "Emotional", "Businesslike"],
    scores: ["Opening", "Qualification", "Objections", "Closing"],
    steps: [
      { title: "Pick a scenario", body: "Five situations from everyday agency work, from a cold call to negotiating your fee." },
      { title: "Pick a client personality", body: "The AI plays the client with a specific attitude, from aggressive to businesslike." },
      { title: "You speak out loud", body: "The microphone in your browser. You talk as you would to a real client, at a natural pace." },
      { title: "The AI answers out loud", body: "A natural tone that pushes back on your arguments. Not a chat with an assistant, a simulation of a client." },
      { title: "Score and tips", body: "After the session: a 1-10 score in four categories plus concrete suggestions to fix." },
    ],
  },

  form: {
    topics: [
      { value: "wdrozenie", label: "I want to roll out AgentSpace" },
      { value: "demo", label: "Show me a demo" },
      { value: "wspolpraca", label: "A partnership proposal" },
      { value: "media", label: "Press enquiry" },
      { value: "inne", label: "Something else" },
    ],
    successTitle: "Thank you",
    successBody: "We have your message. We will reply within 24 hours on business days.",
    honeypot: "Leave this empty",
    name: "Full name",
    namePlaceholder: "Jane Smith",
    email: "E-mail address",
    emailPlaceholder: "jane@agency.com",
    agency: "Agency name",
    optional: "(optional)",
    agencyPlaceholder: "e.g. Spectra Real Estate",
    topic: "Topic",
    topicPlaceholder: "Choose a topic...",
    message: "Message",
    messagePlaceholder: "How can we help?",
    submit: "Send message",
    submitting: "Sending...",
    genericError: "Something went wrong. Please try again in a moment.",
    offlineError: "No connection. Check your internet and try again.",
    consentBefore: "By sending this you accept our ",
    consentLink: "privacy policy",
    consentAfter: ".",
  },

  pages: {
    cennik: {
      meta: {
        title: "Pricing | AgentSpace for real estate agencies",
        description:
          "Three plans: Start 499 PLN, Pro 899 PLN, Agency from 1490 PLN per month. The price depends on how many agents you have, not on how many modules you switch on. No fixed-term contract.",
      },
      eyebrow: "Pricing",
      title: "You pay for the size of the agency, not per module",
      lead: "Every plan includes the full feature set of its tier. No mid-month per-seat surcharges and no fixed-term contract.",
      addon: {
        eyebrow: "Add-on",
        title: "The agency website",
        lead: "A separate service, outside the system subscription. You take it only if you want a website wired into your listing database. If you already have one, the system works exactly the same.",
        includes: [
          { title: "Eight templates to choose from", body: "Each with a full set of pages: listings, team, guides, a mortgage calculator and forms." },
          { title: "Listings straight from the CRM", body: "Tick a listing in the system and it is on the website. No retyping and no uploading photos twice." },
          { title: "Enquiries come back to the CRM", body: "A form on the website creates a contact and a task for an agent, instead of an e-mail that gets lost." },
          { title: "Your own domain and SEO", body: "We connect your domain, the sitemap and structured data for Google. Certificate and backups are on us." },
        ],
        subscription: "Subscription",
        perMonth: "/mo",
        yearNote: "or {yearly} PLN per year, which is two months free",
        setupNote:
          "A one-off setup fee of {setup} PLN: moving your content and photos, connecting your domain and configuring everything around the agency. Hosting, certificate and backups are in the subscription.",
        ctaTemplates: "See the eight templates",
        ctaPreview: "Request a preview on your own listings",
      },
      faq: {
        eyebrow: "Billing questions",
        title: "Before you ask",
        items: [
          {
            q: "What happens when I hire another agent?",
            a: "Nothing mid-month - we do not add per-seat charges. If the team stays above the plan limit, we move you to the higher plan at the next billing cycle. We tell you beforehand, we do not do it quietly.",
          },
          {
            q: "Is there a trial period?",
            a: "Instead of a classic trial we run a pilot rollout: for the first month we work together on your data. If you decide the system does not deliver value, we stop without invoicing the next period.",
          },
          {
            q: "Can I pay annually?",
            a: "Yes. On annual billing two months are free and the price is frozen for 24 months.",
          },
          {
            q: "Are there onboarding costs?",
            a: "There is no onboarding fee on Start and Pro. On the Agency plan we quote 1:1 rollout and team training individually, depending on the number of branches.",
          },
          {
            q: "Is the website included in the system price?",
            a: "No. The website is a separate service at {monthly} PLN per month plus a one-off setup fee of {setup} PLN. The system works fine without it, and if you already have a website, nothing has to change.",
          },
          {
            q: "What happens to my data if I leave?",
            a: "We export your entire client, property and deal database into files you can open in a spreadsheet. The data is yours - we do not hold an agency hostage to its own database.",
          },
        ],
      },
      cta: { title: "Not sure which plan?", lead: "Tell us how many agents you have and how you work today. We will say plainly whether AgentSpace makes sense for you.", button: "Book a call" },
    },

    onas: {
      meta: {
        title: "About AgentSpace | Built inside a real estate agency",
        description: "Who built AgentSpace and why. A system for real estate agencies, written inside a working agency in Kraków.",
      },
      hero: {
        eyebrow: "About AgentSpace",
        title: "Built by an agency, for agencies - no compromises",
        description:
          "AgentSpace is not another generic real estate SaaS with a new coat of paint. It is built in Kraków by somebody who runs a real estate agency day to day and knows exactly what hurts.",
        photoAlt: "Kraków at night",
        photoCaption: "Kraków, our own backyard",
      },
      founderLabel: "Founder",
      founderName: "Wiktor Szostek",
      founderParagraphs: [
        "I run a real estate agency called Spectra in Kraków. Every day I work with agents, sellers, buyers, mortgage advisers and lawyers. I see what you cannot see from inside a software house: how much time an agent loses, what a bad client call sounds like, where the conversion breaks.",
        "Over the past few years I tried everything - classroom training, mentoring, books, podcasts. Most of it costs money and barely changes an agent's daily work. The best people in the industry learn the hard way, through hundreds of burned leads. The weakest leave after six months.",
        "AgentSpace is the system I needed myself for a long time. I build it for my own agency, and I open it up to other agencies with the same problem.",
      ],
      principles: {
        eyebrow: "Product philosophy",
        title: "Four things we believe",
        items: [
          { number: "01", title: "Written in the language your clients speak", body: "Scripts, scenarios, objections and feedback are written for the market they are used in, not translated word for word from somewhere else." },
          { number: "02", title: "Daily practice beats events", body: "Fifteen minutes of practice a day beats a four-hour workshop once a quarter. The brain learns through repetition, not intensity." },
          { number: "03", title: "Data beats gut feeling", body: "Decisions about the team should rest on numbers - who is growing, where the gaps are. Not on a hunch about who looks promising." },
          { number: "04", title: "Market first, code second", body: "Every feature is tested in a working agency first. If it does not help agents in their daily work, it does not ship." },
        ],
      },
      roadmap: {
        eyebrow: "What is next",
        title: "Roadmap for the next 12 months",
        items: [
          { period: "Live today", title: "CRM, listings, goals and commissions", body: "A shared client and property database, a goal funnel from annual down to daily, commission settlements and the owner dashboard." },
          { period: "Live today", title: "AI Coach and agency websites", body: "Call practice with an AI client in three categories, plus an agency website wired into the listing database." },
          { period: "In progress", title: "Google Calendar sync", body: "The agent's day lined up with their meetings in both directions, without retyping appointments." },
          { period: "In progress", title: "Portal export and import from listing systems", body: "One click instead of pasting the same listing into five places." },
        ],
      },
      cta: { title: "Let us talk about your agency", lead: "We will show the system on your data and say plainly whether it makes sense for you. Onboarding takes one working day.", button: "Book a call →" },
    },

    kontakt: {
      meta: {
        title: "Contact | AgentSpace",
        description: "Get in touch with the AgentSpace team. Questions about the system for real estate agencies, the AI Coach, onboarding. We reply within 24 hours.",
      },
      hero: {
        eyebrow: "Contact",
        title: "Let us talk about your agency",
        description: "A question about AgentSpace, a request for a demo, a partnership? Write to us - we reply within 24 hours on business days.",
        photoAlt: "Townhouse courtyard",
        photoCaption: "We reply within 24 hours",
      },
      topics: [
        { title: "Onboarding", body: "Want to know what going live looks like in your agency?", cta: "Pick the topic “Onboarding” in the form" },
        { title: "Demo", body: "We will show exactly how AgentSpace would work for you, in 30 minutes.", cta: "Pick the topic “Demo” in the form" },
        { title: "Anything else", body: "Partnerships, press, an idea, criticism - we read all of it.", cta: "Just write, we will reply" },
      ],
      findUs: "How to reach us",
      labelEmail: "E-mail",
      labelAddress: "Address",
      labelResponse: "Response time",
      responseTime: "within 24h on business days",
      operatorTitle: "AgentSpace is operated by",
      founderLabel: "Founder:",
      formTitle: "Write to us",
    },

    demo: {
      meta: {
        title: "AgentSpace demo | See how the system works",
        description: "A demo of the AgentSpace platform: the AI Coach for call practice, the agent dashboard and the owner panel. Interactive mock-ups and a full training session walkthrough.",
      },
      hero: {
        eyebrow: "Demo",
        title: "See what AgentSpace looks like from the inside",
        description: "The main screens of the system. If you want to see it live, on your agency's own data, book a call.",
        photoAlt: "Modern building",
        photoCaption: "See the system live",
      },
      screens: [
        { eyebrow: "Screen 1", title: "The AI Coach in action", body: "The agent picks a scenario, picks a client personality and hits start. The microphone opens and the AI speaks the first line. The conversation runs like a real one, with pauses, objections and questions out of nowhere." },
        { eyebrow: "Screen 2", title: "The agent's daily dashboard", body: "Every agent has their own workspace. Plan for the day, commission tracking, statistics, ranking within the agency. Less spreadsheet, more focus on closing." },
        { eyebrow: "Screen 3", title: "Owner panel: the whole team at a glance", body: "Average session score, agent ranking, the team's weakest areas, alerts such as an agent who has stopped practising. Decisions on data, not on hunches." },
      ],
      flowEyebrow: "The full flow",
      flowTitle: "What one training session looks like, step by step",
      cta: { title: "Want a live demo in your own agency?", lead: "Book a 30-minute call. We will show exactly how AgentSpace would work for you.", primary: "Book a call", secondary: "Ask for a demo" },
    },

    agenci: {
      meta: {
        title: "For real estate agents | What you get from AgentSpace",
        description: "AgentSpace from an agent's point of view. Call practice with AI, a plan for the day, commission tracking, ranking. Less stress, more closings, a bigger commission.",
      },
      hero: {
        eyebrow: "For real estate agents",
        title: "Less stress, more closings, a bigger commission",
        description: "AgentSpace is not another monitoring tool for the boss. It is your daily tool - to rehearse hard conversations without risk, see your own progress and earn more.",
        photoAlt: "Apartment interior",
        photoCaption: "Presenting a listing",
      },
      benefitsTitle: "What you actually get",
      benefits: [
        { title: "Rehearse the hardest calls without risk", body: "You do not have to learn on real clients. The AI Coach plays the client with different personalities. After a session you know exactly what to fix. After 30 days your real conversations are calmer, shorter and more effective." },
        { title: "Fifteen minutes a day beats a quarterly workshop", body: "The brain learns through repetition. Fifteen minutes a day for a month is seven and a half hours of practice, and you remember all of it. A workshop once a quarter is forgotten in two weeks." },
        { title: "Concrete feedback, not “pretty good overall”", body: "After each session you get a 1-10 score in four categories (opening, qualification, handling objections, closing) plus two or three concrete tips: “you never asked about their timeline”, “you offered the fee too early”." },
        { title: "A plan for the day and commission tracking instead of spreadsheets", body: "One daily workspace: task list, today's numbers, progress towards the monthly target, commission updating live. All in one place, not across seven tabs." },
        { title: "You can see yourself improving", body: "After 30 days you see your own curve: session scores, closings, commission. Hard data, not “it feels better”. That motivates, and it makes the conversation about a promotion easier." },
      ],
      faqTitle: "What agents ask most often",
      faq: [
        { q: "Will my boss see how much I earn and how many calls I made?", a: "Yes, as part of the agency's results. But it works both ways: better numbers mean a stronger position when negotiating your split, a promotion or better leads. The best agents like visibility, because they win with it." },
        { q: "Do I have to record real clients?", a: "No. The AI Coach is a simulation with an AI client, not a recording of real calls. Full privacy." },
        { q: "How much time will it take each day?", a: "Fifteen minutes. In the car between viewings, at the office before the first call, at home after work. Pick whatever time suits you." },
        { q: "What if it goes badly? Will my boss see me fail?", a: "Your boss sees your results within the team - average score, number of sessions, the trend. They do not see what you said or which specific mistakes you made. Sessions are private." },
      ],
      cta: { title: "Tell your boss about AgentSpace", lead: "If you work at an agency you would like to see running AgentSpace, send your boss a link to this page.", button: "Book a call →" },
    },

    wlasciciele: {
      meta: {
        title: "For real estate agency owners | AgentSpace",
        description: "AgentSpace for agency owners. Lower agent churn, faster onboarding, decisions based on data. Plans from 499 PLN per month.",
      },
      hero: {
        eyebrow: "For agency owners",
        title: "A team that grows. Lower churn. Decisions based on data.",
        description: "AgentSpace is not another CRM. It is a system for developing the team - daily practice, tracking, ranking. Built by an agency owner in Kraków.",
        photoAlt: "Residential building",
        photoCaption: "The agency in numbers, not in hunches",
      },
      problemsTitle: "What probably hurts today",
      problems: [
        { stat: "60%", title: "of agents drop out within 6 months", body: "With no training system: a chaotic start and no feedback. The best leave, the weakest never learn what they are missing. Cost: 15-30k PLN per failed hire." },
        { stat: "8h", title: "a week on 1-on-1 mentoring", body: "Mentoring costs time. Senior agents do not want to do it, they want to sell. Internal training once a quarter is far too rare to change a habit." },
        { stat: "0", title: "objective data about the work", body: "You know who closed what. You do not know why Tom converts 1 in 8 and Kate converts 1 in 3. You decide on instinct." },
      ],
      benefitsTitle: "What you actually get",
      benefits: [
        { eyebrow: "Lower agent churn", title: "From 60% drop-out to 30% in six months", body: "Systematic practice plus visible progress means a new agent feels they are growing and supported. Every seat you save is 20-30k PLN not spent." },
        { eyebrow: "Faster onboarding", title: "From 3 months to 4 weeks to the first deal", body: "The AI Coach does what you have no time for: daily objection drills, scenarios, closing technique. A new agent meets a real client prepared." },
        { eyebrow: "Decisions based on data", title: "You see who grows, who stalls, where the team has a gap", body: "Session ranking, team averages, weakest areas, alerts. Hard data means concrete hiring and management decisions." },
        { eyebrow: "Higher team conversion", title: "On average 25-40% better objection handling", body: "After 30 days of practice agents have concrete answers to the five most common objections. That shows up directly in signed agreements." },
      ],
      roiTitle: "Simple arithmetic",
      roi: [
        { label: "Cost of AgentSpace", value: "from 499 PLN", suffix: "/ mo", accent: false },
        { label: "Average commission per deal", value: "~8,000 PLN", suffix: "", accent: false },
        { label: "Break-even", value: "+1 deal", suffix: "/ mo", accent: true },
        { label: "An 8-person team typically adds (after 30 days)", value: "+3-5 deals", suffix: "/ mo", accent: true },
      ],
      cta: { title: "See your agency in numbers", lead: "Going live, database import included, takes one working day, and the price is frozen for 24 months on an annual agreement. No fixed-term contract.", primary: "Book a call", secondary: "Let us talk" },
    },

    integracje: {
      meta: {
        title: "Integrations with real estate software | AgentSpace",
        description: "AgentSpace connects to the systems agencies already use every day: Asari, Galactica, IMO, Estiman. Keep your listing workflow, add team management.",
      },
      hero: {
        eyebrow: "Integrations",
        title: "You do not have to abandon a system that works",
        description: "Most agencies already keep their listings somewhere. AgentSpace does not force you to migrate everything on day one - we connect to listing systems so nobody types the same data twice.",
      },
      listEyebrow: "Systems",
      listTitle: "What AgentSpace connects to",
      listLead: "We keep the status current. If your system is not on the list, write to us and we will look into connecting it.",
      seeDetails: "See the details",
      otherSystemTitle: "Working on a different system?",
      otherSystemLead: "Tell us what your agency uses. We will check whether it can be connected to AgentSpace, and if it cannot, we will say so plainly.",
      otherSystemCta: "Ask about your system",
      detail: {
        label: "Integration",
        metaTitle: "AgentSpace + {name} - integration for real estate agencies",
        metaDescription: "How to connect {fullName} with AgentSpace: what synchronises, who it makes sense for and what the rollout looks like. Status: {status}.",
        notLive: "This integration is {status}.",
        notLiveBody: "We prioritise the work based on requests from agencies - if you work on {name}, let us know. Agencies that get in touch now are onboarded first and help shape the scope of the sync.",
        scopeEyebrow: "Scope",
        scopeTitleLive: "What synchronises",
        scopeTitlePlanned: "What will synchronise",
        whyEyebrow: "Why",
        whyTitle: "Why agencies connect them",
        splitEyebrow: "Division of roles",
        splitTitle: "What {name} does and what AgentSpace does",
        splitLead: "The systems do not overlap - each one owns a different stage of the agency's work.",
        theirSide: ["The listing database and how listings look", "Syndication to property portals", "Listing documentation"],
        ourSide: [
          "Team work: goals, pipeline, tasks for the day",
          "Commission settlement and the deal record",
          "Call practice with the AI Coach",
          "Owner dashboard and reports",
        ],
        ctaTitle: "Working on {name}",
        ctaLead: "Tell us how a listing and a client move through your agency today. We will say plainly whether connecting it to AgentSpace makes sense for you.",
        ctaButton: "Book a call",
        othersEyebrow: "The rest",
        othersTitle: "Other integrations",
      },
    },

    produkt: {
      moduleLabel: "Module",
      cta: "Book a call",
      problemEyebrow: "The problem",
      problemTitle: "Why this hurts",
      capabilitiesEyebrow: "What it does",
      capabilitiesTitle: "What {name} does",
      forWhom: "Who it is for",
      restEyebrow: "The rest of the system",
      restTitle: "Other modules",
      restLead: "AgentSpace works as a whole, but you roll it out gradually, at a pace the team can absorb.",
      ctaTitle: "See it on your own data",
      ctaLead: "A 30-minute call. I will show what {name} would look like in your agency, on your clients and your commission model.",
    },

    integracjaSzczegoly: {
      label: "Integration",
      aboutEyebrow: "The system",
      aboutTitle: "What {name} is",
      syncsEyebrow: "Data exchange",
      syncsTitle: "What moves between the systems",
      whyEyebrow: "Why",
      whyTitle: "Why agencies connect these two systems",
      backToList: "All integrations",
      cta: "Ask about this integration",
    },

    wzory: {
      meta: {
        title: "Websites for real estate agencies | templates | AgentSpace",
        description:
          "Ready-made website templates for real estate agencies and developers. Listings flow from the CRM to the website automatically, and forms on the website come back into the system as contacts and searches.",
      },
      hero: {
        eyebrow: "Websites",
        title: "An agency website wired into the system, not sitting beside it",
        description:
          "You pick a template, we connect your listing database and your domain. A listing added in AgentSpace is on the website immediately, and an enquiry from the website lands with a specific agent.",
      },
      demoNotice:
        "The live demos below are filled with Polish sample agencies and listings, so they open in Polish. Your own site is built in whatever language you work in.",
      gallery: {
        eyebrow: "Templates",
        title: "Eight designs for eight different agencies",
        lead: "These are not colour variants of one theme. Each has its own typography, grid and rhythm, because a premium agency, an agency with hundreds of rentals and a property developer need completely different things. Every template comes with the full set of pages: listings with filters and a map, listing pages, services, team, guides, a calculator and forms.",
        previewAlt: "Preview of the template",
        forWhom: "Built for:",
        see: "Open the template",
        listings: "Listing page",
      },
      custom: {
        eyebrow: "Custom design",
        title: "None of the templates fit? We will design the site from scratch",
        body: "The templates exist so you can launch in a week for sensible money. If you have your own identity, a strong idea, or a site that already works and you only want to raise it a level, we do a custom project: mock-up, consultations and a site written for you, still wired into AgentSpace.",
        points: [
          { title: "Mock-up before code", body: "First you see the design of the home page and a listing page. We only write code once you approve it." },
          { title: "Your identity", body: "Logo, colours, typefaces and tone of voice. If you do not have them, we help you put them together." },
          { title: "The same engine", body: "Listings, forms and the team work exactly as in the templates, because the same system sits underneath." },
        ],
        cta: "Let us talk about a custom design",
      },
      how: {
        eyebrow: "How it works",
        title: "From picking a template to a live website",
        steps: [
          { n: "01", title: "You pick a template", body: "Eight designs, each different: from editorial premium, through brutalist, to a single-development page for a property developer. We match colours, typefaces and copy to your logo." },
          { n: "02", title: "We connect your database", body: "The site reads listings straight from AgentSpace. An agent ticks “publish” on a listing and moments later it is on the site, with retouched photos and the agency watermark." },
          { n: "03", title: "You change the content yourself", body: "AgentSpace has a Website tab: logo, colours, section copy, the team and guide articles. No calling us and no surcharge for moving a comma." },
          { n: "04", title: "Forms come back to the CRM", body: "A listing enquiry, a property submission and a search request all create a contact, a task and an agent assignment in the system. Nothing gets lost in an inbox." },
          { n: "05", title: "Domain and hosting on us", body: "We connect your domain, the certificate and the backups. The site runs as long as the subscription does, with no separate server and no plugins to update." },
        ],
      },
      diff: {
        eyebrow: "What makes us different",
        title: "Why we do not build this on WordPress",
        lead: "Most agency websites are WordPress with a listings plugin. That works as long as somebody keeps an eye on updates, backups and performance. We went a different way.",
        items: [
          { title: "No WordPress, no plugins", body: "Nothing to patch and nothing that fails to update. The website is part of the system, not another piece of software to babysit." },
          { title: "Listings always current", body: "Change the price in the CRM and the price on the site changes. A sold listing disappears from the site on its own." },
          { title: "Photos once, everywhere", body: "The same watermarked photo set goes to the website, to the client PDF and to the portals." },
          { title: "Speed and Google", body: "We build the sites statically, so they load in a fraction of a second, which Google treats as a ranking signal." },
          { title: "Favourites and history", body: "A visitor saves listings to favourites, and the agent sees on the contact record what that person was looking at." },
          { title: "One subscription", body: "Website, CRM and support in one price. No invoices from three different companies every month." },
        ],
      },
      cta: {
        title: "Want to see your own listings in one of these?",
        body: "We will prepare a preview on your listings and your logo before you sign anything. All we need is an export from your current system or a link to your website.",
        price: "The website is a separate service: {monthly} PLN per month plus {setup} PLN setup. You do not have to take it with the system, and the system works perfectly well without it.",
        button: "Request a preview on your listings",
      },
    },

    blog: {
      meta: {
        title: "Blog | AgentSpace",
        description: "Practical material for real estate agencies: client conversations, objections, training agents, AI tools.",
      },
      hero: {
        eyebrow: "Blog",
        title: "Knowledge for real estate agencies",
        description: "Concrete material on client conversations, objections and running a team. No filler.",
      },
      languageNotice: "The articles are published in Polish. The product interface and this website are available in English.",
    },

    legal: {
      notice: "This document is published in Polish, and the Polish text is the binding version. If you need a translation before signing, write to nieruchomoscispectra@gmail.com and we will send one.",
    },
  },

  pricingWidget: {
    question: "How many agents work in your agency?",
    less: "Fewer agents",
    more: "More agents",
    forYou: "Your fit",
    note: "Net prices, billed monthly. No fixed-term contract - cancel whenever you want.",
    plans: [
      {
        id: "start",
        name: "Start",
        tagline: "For agencies putting the basics in order",
        features: [
          "Up to 5 agents",
          "Client CRM - records, notes, pipeline",
          "Shared property database",
          "Tasks and the daily dashboard",
          "Goals and sales pipeline",
          "Commission settlements",
        ],
      },
      {
        id: "pro",
        name: "Pro",
        tagline: "For agencies that want to grow the team",
        features: [
          "Up to 15 agents",
          "Everything in Start",
          "AI Coach - 13+ scenarios, 9 client personalities",
          "Owner dashboard - ranking, strong and weak areas",
          "AI Daily Assistant and follow-up drafting",
          "Monthly reports by e-mail",
          "Deal records and reservation agreements (PDF)",
        ],
      },
      {
        id: "biuro",
        name: "Agency",
        tagline: "For networks and multi-branch agencies",
        features: [
          "Unlimited agents",
          "Everything in Pro",
          "Roles: CEO, manager, agent",
          "Multiple branches and team splits",
          "1:1 rollout and team training",
          "Priority support",
        ],
      },
    ],
  },
};
