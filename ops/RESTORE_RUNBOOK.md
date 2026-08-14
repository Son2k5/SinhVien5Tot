# SV5T backup and restore runbook

- Run `backup.ps1` from a scheduler using a least-privilege MySQL login path.
- Store the backup directory on encrypted storage and replicate it off-site.
- Target RPO: 24 hours for full backups plus MySQL binary-log PITR.
- Target RTO: 4 hours.
- Restore quarterly into an isolated staging environment; verify SHA-256 manifests,
  apply migrations, run `/health/ready`, the unit tests, and a login/refresh/logout flow.
- Back up the shared ASP.NET Data Protection key ring with the database. Without it,
  encrypted PII and pending email outbox payloads cannot be recovered.
- Object storage must enable versioning and lifecycle rules before upload is released.
