/**
 * regexPatterns.ts
 * --------------------------------------------------------------------------
 * 80+ regex signatures used by the JS Secret Scanner to detect hard-coded
 * credentials, tokens and other sensitive material inside JavaScript bundles.
 *
 * Each pattern declares a `type` (used for grouping in the UI), a `severity`
 * (critical | high | medium | low) and the `regex` used for matching. This
 * mirrors the "regex.json" concept from the original spec, expressed as a
 * typed TS module so it can be imported directly without extra IO.
 */

export type Severity = "critical" | "high" | "medium" | "low";

export interface SecretPattern {
  type: string;
  severity: Severity;
  regex: RegExp;
}

export const SECRET_PATTERNS: SecretPattern[] = [
  // ---------------------------------------------------------------- AWS ----
  { type: "AWS Access Key ID", severity: "critical", regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g },
  { type: "AWS Secret Access Key", severity: "critical", regex: /aws(.{0,20})?(secret|access)?(.{0,20})?['"][0-9a-zA-Z/+]{40}['"]/gi },
  { type: "AWS MWS Key", severity: "high", regex: /amzn\.mws\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi },
  { type: "AWS Session Token", severity: "critical", regex: /aws_session_token[\s:=]+['"][A-Za-z0-9/+=]{50,}['"]/gi },
  { type: "AWS ARN", severity: "low", regex: /arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:[a-zA-Z0-9-_/:]+/g },

  // ---------------------------------------------------------------- GCP ----
  { type: "GCP API Key", severity: "critical", regex: /AIza[0-9A-Za-z\-_]{35}/g },
  { type: "GCP Service Account", severity: "critical", regex: /"type":\s*"service_account"/g },
  { type: "GCP OAuth Client", severity: "high", regex: /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/g },
  { type: "Google Cloud Storage URL", severity: "low", regex: /https?:\/\/storage\.googleapis\.com\/[a-zA-Z0-9._\-/]+/g },

  // -------------------------------------------------------------- Azure ----
  { type: "Azure Storage Account Key", severity: "critical", regex: /DefaultEndpointsProtocol=https?;AccountName=[a-z0-9]+;AccountKey=[a-zA-Z0-9+/=]{20,}/gi },
  { type: "Azure Client Secret", severity: "high", regex: /azure(.{0,20})?client(.{0,20})?secret['"]?\s*[:=]\s*['"][0-9a-zA-Z.\-_~]{30,}['"]/gi },
  { type: "Azure SAS Token", severity: "high", regex: /sv=\d{4}-\d{2}-\d{2}&s[a-z]=[a-zA-Z0-9%]+&sig=[a-zA-Z0-9%]+/g },

  // --------------------------------------------------------------- JWT -----
  { type: "JSON Web Token (JWT)", severity: "high", regex: /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+\b/g },

  // ------------------------------------------------------------- Stripe ----
  { type: "Stripe Live Secret Key", severity: "critical", regex: /sk_live_[0-9a-zA-Z]{24,}/g },
  { type: "Stripe Live Publishable Key", severity: "medium", regex: /pk_live_[0-9a-zA-Z]{24,}/g },
  { type: "Stripe Test Secret Key", severity: "medium", regex: /sk_test_[0-9a-zA-Z]{24,}/g },
  { type: "Stripe Restricted Key", severity: "high", regex: /rk_live_[0-9a-zA-Z]{24,}/g },

  // ------------------------------------------------------------- GitHub ----
  { type: "GitHub Personal Access Token", severity: "critical", regex: /ghp_[0-9a-zA-Z]{36}/g },
  { type: "GitHub OAuth Token", severity: "critical", regex: /gho_[0-9a-zA-Z]{36}/g },
  { type: "GitHub App Token", severity: "critical", regex: /(ghu|ghs)_[0-9a-zA-Z]{36}/g },
  { type: "GitHub Refresh Token", severity: "high", regex: /ghr_[0-9a-zA-Z]{36}/g },
  { type: "GitHub Fine-grained PAT", severity: "critical", regex: /github_pat_[0-9a-zA-Z_]{22,}/g },

  // ------------------------------------------------------------ Firebase ---
  { type: "Firebase API Key", severity: "high", regex: /AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}/g },
  { type: "Firebase Database URL", severity: "medium", regex: /https?:\/\/[a-z0-9-]+\.firebaseio\.com/gi },
  { type: "Firebase Cloud Messaging Key", severity: "high", regex: /AAAA[0-9A-Za-z_-]{10,}/g },

  // ------------------------------------------------------------- Slack -----
  { type: "Slack Token", severity: "critical", regex: /xox[baprs]-[0-9a-zA-Z-]{10,48}/g },
  { type: "Slack Webhook", severity: "high", regex: /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]+\/B[0-9A-Z]+\/[0-9a-zA-Z]+/g },

  // ------------------------------------------------------------ Twilio -----
  { type: "Twilio Account SID", severity: "medium", regex: /AC[a-z0-9]{32}/g },
  { type: "Twilio Auth Token", severity: "critical", regex: /twilio(.{0,20})?['"][0-9a-f]{32}['"]/gi },
  { type: "Twilio API Key", severity: "high", regex: /SK[a-z0-9]{32}/g },

  // ----------------------------------------------------------- SendGrid ----
  { type: "SendGrid API Key", severity: "critical", regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g },

  // ----------------------------------------------------------- Mailgun -----
  { type: "Mailgun API Key", severity: "high", regex: /key-[0-9a-zA-Z]{32}/g },

  // ---------------------------------------------------------- Mailchimp ----
  { type: "Mailchimp API Key", severity: "high", regex: /[0-9a-f]{32}-us[0-9]{1,2}/g },

  // ------------------------------------------------------------ Heroku -----
  { type: "Heroku API Key", severity: "high", regex: /heroku(.{0,20})?['"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"]/gi },

  // -------------------------------------------------------------- NPM ------
  { type: "NPM Access Token", severity: "critical", regex: /npm_[0-9a-zA-Z]{36}/g },

  // -------------------------------------------------------------- PyPI -----
  { type: "PyPI Upload Token", severity: "critical", regex: /pypi-AgEIcHlwaS5vcmc[0-9a-zA-Z_-]{50,}/g },

  // ------------------------------------------------------------- Square ----
  { type: "Square Access Token", severity: "critical", regex: /sq0atp-[0-9A-Za-z\-_]{22}/g },
  { type: "Square OAuth Secret", severity: "critical", regex: /sq0csp-[0-9A-Za-z\-_]{43}/g },

  // ------------------------------------------------------------- PayPal ----
  { type: "PayPal Braintree Token", severity: "critical", regex: /access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}/g },

  // ------------------------------------------------------------ Facebook ---
  { type: "Facebook Access Token", severity: "high", regex: /EAACEdEose0cBA[0-9A-Za-z]+/g },
  { type: "Facebook OAuth Secret", severity: "high", regex: /facebook(.{0,20})?['"][0-9a-f]{32}['"]/gi },

  // ------------------------------------------------------------- Twitter ---
  { type: "Twitter Bearer Token", severity: "high", regex: /AAAAAAAAAAAAAAAAAAAAA[0-9A-Za-z%]{35,}/g },
  { type: "Twitter Access Secret", severity: "high", regex: /twitter(.{0,20})?['"][0-9a-zA-Z]{35,44}['"]/gi },

  // ------------------------------------------------------------- Shopify ---
  { type: "Shopify Access Token", severity: "critical", regex: /shpat_[0-9a-fA-F]{32}/g },
  { type: "Shopify Custom App Token", severity: "critical", regex: /shpca_[0-9a-fA-F]{32}/g },
  { type: "Shopify Private App Password", severity: "high", regex: /shppa_[0-9a-fA-F]{32}/g },
  { type: "Shopify Shared Secret", severity: "high", regex: /shpss_[0-9a-fA-F]{32}/g },

  // ------------------------------------------------------------- Discord ---
  { type: "Discord Bot Token", severity: "critical", regex: /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g },
  { type: "Discord Webhook", severity: "medium", regex: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+/g },

  // ------------------------------------------------------------- Dropbox ---
  { type: "Dropbox API Token", severity: "high", regex: /sl\.[A-Za-z0-9_-]{130,140}/g },

  // --------------------------------------------------------------- Okta ----
  { type: "Okta API Token", severity: "critical", regex: /00[0-9a-zA-Z_-]{40}/g },

  // ------------------------------------------------------------ Algolia ----
  { type: "Algolia API Key", severity: "high", regex: /algolia(.{0,20})?['"][0-9a-f]{32}['"]/gi },

  // ----------------------------------------------------------- Cloudinary --
  { type: "Cloudinary URL", severity: "high", regex: /cloudinary:\/\/[0-9]+:[0-9A-Za-z_-]+@[a-z0-9]+/gi },

  // ------------------------------------------------------------- Mapbox ----
  { type: "Mapbox Token", severity: "medium", regex: /pk\.eyJ1[0-9A-Za-z.]{60,}/g },

  // ------------------------------------------------------------- Sentry ----
  { type: "Sentry DSN", severity: "medium", regex: /https?:\/\/[0-9a-f]{32}@[a-z0-9.]+\/[0-9]+/g },

  // ------------------------------------------------------------ Datadog ----
  { type: "Datadog API Key", severity: "high", regex: /datadog(.{0,20})?['"][0-9a-f]{32}['"]/gi },

  // ----------------------------------------------------------- New Relic ---
  { type: "New Relic License Key", severity: "high", regex: /NRAK-[0-9A-Z]{27}/g },

  // -------------------------------------------------------------- Bitly ----
  { type: "Bitly Access Token", severity: "medium", regex: /bitly(.{0,20})?['"][0-9a-zA-Z]{40}['"]/gi },

  // -------------------------------------------------------------- Asana ----
  { type: "Asana Access Token", severity: "high", regex: /\b0\/[0-9a-f]{32}\b/g },

  // -------------------------------------------------------------- Notion ---
  { type: "Notion API Token", severity: "critical", regex: /secret_[0-9A-Za-z]{43}/g },

  // ------------------------------------------------------------- Airtable --
  { type: "Airtable API Key", severity: "high", regex: /key[0-9a-zA-Z]{14}/g },

  // ------------------------------------------------------------- Zendesk ---
  { type: "Zendesk API Token", severity: "high", regex: /zendesk(.{0,20})?['"][0-9a-zA-Z]{40}['"]/gi },

  // --------------------------------------------------------------- Auth0 ---
  { type: "Auth0 Client Secret", severity: "critical", regex: /auth0(.{0,20})?client(.{0,20})?secret['"]?\s*[:=]\s*['"][0-9a-zA-Z_-]{64}['"]/gi },
  { type: "Auth0 Management API Token", severity: "high", regex: /auth0(.{0,20})?api(.{0,20})?token['"]?\s*[:=]\s*['"]eyJ[a-zA-Z0-9._-]+['"]/gi },

  // ------------------------------------------------------------ Generic ----
  { type: "Generic API Key", severity: "medium", regex: /api[_-]?key['"]?\s*[:=]\s*['"][0-9a-zA-Z\-_]{16,64}['"]/gi },
  { type: "Generic Secret", severity: "high", regex: /secret['"]?\s*[:=]\s*['"][0-9a-zA-Z\-_/+]{16,64}['"]/gi },
  { type: "Generic Token", severity: "medium", regex: /token['"]?\s*[:=]\s*['"][0-9a-zA-Z\-_.]{16,64}['"]/gi },
  { type: "Generic Access Key", severity: "high", regex: /access[_-]?key['"]?\s*[:=]\s*['"][0-9a-zA-Z\-_/+]{16,64}['"]/gi },
  { type: "Generic Client Secret", severity: "high", regex: /client[_-]?secret['"]?\s*[:=]\s*['"][0-9a-zA-Z\-_]{16,64}['"]/gi },
  { type: "Bearer Token", severity: "medium", regex: /bearer\s+[a-zA-Z0-9_\-.=]{20,}/gi },
  { type: "Basic Auth Credentials", severity: "high", regex: /[a-zA-Z]{3,10}:\/\/[^/\s:@]{3,30}:[^/\s:@]{3,30}@[^/\s]+/g },
  { type: "Hardcoded Password", severity: "high", regex: /password['"]?\s*[:=]\s*['"][^'"\s]{6,64}['"]/gi },
  { type: "Hardcoded Username/Password Pair", severity: "medium", regex: /(user(name)?|login)['"]?\s*[:=]\s*['"][^'"\s]+['"][,;\s]+password['"]?\s*[:=]\s*['"][^'"\s]+['"]/gi },

  // -------------------------------------------------------- Private Keys ---
  { type: "RSA Private Key", severity: "critical", regex: /-----BEGIN RSA PRIVATE KEY-----/g },
  { type: "DSA Private Key", severity: "critical", regex: /-----BEGIN DSA PRIVATE KEY-----/g },
  { type: "EC Private Key", severity: "critical", regex: /-----BEGIN EC PRIVATE KEY-----/g },
  { type: "PGP Private Key Block", severity: "critical", regex: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g },
  { type: "Generic Private Key", severity: "critical", regex: /-----BEGIN PRIVATE KEY-----/g },
  { type: "SSH (OPENSSH) Private Key", severity: "critical", regex: /-----BEGIN OPENSSH PRIVATE KEY-----/g },

  // ----------------------------------------------------- DB Connection ----
  { type: "MongoDB Connection String", severity: "critical", regex: /mongodb(\+srv)?:\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/gi },
  { type: "PostgreSQL Connection String", severity: "critical", regex: /postgres(ql)?:\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/gi },
  { type: "MySQL Connection String", severity: "critical", regex: /mysql:\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/gi },
  { type: "Redis Connection String", severity: "high", regex: /redis:\/\/[^\s'"]*:[^\s'"]*@[^\s'"]+/gi },
  { type: "JDBC Connection String", severity: "high", regex: /jdbc:[a-z]+:\/\/[^\s'"]+/gi },
  { type: "AMQP Connection String", severity: "high", regex: /amqps?:\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/gi },

  // -------------------------------------------------------- Cloud Misc ----
  { type: "Generic Cloud Storage Bucket URL", severity: "low", regex: /s3:\/\/[a-z0-9.\-]+/g },
  { type: "DigitalOcean Access Token", severity: "critical", regex: /dop_v1_[a-f0-9]{64}/g },
  { type: "DigitalOcean Personal Token", severity: "critical", regex: /doo_v1_[a-f0-9]{64}/g },
  { type: "Linode API Token", severity: "high", regex: /linode(.{0,20})?['"][0-9a-f]{64}['"]/gi },
  { type: "Vercel Token", severity: "high", regex: /vercel(.{0,20})?['"][0-9a-zA-Z]{24}['"]/gi },
  { type: "Netlify Token", severity: "high", regex: /netlify(.{0,20})?['"][0-9a-zA-Z_-]{40,45}['"]/gi },
  { type: "Terraform Cloud Token", severity: "high", regex: /[a-zA-Z0-9]{14}\.atlasv1\.[a-zA-Z0-9=_-]{60,70}/g },

  // ------------------------------------------------------- Communication --
  { type: "Telegram Bot Token", severity: "high", regex: /\d{8,10}:AA[0-9A-Za-z_-]{33}/g },
  { type: "WeChat App Secret", severity: "medium", regex: /wechat(.{0,20})?['"][0-9a-z]{32}['"]/gi },

  // ----------------------------------------------------------- Payments ---
  { type: "Braintree Access Token", severity: "critical", regex: /access_token\$(sandbox|production)\$[0-9a-z]{16}\$[0-9a-f]{32}/g },
  { type: "Razorpay API Key", severity: "high", regex: /rzp_(live|test)_[0-9A-Za-z]{14}/g },

  // ---------------------------------------------------------- Analytics ---
  { type: "Google Analytics Measurement ID", severity: "low", regex: /G-[A-Z0-9]{10}/g },
  { type: "Segment Write Key", severity: "medium", regex: /segment(.{0,20})?['"][0-9a-zA-Z]{32}['"]/gi },
  { type: "Mixpanel Token", severity: "medium", regex: /mixpanel(.{0,20})?['"][0-9a-f]{32}['"]/gi },

  // --------------------------------------------------------- Misc / Low ---
  { type: "IPv4 Address Hardcoded", severity: "low", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { type: "Internal Hostname Reference", severity: "low", regex: /\b[a-z0-9-]+\.(internal|corp|local)\b/gi },
  { type: "TODO/FIXME Security Note", severity: "low", regex: /\/\/\s*(TODO|FIXME)[^\n]*(password|secret|key|token)[^\n]*/gi },
];

export const PATTERN_COUNT = SECRET_PATTERNS.length;
