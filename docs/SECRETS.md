# Secrets management

Where every secret lives, who can read it, and what to do when one leaks.

## Principles

1. **Secrets never enter git.** Not in code, not in config, not in a commit
   message, not in a fixture. `.env` and `.env.bak.*` are gitignored — keep it that
   way.
2. **Each environment has its own copy.** Local dev, CI, staging and production hold
   different values. A leak in one must not compromise another.
3. **Least privilege.** The web bundle never receives a server secret. The mobile
   bundle never receives a server secret.
4. **Rotation is routine, not an emergency.** If you cannot rotate a key in ten
   minutes, that is the problem to fix first.

---

## Public vs secret — the distinction that matters most

Anything prefixed `NEXT_PUBLIC_` (Next.js) or placed in Expo's `extra` block is
**compiled into the client bundle**. Any user can read it with browser devtools or
by unzipping the app. These are *configuration*, not secrets.

| Variable | Public? | Why |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Just an endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public **by design** | Row-level security is what protects the data, not the key's secrecy |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public **by design** | Stripe publishable keys are meant to ship to browsers |
| `NEXT_PUBLIC_API_URL` | Public | Just an endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | **SECRET** | Bypasses every RLS policy — full read/write on all data |
| `DATABASE_URL`, `DIRECT_URL` | **SECRET** | Contains the database password |
| `STRIPE_SECRET_KEY` | **SECRET** | Can charge and refund |
| `STRIPE_WEBHOOK_SECRET` | **SECRET** | Forging it lets an attacker mark orders paid |
| `SENDGRID_API_KEY`, `TWILIO_AUTH_TOKEN` | **SECRET** | Send mail and SMS as you |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | **SECRET** | Billed to you |
| `GOOGLE_CLIENT_SECRET` | **SECRET** | OAuth impersonation |
| `SEED_SUPERADMIN_PASSWORD` | **SECRET** | Admin login |

> **Never prefix a secret with `NEXT_PUBLIC_` to "make it work".** That publishes it
> to every visitor. If a server value seems needed in the browser, the call belongs
> on the server instead.

The most dangerous mistake in this repo would be exposing
`SUPABASE_SERVICE_ROLE_KEY` to a client bundle. It ignores all row-level security,
so it is equivalent to handing over the database.

---

## Where secrets live, by environment

| Environment | Mechanism | Who can read it |
|---|---|---|
| Local dev | Root `.env`, gitignored | The developer on their machine |
| CI (GitHub Actions) | Repository secrets | Workflow runs; masked in logs |
| Web deploy (Vercel / Netlify) | Project environment variables | Project members |
| API deploy (Railway / Render / Fly) | Service environment variables | Project members |
| Mobile builds (EAS) | EAS secrets | Build jobs |
| Team sharing | A password manager — never Slack or email | The team |

---

## Local development

```bash
npm run env:setup     # copies .env.example → .env
```

Then fill in the values. `.env.example` is the canonical list of variable names —
**when you add a variable, add it there too, with an empty value and a comment.**
That file is how the next person knows the variable exists.

Never paste a real secret into `.env.example`.

---

## CI — GitHub Actions

The current workflow (`.github/workflows/ci.yml`) **needs no real secrets**. It
lints, typechecks, tests and builds using placeholder values for the web build,
because Next.js requires those variables to be defined at build time but does not
need them to be valid.

You will need real secrets in CI when you add deployment or run integration tests
against a live database.

### Setting them

Via the GitHub UI: **Settings → Secrets and variables → Actions → New repository
secret**.

Via the CLI (install with `brew install gh`, then `gh auth login`):

```bash
# Prompts for the value — it is not stored in your shell history
gh secret set SUPABASE_SERVICE_ROLE_KEY
gh secret set DATABASE_URL
gh secret set STRIPE_SECRET_KEY
gh secret set STRIPE_WEBHOOK_SECRET

gh secret list
```

Reading a secret straight from `.env` is convenient but puts the value into your
shell history and process list. Prefer the interactive prompt above.

### Using them in a workflow

```yaml
- run: npm run build --workspace=@marketnest/web
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

GitHub masks secret values in logs, but masking is best-effort — it fails on values
that get transformed, base64-encoded or split across lines. Never `echo` a secret.

### Environments for staging vs production

Use **Settings → Environments** to hold separate values per environment and to
require approval before a production deploy. A workflow job selects one with
`environment: production`, and `${{ secrets.X }}` then resolves to that
environment's value.

---

## Deployment

### API (Railway, Render, Fly, etc.)

Set every server variable in the platform's environment settings — never bake them
into an image. At minimum:

```
DATABASE_URL           DIRECT_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL
REDIS_URL              # rediss:// — managed, TLS
STRIPE_SECRET_KEY      STRIPE_WEBHOOK_SECRET
CORS_ORIGIN            # your web origin, comma separated
NODE_ENV=production
```

**`REDIS_URL` must be a managed `rediss://` instance in production.** Dev uses local
Redis; a production host has none. The Redis service attaches TLS only for the
`rediss://` scheme, so no code change is needed.

**`CORS_ORIGIN` must be set explicitly.** If it is missing, the API falls back to
localhost origins and your deployed frontend cannot reach it.

### Web (Vercel, Netlify)

Set the `NEXT_PUBLIC_*` variables plus `NEXT_PUBLIC_API_URL`. `NEXT_PUBLIC_*`
values are **baked in at build time**, so changing one requires a rebuild, not just
a restart.

Do not put server secrets in the web project. It does not call the database
directly — it goes through the API.

### Mobile (EAS)

```bash
cd apps/mobile
eas secret:create --name EXPO_PUBLIC_API_URL --value https://api.example.com
eas secret:list
```

Same rule: anything reaching the app bundle is public. Ship only the API base URL
and other non-sensitive configuration. Mobile authenticates with a user token
obtained at sign-in and stored in the device keychain (`expo-secure-store`) — it
never carries a service key.

---

## Sharing secrets with the team

Use a password manager with a shared vault — 1Password, Bitwarden, Doppler,
Infisical. For a larger setup, a secrets manager (Doppler, AWS Secrets Manager,
Vault) can inject variables at runtime so no `.env` exists on a server at all.

**Never send a secret through Slack, email, a ticket, or a screen share.** Those all
retain history that is far harder to purge than a git commit.

---

## Rotating a secret

Rotate on a schedule, when someone leaves, and immediately after any exposure.

1. Generate the new value in the provider's dashboard.
2. Update every environment that uses it — local `.env`, CI, staging, production.
3. Deploy or restart so the new value is picked up.
4. **Revoke the old value.** Rotation is not complete until the old key is dead.

| Secret | Where to rotate |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY`, anon key | Supabase → Settings → API |
| `DATABASE_URL` / `DIRECT_URL` password | Supabase → Settings → Database → reset password |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → roll |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → the endpoint's signing secret |
| `SENDGRID_API_KEY` | SendGrid → Settings → API Keys |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account → Auth tokens |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials |

---

## If a secret leaks

Treat any secret that reaches git, a log, a screenshot or a chat as compromised —
even in a private repo, even if you delete it immediately. Clones, forks, CI caches
and mirrors keep copies.

1. **Rotate first.** Before cleaning history, before anything else. The old value is
   burned and rotation is what actually stops the bleeding.
2. **Assess exposure.** Check the provider's audit log for use you do not recognise.
   For `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL`, assume the whole dataset was
   readable.
3. **Then clean history** if you want to — `git filter-repo` or BFG, then a force
   push and a heads-up to everyone with a clone. This is cosmetic; step 1 is the fix.
4. **Fix the path that leaked it** so it cannot recur.

### Preventing it

Consider a pre-commit hook (`gitleaks`, `git-secrets`) that blocks commits
containing key-shaped strings. Also enable **GitHub secret scanning** — Settings →
Code security — which alerts on known credential formats pushed to the repo, and can
notify providers to auto-revoke.

---

## Auditing this repo

```bash
# Is anything env-shaped tracked? (only .env.example should appear)
git ls-files | grep -E "\.env"

# Was a .env ever committed, anywhere in history?
git log --all --pretty=format: --name-only --diff-filter=A | sort -u | grep -E "\.env" | grep -v example

# Key-shaped material in tracked files
git grep -nE "(sk|rk)_(live|test)_[A-Za-z0-9]{16,}|eyJ[A-Za-z0-9_-]{30,}" HEAD

# Database URLs with an embedded password
git grep -nE "postgres(ql)?://[^:]+:[^@]{6,}@" HEAD
```

As of the last audit all four are clean: only `.env.example` files are tracked, no
`.env` has ever been committed, and the sole `postgres://` match is a documentation
placeholder in `SETUP_SUPABASE.md`.
