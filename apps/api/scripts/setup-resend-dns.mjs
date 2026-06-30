import fs from "node:fs";
import path from "node:path";
import os from "node:os";

function loadToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;

  const tomlPath = path.join(os.homedir(), "AppData/Roaming/xdg.config/.wrangler/config/default.toml");
  if (!fs.existsSync(tomlPath)) return null;
  const toml = fs.readFileSync(tomlPath, "utf8");
  return toml.match(/oauth_token = "([^"]+)"/)?.[1] ?? null;
}

const token = loadToken();
if (!token) {
  console.error("No Cloudflare token. Run: wrangler login  OR  set CLOUDFLARE_API_TOKEN");
  process.exit(1);
}

const devVars = Object.fromEntries(
  fs
    .readFileSync(path.join(process.cwd(), ".dev.vars"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);

const resendKey = devVars.RESEND_API_KEY;
if (!resendKey) {
  console.error("No RESEND_API_KEY in .dev.vars");
  process.exit(1);
}

const DOMAIN_ID = process.env.RESEND_DOMAIN_ID ?? null;

async function getResendDomainId(resendKey) {
  if (DOMAIN_ID) return DOMAIN_ID;
  const list = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${resendKey}` },
  }).then((r) => r.json());
  let domain = (list.data ?? []).find((d) => d.name === ZONE_NAME);
  if (!domain) {
    const created = await fetch("https://api.resend.com/domains", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: ZONE_NAME, region: "ap-northeast-1" }),
    }).then((r) => r.json());
    domain = created;
  }
  if (!domain?.id) throw new Error(`Could not resolve Resend domain for ${ZONE_NAME}`);
  return domain.id;
}
const ZONE_NAME = "jal.app";

function cf(pathname, init = {}) {
  return fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  }).then((r) => r.json());
}

async function upsertRecord(zoneId, existing, record) {
  const { type, name, value, priority } = record;
  const fullName = name === "@" ? ZONE_NAME : `${name}.${ZONE_NAME}`;
  const normalized = (v) => v.replace(/^"|"$/g, "");
  const match = existing.find(
    (r) =>
      r.type === type &&
      r.name === fullName &&
      (type !== "TXT" || normalized(r.content) === normalized(value)),
  );

  if (match) {
    return { action: "exists", type, name: fullName, id: match.id };
  }

  const body = { type, name, content: value, ttl: 1, proxied: false };
  if (type === "MX") body.priority = priority ?? 10;

  const res = await cf(`/zones/${zoneId}/dns_records`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    action: res.success ? "created" : "failed",
    type,
    name: fullName,
    errors: res.errors,
  };
}

const zones = await cf(`/zones?name=${ZONE_NAME}`);
const zone = (zones.result ?? [])[0];

if (!zone) {
  console.log(
    JSON.stringify(
      {
        error: "zone_not_found",
        message: `Add ${ZONE_NAME} to Cloudflare first: https://dash.cloudflare.com/?to=/:account/add-site`,
        availableZones: (await cf("/zones?per_page=50")).result?.map((z) => z.name) ?? [],
        nextSteps: [
          "1. Cloudflare Dashboard → Add site → jal.app → Free plan",
          "2. Copy the 2 Cloudflare nameservers",
          "3. At your domain registrar → point jal.app NS to Cloudflare",
          "4. Re-run: npm run setup:dns --workspace @vendo/api",
          "5. Deploy: npm run deploy:all --workspace @vendo/api",
        ],
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const zoneId = zone.id;
const resendDomainId = await getResendDomainId(resendKey);
const domain = await fetch(`https://api.resend.com/domains/${resendDomainId}`, {
  headers: { Authorization: `Bearer ${resendKey}` },
}).then((r) => r.json());

const existing = await cf(`/zones/${zoneId}/dns_records?per_page=100`);
const results = [];

for (const record of domain.records ?? []) {
  if (record.type === "TXT" && record.record === "DKIM") {
    results.push(await upsertRecord(zoneId, existing.result ?? [], record));
  }
  if (record.type === "MX") {
    results.push(await upsertRecord(zoneId, existing.result ?? [], record));
  }
  if (record.type === "TXT" && record.record === "SPF") {
    results.push(await upsertRecord(zoneId, existing.result ?? [], record));
  }
}

await fetch(`https://api.resend.com/domains/${resendDomainId}/verify`, {
  method: "POST",
  headers: { Authorization: `Bearer ${resendKey}` },
});

const status = await fetch(`https://api.resend.com/domains/${resendDomainId}`, {
  headers: { Authorization: `Bearer ${resendKey}` },
}).then((r) => r.json());

console.log(
  JSON.stringify(
    {
      zone: { id: zoneId, name: zone.name, status: zone.status, nameServers: zone.name_servers },
      dnsResults: results,
      resend: {
        domainStatus: status.status,
        records: (status.records ?? []).map((r) => ({
          name: r.name,
          type: r.type,
          status: r.status,
        })),
      },
      nextSteps:
        zone.status === "pending"
          ? ["Update nameservers at Squadhelp to Cloudflare values above", "Wait up to 24h, then re-run this script"]
          : ["Run: npm run deploy:all --workspace @vendo/api"],
    },
    null,
    2,
  ),
);
