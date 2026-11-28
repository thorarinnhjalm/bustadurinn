# One-off scripts

Past debugging, audit, repair and migration scripts. They are not part of the build, tests or CI and nothing in `package.json` references them.

Read a script before running it. Most of them connect to the **production** Firebase project with a service-account key and can read or write real data. Several contain hardcoded house ids, user ids or email addresses, and several target top-level collections that no longer hold data (the data model has since moved, e.g. bookings under `houses/{houseId}/bookings`). Treat them as examples, not tools.

Scripts that are still in use live one level up in `scripts/` (sitemap, prerender, verify-dist, HMS address processing, email-template seeding, RBAC migration, Payday test).
