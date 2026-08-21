# Product Description

Reference sample for a fictional project — **Roster**, a community sports-club membership app on the laravel + nuxt pairing. Not a real project; illustrative only. A context document records product vision and intent, not behavior; it is never a contract.

## Vision

Roster gives a volunteer-run community sports club one place to manage its membership instead of a spreadsheet and a group chat. Prospective members sign themselves up, keep their own details current, and the club's organisers see an accurate, up-to-date roster without chasing anyone. It is worth building because the manual roster is the club's single most error-prone chore — stale contact details cost the club fixtures and subs.

## Users

- **Member** — signs up, verifies their email, and maintains their own name/email/password. Wants joining and staying current to take under a minute and never require emailing an organiser.
- **Admin** (club organiser) — manages the full member roster: adds members who joined in person, corrects details, promotes a co-organiser, removes people who left. Wants a trustworthy list and the ability to fix anything without a developer.

The two groups want different things: members want frictionless self-service; admins want control and correctness. The role split is the product's core tension.

## Scope And Non-Goals

In scope:

- Self-service membership: registration, email verification, login/logout, password reset, self-editable profile.
- Admin roster management: member CRUD with a two-role model (member/admin).
- A public landing page (with cookie consent) so the club can link prospective members straight to sign-up.

Non-goals:

- **Payments / subscription dues** — the club collects subs out of band today; billing is a later phase, not a launch capability.
- **Teams, fixtures, scheduling** — Roster manages who is a member, not what they play; a separate concern that would earn its own feature set.
- **Fine-grained permissions** — two roles only; committee sub-roles are deliberately excluded until a real need appears.

## Phases And Priorities

| Phase             | Focus                                                         | Priority      |
| ----------------- | ------------------------------------------------------------- | ------------- |
| Membership core   | Auth, self-service profile, admin roster CRUD                 | must (launch) |
| Public front door | Landing page + cookie consent so sign-up can be linked openly | must (launch) |
| Dues & payments   | Track and collect membership subs                             | later         |
| Teams & fixtures  | Squad lists and match scheduling                              | later         |

## Key Integrations

- **Email provider** — transactional mail for verification and password-reset links; without it, self-service onboarding cannot complete.
- **MySQL** — members, sessions, and the queued-mail table; the roster's system of record.

## Success Signals

- A prospective member can go from the public landing page to a verified account without an organiser touching anything.
- Admins stop maintaining the roster spreadsheet — the app's list is the one they trust.
- Contact-detail staleness drops: members update their own email instead of it rotting.
