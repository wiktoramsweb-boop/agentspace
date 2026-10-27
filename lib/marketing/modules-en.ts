import type { ProductModule } from "./modules";

/**
 * English copy for the product module pages.
 *
 * Keyed by the same slug as the Polish version, so the URL and the routing
 * stay identical and only the text changes.
 */
export const MODULES_EN: Record<string, Omit<ProductModule, "slug" | "shot" | "photo" | "ilustracja">> = {
  crm: {
    name: "Client CRM",
    headline: "A client database that stays with the agency",
    lead: "Client records with history, notes and a pipeline. Sellers, buyers, landlords and tenants kept apart, because each of them needs a different conversation.",
    seoTitle: "CRM and client database for real estate agencies | AgentSpace",
    seoDescription:
      "A CRM designed for real estate agencies: client types, pipeline, notes, contact history. The database stays with the agency, not in an agent's phone.",
    problem:
      "In most agencies the client database lives in three places at once: a spreadsheet, the agent's phone and the agent's head. When the agent leaves, they take two of those three with them.",
    capabilities: [
      {
        title: "Four client types",
        body: "Sellers, buyers, landlords and tenants get separate records and separate paths. The agent working a buyer sees different fields than the agent working a seller.",
      },
      {
        title: "A pipeline you can actually see",
        body: "Every client sits at a stage. You can see how many have been stuck at the same stage longer than they should be, before they go cold.",
      },
      {
        title: "Notes from every contact",
        body: "Conversation history lives on the client record, not in a private notebook. When an agent is on holiday, somebody else can pick up the thread without asking where things stand.",
      },
      {
        title: "AI writes the follow-up",
        body: "On the client record the AI drafts the message and helps defuse the objection. The agent copies and sends instead of putting it off until tomorrow.",
      },
    ],
    forWhom:
      "For agents as their daily workspace, for the owner as a guarantee that the agency's database stays with the agency.",
    faq: [
      {
        q: "Will you migrate our existing client database?",
        a: "Yes, that is part of the rollout. We upload a spreadsheet or an export from your current system and map the columns onto AgentSpace fields. Contact history comes across.",
      },
      {
        q: "What happens to clients when an agent leaves?",
        a: "They stay in the agency database with their notes and history. When you remove an account the system asks who should take over their clients and listings, and shows how many there are.",
      },
      {
        q: "Can agents see each other's clients?",
        a: "That is your call. By default an agent sees their own, a manager sees their team and the CEO sees everything. You can also hide phone numbers from anyone who is not the record's owner.",
      },
    ],
  },

  cele: {
    name: "Goals and pipeline",
    headline: "The annual target, broken down into what the agent does today",
    lead: "A funnel from first call to completed sale, calculated backwards. The agent knows how many conversations today's plan requires to deliver the year.",
    seoTitle: "Sales goals for real estate agents | AgentSpace",
    seoDescription:
      "A sales funnel for real estate agencies: the annual target converted into daily activity. Daily tracker, weekly plan, history of what was hit.",
    problem:
      "“Forty deals this year” is not a goal, it is a wish. Without converting it into calls and meetings per week, nobody knows whether the plan is on track until it is too late.",
    capabilities: [
      {
        title: "A funnel calculated backwards",
        body: "Calls → meetings → listing agreements → buyers → sales. You enter the annual target and the system shows what it means today.",
      },
      {
        title: "Daily tracker",
        body: "The agent sees one ring: how much of today's goal is already done. Closing the day is celebrated, which works better than a table.",
      },
      {
        title: "Weekly plan",
        body: "The target spread across working days, taking holidays and field days into account.",
      },
      {
        title: "History",
        body: "Six weeks back. You see the trend, not one bad day.",
      },
    ],
    forWhom:
      "For the agent: clarity about what to do today. For the owner: an early signal that somebody is starting to slip.",
    faq: [
      {
        q: "Where do the funnel numbers come from?",
        a: "From the activities agents record anyway: calls, meetings and agreements. Nobody fills in a separate report.",
      },
      {
        q: "What if an agent misses their target?",
        a: "You see it straight away rather than at the end of the quarter. The system shows which stage of the funnel is short, so the conversation is about something specific.",
      },
      {
        q: "Who sets the targets, the owner or the agent?",
        a: "Both. The owner sets the agency target, the agent their own. The system breaks them down into weeks and days.",
      },
    ],
  },

  prowizje: {
    name: "Commissions and deals",
    headline: "Commissions that calculate themselves",
    lead: "A deal record with five stages and its documents. The monthly target updates on every close, with no spreadsheet to reconcile on a Sunday.",
    seoTitle: "Commission settlement for real estate agencies | AgentSpace",
    seoDescription:
      "Agent commission settlement: deal records, stages, documents, automatic calculation and the agency's monthly target.",
    problem:
      "Commission settlement is usually a spreadsheet one person understands, updated once a month, always containing two errors, most often against the agent, which corrodes trust.",
    capabilities: [
      {
        title: "Deal record",
        body: "Five stages from reservation to payout, with the full document set in one place. You can see where the deal stands and who everyone is waiting on.",
      },
      {
        title: "Automatic calculation",
        body: "The commission is derived from the deal value and the agreed split. The agent sees their number as it happens, not after the fact.",
      },
      {
        title: "The agency's monthly target",
        body: "Closed and contracted deals against the target. By mid-month you know whether you need to push.",
      },
      {
        title: "Reservation agreement as PDF",
        body: "Generated from the deal data, ready to sign. No retyping the same details into a word processor.",
      },
    ],
    forWhom:
      "For the owner: control over settlements. For the agent: certainty the commission was calculated fairly.",
    faq: [
      {
        q: "Do you handle commission splits between agents?",
        a: "Yes. The lead agent has their share, and you can add a co-agent, the other side's agent or the person who referred the client, each with their own percentage.",
      },
      {
        q: "Can a manager see the team's commission amounts?",
        a: "No. A manager runs the team and sees its work, but only the CEO sees the amounts on other people's deals. That rule is built into the roles.",
      },
      {
        q: "Can I raise an invoice from a deal?",
        a: "Yes, through the Invoices module. The buyer details and the commission amount come from the deal, so nothing is retyped.",
      },
    ],
  },

  "ai-coach": {
    name: "AI Coach",
    headline: "Agents rehearse the hard conversations on AI, not on your clients",
    lead: "13 scenarios from real agency life, 9 client personalities, conversation by voice, scoring and written feedback.",
    seoTitle: "Training real estate agents with an AI Coach | AgentSpace",
    seoDescription:
      "Cold call and listing appointment practice with an AI client. 13 scenarios, 9 personalities, voice conversation, scoring in four categories and concrete feedback.",
    problem:
      "A new agent learns on real leads. Every badly handled conversation is a burned contact nobody recovers, and the owner finds out after the fact.",
    capabilities: [
      {
        title: "Three categories of conversation",
        body: "Cold calling, listing appointments and rentals. Scenarios written from real agency situations, not generic sales theory.",
      },
      {
        title: "Nine client personalities",
        body: "From friendly to openly hostile to the one who just wants you off the phone. The agent practises with the type they struggle with.",
      },
      {
        title: "Conversation by voice",
        body: "The agent speaks instead of typing. Practice in the car between meetings works better than a course nobody travels to.",
      },
      {
        title: "Scoring and feedback",
        body: "A score in four categories plus concrete pointers: what to say next time and what to avoid.",
      },
    ],
    forWhom:
      "For new agents as onboarding, for experienced ones as a warm-up before a hard call.",
    faq: [
      {
        q: "Does the agent practise on real clients?",
        a: "No. AI Coach is a simulation: the agent talks to a client played by the model. No real client data is used.",
      },
      {
        q: "Does it work in Polish?",
        a: "Yes, the whole session and the scoring are in Polish, with the objections that actually come up in Polish agencies. It is not a translated American script.",
      },
      {
        q: "What does the agent get afterwards?",
        a: "A score across five areas (opening, qualification, objections, closing and overall), a summary and two to four concrete pointers for next time.",
      },
    ],
  },

  "panel-wlasciciela": {
    name: "Owner dashboard",
    headline: "For the first time, you see the agency in numbers",
    lead: "Ranking, the team's strong and weak areas, commissions per agent, a drill-down into any individual. The monthly report arrives on its own.",
    seoTitle: "Managing a team of real estate agents | AgentSpace",
    seoDescription:
      "The owner dashboard for a real estate agency: agent ranking, goal progress, the team's strong and weak areas, commissions and monthly reports.",
    problem:
      "The owner knows how many deals closed. They do not know how many calls were made, where the team loses leads, or which agent started slipping three weeks ago.",
    capabilities: [
      {
        title: "Ranking with goal progress",
        body: "Not just who sold the most, but who is working their funnel. Two completely different pieces of information.",
      },
      {
        title: "Strong and weak areas",
        body: "Where the team does well and where it systematically loses ground: prospecting, the meeting or the close.",
      },
      {
        title: "Drill-down to the agent",
        body: "Open one person and see their goals, deals and practice results. Material for a 1:1 conversation.",
      },
      {
        title: "Roles in the team",
        body: "CEO, manager and agent see different scopes. A manager runs their own people without seeing the whole agency's commissions.",
      },
    ],
    forWhom: "For the owner and team managers. Agents do not see each other's data.",
    faq: [
      {
        q: "Do agents have to fill in anything extra?",
        a: "No. The panel calculates everything from their daily work: deals, activities and targets. Reporting is a by-product, not a separate duty.",
      },
      {
        q: "Can I see which agent is struggling and with what?",
        a: "Yes. The panel shows strong and weak areas per person, including AI Coach sessions, so you can tell whether the problem is opening a call or closing it.",
      },
      {
        q: "Can I drill into one person?",
        a: "Yes, every agent has their own page with results, funnel, target calendar and training history.",
      },
    ],
  },

  nieruchomosci: {
    name: "Property database",
    headline: "One shared listing database for the whole agency",
    lead: "Listings visible to the team, with photos and status. The agent working a buyer sees what a colleague has on the selling side.",
    seoTitle: "A shared property database for your agency | AgentSpace",
    seoDescription:
      "A listing database for the whole agency: photos, statuses, agent assignment and team-wide visibility. No more listings in private folders.",
    problem:
      "Listings sit in agents' private folders. A buyer at one desk never meets a property from another, so the in-house deal never happens.",
    capabilities: [
      {
        title: "Visible to the team",
        body: "The whole database is available to the agency. Matching a buyer to a colleague's listing stops depending on who chats to whom over coffee.",
      },
      {
        title: "Photos and status",
        body: "The full material set sits with the listing and the current status is visible immediately. No more asking whether it is still available.",
      },
      {
        title: "Assigned to an agent",
        body: "It is clear who runs the listing and who owns the relationship with the owner.",
      },
    ],
    forWhom:
      "For the whole team: the bigger the agency, the more in-house deals this database generates.",
    faq: [
      {
        q: "Can I bring listings over from our current system?",
        a: "Yes, photos included. During the rollout we upload your export and fill in the fields the old system did not have.",
      },
      {
        q: "Are the fields tailored to the property type?",
        a: "Yes. A flat has different fields from a plot, a house or a commercial unit, and a rental listing differs from a sale. The field dictionary follows what the portals require.",
      },
      {
        q: "Can listings be exported to property portals?",
        a: "Not yet. It is first on the list, but it needs an agreement with each portal rather than just code. Until then it is worth keeping your current system alongside.",
      },
    ],
  },
  leady: {
    name: "Leads from ads",
    headline: "A Facebook lead reaches an agent, not a spreadsheet",
    lead: "Upload the file from Meta Ads or add a contact by hand. The system spots duplicates, assigns an owner and keeps track of the stage.",
    seoTitle: "Meta Ads lead management for real estate agencies | AgentSpace",
    seoDescription:
      "Import leads from Facebook and Instagram, catch duplicates by phone number, assign agents and track contact stages. No retyping into spreadsheets.",
    problem:
      "The agency pays for ads, leads land in a file, and the file ends up on WhatsApp. By the time anyone works out who called, half the contacts have gone cold and the other half were called by two agents.",
    capabilities: [
      { title: "The Meta Ads file, straight in", body: "CSV and Excel upload as they are. The system recognises the columns even when the form had custom questions." },
      { title: "No calling twice", body: "The same number uploaded again is caught by its last nine digits, whatever format it was saved in." },
      { title: "Agency pool and owner", body: "A lead with no owner waits in the pool until someone takes it. You can see who took how many and what came of it." },
      { title: "Stage and handover", body: "From new contact to booked meeting. When a lead matures, one click turns it into a CRM client with the full history." },
    ],
    forWhom: "For agencies that spend on advertising. It shows which campaign brings deals, not just clicks.",
    faq: [
      {
        q: "What file does Meta Ads produce?",
        a: "A CSV or Excel file whose columns depend on what the form asked. The system recognises them on its own, including custom questions you added.",
      },
      {
        q: "What happens if I upload the same file twice?",
        a: "Nothing bad. Duplicates are caught by the last nine digits of the phone number, whatever format it was saved in, so nobody calls the same person twice.",
      },
      {
        q: "Does a lead go straight into the client database?",
        a: "No. Leads sit separately until somebody speaks to them. When a contact matures, one click turns it into a CRM client with the full history.",
      },
    ],
  },
  dzialania: {
    name: "Day plan and activities",
    headline: "The agent knows what to do today before opening their phone",
    lead: "Tasks, calendar and reminders in one place, with three AI-picked priorities from your own data at the top.",
    seoTitle: "Day planning and tasks for real estate agents | AgentSpace",
    seoDescription:
      "Calendar, tasks and contact reminders. The AI Day Assistant suggests three priorities drawn from clients, pipeline and deadlines.",
    problem:
      "The agent starts the day scrolling their phone and decides by feel who to call. A client who waited a week waits another, because nobody remembered.",
    capabilities: [
      { title: "Three priorities for today", body: "The AI reads the pipeline, contact dates and targets, and says plainly what to do first, with a reason rather than just a list." },
      { title: "A calendar for the whole agency", body: "Meetings, viewings and calls in one view. A manager sees the team's load before promising a client a slot." },
      { title: "Clients to contact today", body: "Every client has a next-contact date. The system reminds you before the relationship goes cold." },
      { title: "Quick voice entry", body: "After a viewing you dictate two sentences and the system works out the client, the property and the note. No sitting down at a computer." },
    ],
    forWhom: "For agents in the field and for managers who want to see the team's work without asking for reports.",
    faq: [
      {
        q: "How does the AI know what is a priority?",
        a: "It reads the pipeline, next-contact dates, task deadlines and target progress. Each priority comes with a reason, so the agent can see why that one.",
      },
      {
        q: "Does the calendar sync with Google?",
        a: "Not yet, it is on the list. For now the calendar lives inside the system and covers the whole agency.",
      },
      {
        q: "Do reminders reach the phone?",
        a: "Yes, as push notifications once the app is added to the home screen. Nothing needs installing from an app store.",
      },
    ],
  },
  poszukiwania: {
    name: "Buyer requirements",
    headline: "Record a buyer once, let the matches find themselves",
    lead: "Save a buyer's criteria and the system keeps showing which listings in the agency fit, including the ones added tomorrow.",
    seoTitle: "Matching listings to buyers in a real estate agency | AgentSpace",
    seoDescription:
      "Buyer briefs with price, size and location criteria, matched automatically against the agency's listing database to create in-house deals.",
    problem:
      "An agent remembers their own buyers but not the listings on the next desk. The flat that fitted perfectly sells through a portal to a stranger.",
    capabilities: [
      { title: "Criteria instead of a note", body: "Price, size, rooms, floor and districts. Saved once, they keep working without being reminded." },
      { title: "Matches across the whole database", body: "The system compares the brief against every listing in the agency, including ones the agent has never seen." },
      { title: "Tolerances for your market", body: "You set the price and size margins in agency settings, because they mean different things in Warsaw and in a smaller town." },
      { title: "More in-house deals", body: "The bigger the agency, the more often one agent's buyer meets another agent's listing. The commission stays in the business." },
    ],
    forWhom: "For agencies with several agents, where listings and buyers have not been meeting in time.",
    faq: [
      {
        q: "How is this different from a note on the client record?",
        a: "A note only works if somebody reads it. A brief compares itself against every new listing in the agency and raises its hand when something fits.",
      },
      {
        q: "Do matches include other agents' listings?",
        a: "Yes, and that is the point. The bigger the agency, the more often one agent's buyer meets another agent's listing, and the commission stays in the business.",
      },
      {
        q: "Can I set how widely it searches?",
        a: "Yes. You set the price and size tolerances in agency settings, because they mean different things in a big city and a smaller one.",
      },
    ],
  },
  dokumenty: {
    name: "Contracts and handover reports",
    headline: "Documents ready in a minute, always with your details",
    lead: "Reservation agreement, handover report, annex and cooperation offer. Generated as real PDFs, not printed from a browser.",
    seoTitle: "Reservation agreements and handover reports for agencies | AgentSpace",
    seoDescription:
      "Generator for reservation agreements, handover reports, annexes and cooperation offers. Full PDFs carrying your company details.",
    problem:
      "The handover report is built in Word from a file two years old, still carrying the previous client's details. Someone misses one field and it goes for signature with the wrong name on it.",
    capabilities: [
      { title: "Four documents, one standard", body: "Reservation, handover, annex and cooperation offer, each with numbered clauses and room for remarks." },
      { title: "Company details fill themselves in", body: "Name, address, tax number and representative come from agency settings. You cannot send a document carrying someone else's details." },
      { title: "File first, printing second", body: "The document saves as a real PDF and you print from that. The layout does not shift from browser to browser." },
      { title: "A handover after the sale too", body: "A separate variant for handing over after completion: meter readings, keys, remarks and signatures on a single page." },
    ],
    forWhom: "For agents and office assistants who retype the same documents by hand today.",
    faq: [
      {
        q: "Do the documents comply with Polish law?",
        a: "The templates come from documents used daily in a working agency. Before rolling them out in your own office it is worth having your lawyer review them, as with any contract template.",
      },
      {
        q: "Can I add my own clause to a contract?",
        a: "Yes, the reservation agreement has room for extra clauses. You can write them yourself or ask the AI to phrase one and then edit it.",
      },
      {
        q: "Does the document save as a real PDF?",
        a: "Yes, it is not a browser printout. The file lands on disk first and you print from that, so the layout does not shift between browsers.",
      },
    ],
  },
  ofertowka: {
    name: "Listing presentation",
    headline: "A listing presentation the client actually opens",
    lead: "Built from the listing already in the system: photos, description, key figures and your logo.",
    seoTitle: "Property listing presentation in PDF for clients | AgentSpace",
    seoDescription:
      "Listing presentations built from your database: photos, key figures, description and the agent's contact details. A ready PDF to send.",
    problem:
      "The agent sends a portal link or five photos in a message. The listing looks like every other one and does not stick.",
    capabilities: [
      { title: "From the database, not from scratch", body: "Photos, size, price and description come from the listing. The agent retypes nothing." },
      { title: "Your brand, not ours", body: "The agency logo and the agent's details on every page. The client knows who they are dealing with." },
      { title: "Watermarked photos", body: "Photos travel further than anyone plans. A watermark keeps them pointing back to you." },
    ],
    forWhom: "For agents who send listings by email and want them to look serious.",
    faq: [
      {
        q: "Can I choose which photos go into the presentation?",
        a: "Yes, you pick the photos and their order. The rest of the data comes from the listing.",
      },
      {
        q: "Does the document carry our logo?",
        a: "Yes, the logo and agency details come from settings. If no logo has been uploaded yet, the agency initials appear in its place, never somebody else's brand.",
      },
      {
        q: "Are the photos protected?",
        a: "You can switch on a watermark that is applied when photos are uploaded. It also covers photos published to the agency website.",
      },
    ],
  },
  kalkulatory: {
    name: "Client calculators",
    headline: "Work out the instalment and the real purchase cost with the client",
    lead: "Mortgage instalment, full purchase costs and rental yield. Carrying your logo, ready to send as a PDF from the car.",
    seoTitle: "Property purchase cost and mortgage calculator | AgentSpace",
    seoDescription:
      "Client calculators: mortgage instalment, purchase costs with transfer tax and notary fees, rental yield. A ready PDF with the agency logo.",
    problem:
      "The client asks what the purchase will really cost. The agent says \"roughly\", promises to work it out in the evening, forgets, and the client takes the question elsewhere.",
    capabilities: [
      { title: "The full cost of buying", body: "Transfer tax, notary fees, court charges, mortgage registration and the agency commission. A total nobody has to chase." },
      { title: "A discount the client can see", body: "You show the standard commission and yours next to it, struck through. The negotiation becomes an argument rather than a concession." },
      { title: "Rental yield", body: "For buy-to-let clients: return, cash flow and a comparison against a deposit account." },
    ],
    forWhom: "For agents sitting at the table with a client, and for agencies working with mortgage advisers.",
    faq: [
      {
        q: "Does the calculator handle both new-build and resale?",
        a: "Yes. You choose the market and the transfer tax and other fees recalculate themselves. There is also a resale variant with no transfer tax.",
      },
      {
        q: "Does the client get it in writing?",
        a: "Yes, one click produces a PDF with the agency logo and the agent's details, ready to email from the car.",
      },
      {
        q: "Can I show the client a commission discount?",
        a: "Yes. You enter the standard rate and yours, and the document shows both, struck through, with the saving.",
      },
    ],
  },
  faktury: {
    name: "Invoices and tax",
    headline: "Invoice for your commission without leaving the system",
    lead: "Raise an invoice from a deal you already have in the database, and see what is left of it after tax.",
    seoTitle: "Invoicing for real estate agencies | AgentSpace",
    seoDescription:
      "Commission invoices raised straight from a deal, with numbering and seller details, plus a tax calculator for Polish forms of taxation.",
    problem:
      "Invoices live in one program and deals in another. At the end of the month somebody compares two lists looking for what is missing.",
    capabilities: [
      { title: "Several sellers at once", body: "The partnership and each partner's sole trader business, every one with its own tax number and bank account. You pick at the moment of issuing." },
      { title: "Numbering and history", body: "Numbers issued in order, invoices filtered by year, payment status visible on the list." },
      { title: "Tax calculator", body: "Progressive, flat and lump-sum, with social contributions and reliefs. It shows what is actually left of the commission." },
    ],
    forWhom: "For the owner and the bookkeeper. Access to this module is granted separately, without opening the client database.",
    faq: [
      {
        q: "Can I invoice from several entities?",
        a: "Yes. You add as many sellers as you need: the partnership and each partner's own business, every one with its own tax number and bank account.",
      },
      {
        q: "Is the numbering automatic?",
        a: "Yes, numbers are issued in order and the list filters by year. Payment status is visible on every invoice.",
      },
      {
        q: "Who has access to invoices?",
        a: "By default the CEO and bookkeeping. Access is granted separately from the rest of the system, so the bookkeeper does not need to see the client database.",
      },
    ],
  },
  raporty: {
    name: "Owner reports",
    headline: "Agency results without asking anyone for a summary",
    lead: "Revenue, funnel, deal sources and team results, all calculated from the agents' daily work rather than from separate reporting.",
    seoTitle: "Reports and results for a real estate agency | AgentSpace",
    seoDescription:
      "Owner report: revenue by month, sales funnel, deal sources, agent results and a forecast. Exportable to PDF.",
    problem:
      "The owner asks for a summary, the agents build one in a spreadsheet on the fly, and the numbers do not agree with each other. Decisions get made on impressions.",
    capabilities: [
      { title: "Numbers from the work itself", body: "Everything is calculated from deals, activities and targets the team enters anyway. Nobody fills in anything extra." },
      { title: "Funnel and forecast", body: "You see how many calls turn into meetings and how many meetings into agreements, and what to expect next month." },
      { title: "Where the deals come from", body: "Referrals, advertising, portals or your own database, split by commission rather than by number of contacts." },
      { title: "By email and as a PDF", body: "The monthly summary arrives automatically on the first of the month, and downloads as a document for a partners' meeting." },
    ],
    forWhom: "For the owner and the director. A manager sees their own team's work, without the amounts on other people's commissions.",
    faq: [
      {
        q: "Does the report arrive automatically?",
        a: "Yes, the monthly summary goes out by email on the first of the month. You can also generate it at any time and download it as a PDF.",
      },
      {
        q: "Can I see where the deals come from?",
        a: "Yes, split by source and by commission rather than by number of contacts. A referral that produced one big deal does not disappear behind an ad campaign that produced twenty cold leads.",
      },
      {
        q: "Can I show the report to business partners?",
        a: "Yes, that is what the PDF export is for: a typeset document with charts, ready to print for a meeting.",
      },
    ],
  },
  "role-i-uprawnienia": {
    name: "Roles and permissions",
    headline: "Everyone sees exactly as much as they should",
    lead: "Eight job titles with ready-made access sets, plus the option to grant or withdraw a single module for one person.",
    seoTitle: "Roles and permissions in a real estate agency system | AgentSpace",
    seoDescription:
      "CEO, director, manager, agent, office assistant, bookkeeping, listing coordinator and trainee. Access granted per person and per module.",
    problem:
      "Most systems offer three roles, so the bookkeeper gets the client database and the trainee sees colleagues' commissions. Or the opposite: someone cannot get into the place they work in every day.",
    capabilities: [
      { title: "Eight titles from a real agency", body: "From CEO to trainee, including the office assistant and bookkeeping. Each set of access matches what that person actually does." },
      { title: "An exception for one person", body: "Should the coordinator see invoices after all? You switch that one module on for them, without promoting them to director." },
      { title: "Data scope set separately", body: "Their own records, their team, or the whole agency, independently of which modules they can open." },
      { title: "Hidden contact details", body: "A client's number is visible to their own agent. It works on record pages and in pickers too, not only in lists." },
    ],
    forWhom: "For agencies with a real structure, and for those employing bookkeeping or an assistant part-time.",
    faq: [
      {
        q: "Do I have to use all eight job titles?",
        a: "No. A small agency is fine with a CEO and agents. The rest wait for the moment a bookkeeper or an assistant appears.",
      },
      {
        q: "Can I make an exception for one person?",
        a: "Yes, that is the heart of this module. You switch a single module on or off for one person without changing their job title. Exceptions are flagged, so six months later you can still tell what was changed by hand.",
      },
      {
        q: "Can the CEO's access be restricted?",
        a: "No, and that is deliberate. If it could be, an agency could end up with nobody able to get into settings and undo it.",
      },
    ],
  },
  "strona-www": {
    name: "Agency website",
    headline: "A website that updates itself from your database",
    lead: "Eight templates to choose from. Listings, team and guide articles come from the system, and enquiries come back into the CRM.",
    seoTitle: "Website for a real estate agency connected to the CRM | AgentSpace",
    seoDescription:
      "An agency website wired to your listings: eight templates, your own domain, forms that return to the CRM as a contact and a task for an agent.",
    problem:
      "The agency website was built three years ago and still shows a property sold last year. Updating it means emailing the company that made it.",
    capabilities: [
      { title: "Listings straight from the system", body: "You tick a listing in the database and it is on the site. No retyping and no uploading photos twice." },
      { title: "Enquiries return to the CRM", body: "The form creates a contact and a task for an agent, instead of an email lost in the office inbox." },
      { title: "Your own domain and SEO", body: "We connect your domain, sitemap and structured data for Google. Certificate and backups are on us." },
    ],
    forWhom: "For agencies without a website, and for those whose site lives separately from the listing database. A separate service, outside the system subscription.",
    faq: [
      {
        q: "Do I have to take the website with the system?",
        a: "No. It is a separate service outside the subscription. The system works fine without it, and if you already have a website nothing has to change.",
      },
      {
        q: "Does the site run on our own domain?",
        a: "Yes, we connect your domain. The certificate, backups and hosting are on us.",
      },
      {
        q: "What happens to an enquiry from the form?",
        a: "It creates a contact in the CRM and a task for an agent, and the office gets a notification. It does not land in an inbox where it gets lost.",
      },
    ],
  },
  "umowa-najmu-okazjonalnego": {
    name: "Lease and agency contracts",
    headline: "Polish occasional lease contracts without hunting for a template",
    lead: "The contract with all annexes, the tax office notice, the notice to vacate and a deposit receipt. Data comes from the client and listing records and the software checks statutory limits.",
    seoTitle: "Occasional lease agreement generator (Poland) | AgentSpace",
    seoDescription: "Generate a Polish occasional lease agreement (najem okazjonalny) with annexes, the 14-day tax office notice and a notice to vacate. Deposit capped at six months' rent.",
    problem: "Agents download outdated templates without annexes and with deposits above the legal cap. The owner finds out only when the fast eviction path fails because the lease was never reported.",
    capabilities: [
      { title: "The full occasional lease pack", body: "Contract with the notarial submission to enforcement, the replacement address and its owner's consent." },
      { title: "Checks the law", body: "Warns when the deposit exceeds six months' rent, the term exceeds 10 years, or a notice period is shorter than 7 days." },
      { title: "Letters after signing", body: "Tax office notice with the 14-day deadline, deposit receipt and notice to vacate, from the same data." },
      { title: "Brokerage contracts", body: "Sale, purchase and rental brokerage agreements with the consumer withdrawal notice for off-premises contracts." },
    ],
    forWhom: "For rental agents and agencies serving landlords, and anyone signing brokerage contracts outside the office.",
    faq: [
      { q: "Does the lease have to be signed at a notary?", a: "No. The tenant's submission to enforcement is made before a notary; the contract itself is not." },
      { q: "What deposit is allowed?", a: "Up to six times the monthly rent, returned within a month after the flat is vacated." },
    ],
  },
  "tablica-transakcji": {
    name: "Deal board",
    headline: "All clients and listings on one board",
    lead: "Columns are stages, cards are clients or listings. Drag a card and the stage changes instantly, together with automated tasks.",
    seoTitle: "Kanban pipeline for real estate agencies | AgentSpace",
    seoDescription: "Drag-and-drop kanban board for clients and listings, agent filter and price-drop markers.",
    problem: "A client list shows who is in the database but not where deals are stuck.",
    capabilities: [
      { title: "Drag and drop", body: "Mouse on desktop, a handle on the phone. The stage saves instantly." },
      { title: "Clients and listings", body: "Separate boards for client pipeline and listing stages." },
      { title: "Agent filter", body: "Managers see their team or one agent, owners the whole agency." },
      { title: "Signals on cards", body: "Price drops and next contact dates are visible without opening the card." },
    ],
    forWhom: "For agents running many deals at once and managers who want to see bottlenecks.",
    faq: [{ q: "Does it work on a phone?", a: "Yes, with a drag handle or a stage menu on each card." }],
  },
  "czat-zespolu": {
    name: "Team chat",
    headline: "Office conversations stay in the office",
    lead: "Channels, direct messages and groups. Attach a client or listing card to a message, and the conversation stays when an agent leaves.",
    seoTitle: "Team chat for real estate agencies | AgentSpace",
    seoDescription: "Team messaging inside the agency system: channels, direct messages, attachments and links to clients and listings.",
    problem: "Teams talk on private messengers, and client details leave with the agent.",
    capabilities: [
      { title: "Channels and DMs", body: "An office channel, groups and one-to-one chats. Mute what is not for you." },
      { title: "Client cards in messages", body: "Search a client or listing and paste it as a card." },
      { title: "Attachments and notifications", body: "Photos and files, unread counters and phone notifications." },
      { title: "Stays with the agency", body: "The history belongs to the agency and stays when someone leaves." },
    ],
    forWhom: "For agencies of three people or more.",
    faq: [{ q: "Is it real-time?", a: "Yes, messages appear instantly for everyone in the conversation." }],
  },
  "urlopy-i-zastepstwa": {
    name: "Leave and cover",
    headline: "An agent on holiday, clients still served",
    lead: "Absences with dates and a cover person. The cover sees the absent agent's clients and automated tasks go to them.",
    seoTitle: "Agent leave and cover management | AgentSpace",
    seoDescription: "Plan agent absences with a cover person, temporary access to clients and redirected tasks.",
    problem: "When an agent is away, nobody knows where things stand, and hidden contacts block colleagues from calling back.",
    capabilities: [
      { title: "Absence with cover", body: "Holiday, sick leave or training with dates and a named cover." },
      { title: "Temporary access", body: "The cover sees contacts only during the absence." },
      { title: "Tasks are not lost", body: "Automations route tasks to the cover." },
      { title: "Visible on the client card", body: "Anyone opening the card sees who to contact instead." },
    ],
    forWhom: "For agencies where a holiday means two weeks of paused deals.",
    faq: [{ q: "Is access permanent?", a: "No, only for the days of the absence." }],
  },
  automatyzacje: {
    name: "Automations",
    headline: "Things that happen on their own when something changes",
    lead: "A rule is a sentence: when this happens, do that. Stage, price, new lead or a client without contact create tasks, notifications, assignments or emails.",
    seoTitle: "CRM automations for real estate agencies | AgentSpace",
    seoDescription: "Automations: tasks after stage changes, lead assignment, reminders for clients without contact and template emails.",
    problem: "Service standards depend on agents' memory, which fails exactly when they are busiest.",
    capabilities: [
      { title: "11 triggers", body: "New client, lead or listing, stage and price changes, viewings, matches, inactivity, closed deals." },
      { title: "Several actions per rule", body: "Task, notification, assignment, status change or template email." },
      { title: "Ready recipes", body: "Start from proven rules and adjust the timing." },
      { title: "No duplicates", body: "Each event runs a rule once, and automations never trigger each other in loops." },
    ],
    forWhom: "For owners who want service standards to work without supervision.",
    faq: [{ q: "Can it email the client?", a: "Yes, from a template and the agency mailbox; replies go to the agent." }],
  },
  "kalkulator-remontu": {
    name: "Renovation calculator",
    headline: "What it costs to make a flat livable",
    lead: "An estimate from area and room count: scope, finish standard, VAT, contingency and duration. A PDF for the buyer in a minute.",
    seoTitle: "Apartment renovation cost calculator with PDF | AgentSpace",
    seoDescription: "Renovation estimate by scope and standard with VAT, cost per m², duration and a PDF for the client.",
    problem: "Buyers ask what renovation will cost and get a guess instead of a number.",
    capabilities: [
      { title: "From area to estimate", body: "Rooms, walls, floors and electrical points calculated from the floor area." },
      { title: "Scope and standard", body: "Refresh, medium or full renovation in three standards." },
      { title: "Correct VAT", body: "8% for residential renovation up to 150 m², 23% otherwise and for materials bought separately." },
      { title: "Your own rates", body: "Replace market averages with your contractors' prices." },
    ],
    forWhom: "For agents selling flats that need work and advisors helping buyers budget.",
    faq: [{ q: "Can I save the estimate?", a: "Yes, linked to the listing, with a PDF for the client." }],
  },
  rodo: {
    name: "GDPR consents",
    headline: "Client consents with date, source and history",
    lead: "For each client you know what they agreed to, when and how. Withdrawals stay in the history.",
    seoTitle: "GDPR consent register for real estate agencies | AgentSpace",
    seoDescription: "Consent register per client: information clause, processing, marketing by email, phone and SMS, sharing data, full history.",
    problem: "When a client disputes a consent, the agency cannot show when it was given.",
    capabilities: [
      { title: "Consent register", body: "Information clause, processing, marketing by email, phone and SMS, sharing with partner agencies." },
      { title: "Change history", body: "Withdrawing a consent adds an entry instead of deleting one." },
      { title: "Information clause", body: "A ready PDF with your agency details." },
      { title: "Data processing agreement", body: "Data stored in the EU under a processing agreement." },
    ],
    forWhom: "For owners who want consents in order before anyone asks.",
    faq: [{ q: "Where is the data stored?", a: "On servers in the European Union (Frankfurt)." }],
  },
  "koszty-i-wynik": {
    name: "Costs and results",
    headline: "What the agency really earned this month",
    lead: "Commissions, agent payouts and office costs in one view. Recurring bills add themselves and the accountant pack downloads in one click.",
    seoTitle: "Real estate agency costs and monthly results | AgentSpace",
    seoDescription: "Office costs, recurring bills, agent commission payouts and monthly result, with CSV exports for your accountant.",
    problem: "Owners know commission revenue but learn the actual result weeks later from the accountant.",
    capabilities: [
      { title: "Categorised costs", body: "Net or gross amount, VAT, vendor, invoice number and payment status." },
      { title: "Recurring bills", body: "Rent and subscriptions entered once, added every month." },
      { title: "Commission payouts", body: "Who gets what for which deal; overdue payouts stay on top." },
      { title: "Accountant pack", body: "Costs, payouts and the sales register as Excel-ready files." },
    ],
    forWhom: "For the owner and the accountant. The accountant role sees finances, not the client database.",
    faq: [{ q: "Does it replace accounting?", a: "No. It is a management view; your accountant keeps the books with tidy monthly data." }],
  },
  "wycena-rcn": {
    name: "Valuation from notarial deeds",
    headline: "Property price from transactions, not listings",
    lead: "A valuation built on the public Polish price register: prices from notarial deeds within up to 3.5 km, adjusted for floor, condition and building. A PDF report for the owner meeting in a minute.",
    seoTitle: "Apartment valuation from the Polish price register (RCN) | AgentSpace",
    seoDescription: "Apartment valuation from transaction prices in the RCN register: nearby comparables, price trend, adjustments for floor, condition and building, PDF report.",
    problem: "Owners price their flat by the neighbour's listing, and a listing is only what someone hopes to get. Without deed prices the agent loses the price conversation before it starts.",
    capabilities: [
      { title: "Prices from notarial deeds", body: "Residential transactions from the public price register. The search widens until there are enough comparables." },
      { title: "Adjustments you can see", body: "Floor and lift, condition, building type and age, balcony, terrace, garden, cellar and parking. Every adjustment is shown separately." },
      { title: "Trend and range", body: "Comparables indexed to today using quarterly medians. The result is a transaction price, a range and a suggested asking price." },
      { title: "PDF report for the owner", body: "Three pages: result and parameters, map and comparables table, local price chart with the method explained." },
    ],
    forWhom: "For agents before a listing meeting or a price reduction talk, and for owners who want the team to discuss price with data.",
    faq: [
      { q: "Where does the data come from?", a: "From the public Polish price register (RCN) published through the national geoportal. Coverage depends on the county." },
      { q: "Is this a formal appraisal?", a: "No. It is a comparative analysis for the agent and the owner. Formal appraisals are made by licensed valuers." },
    ],
  },
  "portal-klienta": {
    name: "Client portal",
    headline: "Clients see the progress instead of calling to ask what is new",
    lead: "Every seller and buyer gets a personal portal with your agency's logo: listing status, planned viewings, messages with their agent and phone notifications.",
    seoTitle: "Client portal for real estate agencies | AgentSpace",
    seoDescription: "A portal for real estate clients: listing status, viewings, chat with the agent and push notifications. Access by link or QR code, no account needed.",
    problem: "A seller who cannot see what the agent is doing calls, writes, and after three quiet weeks starts thinking about another agency.",
    capabilities: [
      { title: "No account or password", body: "The client gets a link or a QR code. The portal installs on the phone's home screen with your agency's logo." },
      { title: "Work the client can see", body: "Share viewings, calls and completed steps with one click. Plan a date, then mark it done." },
      { title: "Two-way messages", body: "The client writes from the portal, the agent replies from the inbox in the app. The conversation stays with the agency." },
      { title: "Phone notifications", body: "Clients are notified about new messages and key steps, agents about client messages, with suggestions for what to do next." },
    ],
    forWhom: "For agents with exclusive listings who want to show their work, and for owners who want fewer cancellations and more referrals.",
    faq: [
      { q: "Does the client need an account?", a: "No. Access is by personal link or QR code and can be switched off at any time." },
      { q: "What does the client see?", a: "Only what you share: their listing, activities marked as visible and the conversation with their agent. Internal notes stay in the CRM." },
    ],
  },
  kredyty: {
    name: "Mortgage advisor",
    headline: "Hand a buyer to the mortgage advisor in one click",
    lead: "Agents pass a client to the agency's mortgage advisor from the client card. The advisor runs the case in stages, and both agent and client see where financing stands.",
    seoTitle: "Mortgage advisor workflow for real estate agencies | AgentSpace",
    seoDescription: "Mortgage cases in the real estate CRM: referral from the client card, stages from analysis to signed loan, document checklist, fees and loan status in the client portal.",
    problem: "Deals most often fall through on financing, and the agent is the last to know.",
    capabilities: [
      { title: "Referral from the client card", body: "The agent picks an advisor, enters the amount and a short note. The advisor is notified right away." },
      { title: "Stage board", body: "New, analysis, documents, application, decision and signed. The agent sees every change." },
      { title: "Document checklist", body: "A ready mortgage checklist the advisor ticks off, so missing documents are obvious." },
      { title: "Status in the client portal", body: "The buyer sees the loan stage and missing documents in their portal." },
    ],
    forWhom: "For agencies working with an in-house or partner mortgage advisor. The advisor has a separate role and sees only their own cases.",
    faq: [
      { q: "Does the advisor see the whole client base?", a: "No. The mortgage advisor role sees only the cases they handle." },
      { q: "Is it a bank offer comparison tool?", a: "No. It is case management and cooperation with the agent." },
    ],
  },
  "swiadectwa-energetyczne": {
    name: "Energy certificates",
    headline: "Order an energy certificate from the listing card",
    lead: "The energy performance certificate order form fills in from the listing. Add building photos, pick a deadline, and a licensed assessor gets everything at once.",
    seoTitle: "Energy performance certificate orders for agents | AgentSpace",
    seoDescription: "Order an energy certificate for an apartment, house or commercial unit straight from the CRM: prefilled form, building photos, delivery within 24 hours.",
    problem: "You cannot sell or rent without a certificate. Agents retype listing data into the assessor's form, email photos and call to ask about the status.",
    capabilities: [
      { title: "Data from the listing", body: "Address, area and year of construction come from the property card. The agent only adds heating, ventilation, wall and insulation details." },
      { title: "Photos and floor plans", body: "Building photo, floor plan and the building certificate if available travel with the order." },
      { title: "Choose the deadline", body: "Standard within 2 working days or Express in 24 hours. Net and gross price shown before sending." },
      { title: "Order history", body: "A list of the agency's orders with a PDF card for each. Agents see their own, the owner sees all." },
    ],
    forWhom: "For agents with every new listing that has no certificate, and for owners who want one trusted provider.",
    faq: [
      { q: "Who issues the certificate?", a: "A person licensed and listed in the central register of building energy performance. The certificate is valid for 10 years." },
      { q: "How much does it cost?", a: "Apartments from 300 PLN net, houses and commercial units from 450 PLN net. Express options cost extra, shown in the form." },
    ],
  },
  "biblioteka-technik": {
    name: "Technique library",
    headline: "Conversation techniques and scripts you can practise right away",
    lead: "Thirty-six negotiation, persuasion and objection techniques with Polish real estate examples, ten step-by-step call scripts and the structure of a good conversation. Practise any technique with the AI client in one click.",
    seoTitle: "Sales techniques and call scripts for real estate agents | AgentSpace",
    seoDescription: "A library of conversation techniques for real estate agents: SPIN, anchoring, objection isolation, Voss, Cialdini, with call scripts and AI practice.",
    problem: "Sales training ends after two days and on Monday the agent calls the same way as before. Knowledge only becomes habit through practice on a real, difficult conversation.",
    capabilities: [
      { title: "Techniques with market examples", body: "Each technique has when to use it and when not, steps, dialogues about real properties, common mistakes and how to spot it being used on you." },
      { title: "Scripts stage by stage", body: "Cold call to an owner, lead callback, listing meeting, price reduction, commission negotiation. Lines, questions and objection answers." },
      { title: "Practice in one click", body: "Pick a conversation with the AI Coach next to the technique. Its steps stay visible during the whole session." },
      { title: "Structure of a good conversation", body: "Six stages from opening to close, each with its typical trap. A shared language for the whole team." },
    ],
    forWhom: "For agents who want better conversations and owners onboarding new people. Part of the AI Coach module.",
    faq: [
      { q: "Are the techniques ethical?", a: "Yes. For techniques that are easy to abuse we say plainly how to use them honestly, and we teach how to recognise manipulation." },
    ],
  },
};
