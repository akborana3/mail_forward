# Personal Email Alias Service

A fully functional personal email alias platform that allows you to create unlimited email aliases under your domain. Hosted entirely on **Hugging Face Spaces (Docker)** using a **Hugging Face Dataset** as a database, and utilizing **Cloudflare Email Routing** + **Resend** for sending/receiving.

## Tech Stack
- **Frontend/Backend:** Next.js (App Router), TailwindCSS
- **Database:** Hugging Face Datasets (`@huggingface/hub`)
- **Hosting:** Hugging Face Spaces (Docker)
- **Email Sending/Forwarding:** Resend API & Cloudflare Email Workers

---

## 🚀 Setup & Deployment

### 1. Hugging Face Datasets (Database)
1. Create a new **Dataset** on Hugging Face (e.g., `username/email-aliases-db`).
2. Generate a **Write-access Token** in your Hugging Face account settings.
3. Keep this Repo ID and Token ready for the Environment Variables.

### 2. Resend Setup (Sending)
1. Sign up for [Resend](https://resend.com).
2. Add and verify your domain (`akay.codes`).
3. Add the required DNS records provided by Resend (TXT/MX/CNAME) to Cloudflare.
4. Get your API Key.

### 3. Cloudflare Email Routing Setup (Receiving)
Cloudflare natively forwards email to verified addresses, but we need to intercept it and send it to our webhook so the Next.js app can process and resend it (keeping original sender/attachments intact).

#### Step 3A: DNS Records
Enable Cloudflare Email Routing for `akay.codes` and add the default MX records.

#### Step 3B: Cloudflare Email Worker
Create a new **Worker** in Cloudflare to catch inbound emails and forward them to your deployed webhook:

```javascript
export default {
  async email(message, env, ctx) {
    const rawEmail = await new Response(message.raw).text();

    await fetch("https://your-hf-space-url.hf.space/api/email-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.WEBHOOK_SECRET}`
      },
      body: JSON.stringify({
        rawEmail: rawEmail,
        to: message.to,
        from: message.from
      })
    });
  }
};
```
*Note: Make sure to set the `WEBHOOK_SECRET` environment variable in your Cloudflare Worker to match the one in your Hugging Face Space.*

#### Step 3C: Routing Rule
In Cloudflare Email Routing, go to **Routing Rules**, create a **Catch-All** rule, and set the action to **Send to a Worker** (select the worker you just created).

### 4. Deploying to Hugging Face Spaces
1. Create a new **Space** on Hugging Face.
2. Choose **Docker** as the SDK and **Blank** template.
3. Push the contents of this repository to the space.
4. Add the following **Secrets (Environment Variables)** in the Space settings:

| Variable | Description | Example |
|---|---|---|
| `HF_API_KEY` | Hugging Face Write Token | `hf_...` |
| `HF_DATASET_REPO` | Repo ID of your database | `username/email-aliases-db` |
| `RESEND_API_KEY` | Resend API Key | `re_...` |
| `ADMIN_PASSWORD` | Initial password for the admin account | `supersecret` |
| `DOMAIN` | Your domain name | `akay.codes` |
| `WEBHOOK_SECRET` | Secret to secure the webhook | `random-long-string` |
| `JWT_SECRET` | Secret for session tokens | `another-random-string` |

---

## 🛠 Features
- **Public Sign up & Login:** Complete authentication using JWTs.
- **Admin Alias Management:** View, add, update, and delete aliases and their forwarding destinations.
- **Email Receiving & Forwarding:** Preserves Subject, HTML, Text, and Attachments using `mailparser`. Sets `Reply-To` properly.
- **Outbound Composer:** Send new emails out as any created alias directly from the dashboard.
- **Modern UI:** Glassmorphism UI elements built with TailwindCSS and Lucide React.
