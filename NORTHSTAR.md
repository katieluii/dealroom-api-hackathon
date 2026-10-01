# Mi-Chi

Build a tenant-separated strategic-investor route tool for early-stage deeptech VCs. HubSpot supplies interaction metadata, Dealroom supplies corporate investors and investment fit evidence. Partners control sharing; strongest visible relationship determines each portfolio company's route ranking.

Current step: Prisma schema, scoped data layer, mock fixtures and scoring. Checkpoints1–4 must work before live integrations. Use the user's cool-grey/Instrument Sans interface. No round builder, lead/follower roles or LLM chat. Never store message content or leak a private colleague's contacts, counts or identity. All database access goes through lib/scope.ts.
