# Secret rotation checklist

Treat the former local values as compromised. Complete these steps before production:

1. Rotate the MySQL user password and restrict the account to the SV5T schema.
2. Rotate the Redis password and require TLS in production.
3. Replace the JWT signing key; this immediately invalidates existing access tokens.
4. Replace the OTP pepper and identifier HMAC key; discard pending OTP challenges.
5. Rotate the Brevo SMTP credential and verify the sender/domain.
6. Revoke every active row in `refresh_tokens`.
7. Scan all Git refs, CI logs, artifacts and shared reports. Rewrite history if a secret was committed.
8. Store replacements in the platform secret manager. Local development may use the Git-ignored `api/.env`; never reuse a compromised value.

Do not paste replacement values into tickets, Markdown, `.env`, application settings or command history.
