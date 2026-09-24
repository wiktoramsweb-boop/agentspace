import type { ProductModule } from "./modules";

/**
 * English copy for the product module pages.
 *
 * Keyed by the same slug as the Polish version, so the URL and the routing
 * stay identical and only the text changes.
 */
export const MODULES_EN: Record<string, Omit<ProductModule, "slug">> = {
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
  },
};
