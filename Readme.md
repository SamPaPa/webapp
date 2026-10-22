# Simple HTTPS web app (Docker)

A tiny Node app behind nginx, serving HTTPS with a self-signed certificate locally.
The same containers move to AWS later; only the certificate changes.

## Files

| File | Purpose |
|---|---|
| `server.js` | The web app (plain Node, no dependencies) |
| `Dockerfile` | Builds the app image |
| `nginx.conf` | TLS termination + reverse proxy to the app |
| `docker-compose.yml` | Runs app + nginx together |
| `gen-cert.sh` | Creates the self-signed certificate |

## Run locally

```sh
chmod +x gen-cert.sh
./gen-cert.sh            # creates certs/fullchain.pem and certs/privkey.pem
docker compose up --build
```

Open https://localhost. The browser will warn about the certificate because it is
self-signed. That is expected; click through (Advanced -> Proceed). Or test with:

```sh
curl -k https://localhost
```

If ports 80/443 are already in use, change the left side of the `ports:` mapping
in `docker-compose.yml` (e.g. `8080:80` and `8443:443`) and use https://localhost:8443.

Stop with `docker compose down`.

## Move to AWS + Namecheap domain

### 1. Launch the server
- Create an EC2 instance (Amazon Linux 2023 or Ubuntu, t3.micro is enough).
- Security group inbound: 22 (your IP only), 80 and 443 (anywhere).
- Allocate an **Elastic IP** and attach it, so the IP never changes.
- Install Docker + the compose plugin, then copy this project over (git or `scp`).

### 2. Point the Namecheap domain at AWS
You have two options.

**Option A - keep Namecheap DNS (simplest).**
Domain List -> Manage -> *Nameservers: Namecheap BasicDNS*, then *Advanced DNS*:
- `A Record` | `@`   | your Elastic IP
- `A Record` | `www` | your Elastic IP (or a CNAME to `@`)

**Option B - use Route 53 as the nameserver.**
Create a hosted zone in Route 53, add the same A records there, then in Namecheap
choose *Nameservers: Custom DNS* and paste the 4 `ns-xxxx.awsdns-xx` values.

DNS changes can take from a few minutes to a few hours.

### 3. Replace the self-signed cert with a real one (Let's Encrypt)
Once the domain resolves to your server, on the EC2 host:

```sh
mkdir -p certbot-webroot
docker compose up -d      # nginx must be serving port 80 (self-signed cert is fine for now)

docker run --rm \
  -v "$PWD/certbot-etc:/etc/letsencrypt" \
  -v "$PWD/certbot-webroot:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com \
  --email you@example.com --agree-tos --no-eff-email
```

Then:
1. In `docker-compose.yml`, add to the nginx volumes:
   `- ./certbot-webroot:/var/www/certbot:ro`
2. Replace the cert mount with the Let's Encrypt files:
   `- ./certbot-etc/live/yourdomain.com:/etc/nginx/certs:ro`
   (the files are named `fullchain.pem` and `privkey.pem`, matching `nginx.conf`).
   Note: `live/` contains symlinks into `archive/`, so also mount
   `./certbot-etc/archive:/etc/nginx/archive:ro`, or simply copy the two files
   into `./certs/`.
3. `docker compose up -d --force-recreate nginx`

Renew every ~60 days by re-running the certbot command with `renew` instead of
`certonly`, then `docker compose exec nginx nginx -s reload` (a cron job works well).

### Alternative: AWS-managed TLS
If you later want less to maintain: put an Application Load Balancer in front, use a
free ACM certificate (validated via a CNAME record you add in Namecheap DNS), and run
the app container on ECS/Fargate or EC2. In that setup nginx is no longer needed;
the ALB terminates HTTPS. Note that ACM certificates cannot be exported to nginx.