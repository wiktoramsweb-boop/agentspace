import type { Integration, IntegrationStatus } from "./integrations";

export const STATUS_LABEL_EN: Record<IntegrationStatus, string> = {
  live: "Available",
  "in-progress": "In progress",
  planned: "Planned",
};

/** English copy for the integration pages, keyed by the same slug. */
export const INTEGRATIONS_EN: Record<string, Pick<Integration, "about" | "syncs" | "why">> = {
  asari: {
    about:
      "One of the most widely used listing CRMs in Polish real estate agencies. Agencies mainly use it to manage listings and syndicate them to portals.",
    syncs: [
      "Property database - listings and their statuses",
      "Client contacts together with the assigned agent",
      "History of listing status changes",
    ],
    why: "Agencies that keep their listings in Asari want to keep the portal export and at the same time run team management, goals and commissions in AgentSpace. The integration means nobody types the same data twice.",
  },
  galactica: {
    about:
      "A listing management and portal syndication system, present in Polish agencies for years. Strong at handling large listing databases.",
    syncs: [
      "Property listings and their statuses",
      "Contact details of owners and clients",
      "The agent assigned to each listing",
    ],
    why: "Galactica handles publishing listings well, but it does not answer the question of how your team is working. AgentSpace adds goals, the pipeline, commissions and practice, without replacing the listing system.",
  },
  imo: {
    about:
      "A system covering listings, clients and portal syndication, used by agencies of different sizes.",
    syncs: ["Property listings", "Buyer and seller database", "Deal statuses"],
    why: "Agencies on IMO usually come to AgentSpace for what IMO does not do: managing team goals, settling commissions and developing agents.",
  },
  estiman: {
    about: "A system supporting agency work around listings and client service.",
    syncs: ["Property listings", "Contacts and the history of working with a client"],
    why: "Connecting the two lets you keep your existing listing workflow and add a team management layer, without migrating the whole database on day one.",
  },
};
