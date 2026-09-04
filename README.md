# EZ Athlete

76 KG Athlete Protocol PWA.

## Cloud sync
1. Create a Supabase project.
2. Run `supabase-schema.sql` in the SQL Editor.
3. Put the Project URL and browser-safe Publishable key into `supabase-config.js`.
4. Commit/push the files to GitHub.
5. Cloudflare deploys the update automatically.

Never put a Supabase `service_role`/secret key in the browser.
