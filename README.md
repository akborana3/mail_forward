#PLAN.MD
Build a Personal Email Alias Service using Hugging Face + Cloudflare Email Routing + Resend

Goal

Create a personal email alias platform where I can create unlimited aliases under my domain akay.codes.

Example:

contact@akay.codes → forwards to my Gmail
shop@akay.codes → forwards to my Gmail
random123@akay.codes → forwards to another email
The system should allow me to manage aliases from a web dashboard.

Tech Stack

Frontend:

React + Next.js
TailwindCSS
Backend:

Node.js + Express
Database:

HUGGING FACE DATA SET (USING HF API KEY) Hosting:

Hugging Face Spaces (Docker)

Domain:

akay.codes
Email Receiving:

Cloudflare Email Routing
Email Sending:

Resend API
Features

Authentication

Simple admin login.

USER SIGN UP FOR FUTURE . Only admin can create/delete aliases.

Dashboard

Show:

Total aliases
Active aliases
Destination email
Created date
Buttons:

Add Alias
Delete Alias
Edit Alias
Search Alias
Create Alias

Example:

Alias: contact

Destination: mygmail@gmail.com

Save into database.

Result:

contact@akay.codes

Alias Mapping

Store:

id alias destination_email created_at

Example:

1 contact abc@gmail.com

2 hello xyz@gmail.com

3 random person@gmail.com

Cloudflare Email Routing

Cloudflare receives all incoming mail.

Use Catch-All routing.

Forward every email to backend webhook instead of individual forwarding rules if possible.

If Cloudflare cannot send to webhook, explain the limitation and implement a solution where Cloudflare forwards all mail to a single inbox that the backend monitors and redistributes based on alias mapping.

Document the exact DNS records (MX/SPF/etc.) required.

Forward Logic

Incoming:

contact@akay.codes

Backend checks database.

Find:

contact → abc@gmail.com

Forward mail to:

abc@gmail.com

using Resend.

Keep:

Subject

Attachments

HTML

Text

Sender

CC

Reply-To

Everything preserved.

Send Mail

Dashboard should have:

Compose Mail

To:

someone@gmail.com

From Alias:

contact@akay.codes

Subject

Body

Attachments

Send via Resend API.

The email should appear from the selected alias if Resend domain verification allows it.

API

GET /aliases

POST /aliases

DELETE /aliases/:id

PUT /aliases/:id

POST /send

GET /stats

UI

Dark modern dashboard.

Responsive.

Glassmorphism cards.

Sidebar navigation.

Top navbar.

Toast notifications.

Loading animation.

Beautiful tables.

Docker

Provide:

single Dockerfile

start.sh

requirements

Everything should run on Hugging Face Spaces Docker.

Environment Variables

RESEND_API_KEY=

ADMIN_PASSWORD=

DATABASE_PATH=

DOMAIN=akay.codes HF API KEY= HF DATASET REPO =

README

Include:

Project setup
Hugging Face deployment
Cloudflare DNS setup
Resend domain verification
Environment variables
API documentation
Folder structure
Screenshots
Important

If Cloudflare Email Routing cannot directly support the requested forwarding workflow, explain the limitation and redesign the architecture using a proper inbound email provider or self-hosted mail receiver while keeping Hugging Face for the dashboard/API and Resend for outbound mail.

The final project should be production-ready, cleanly structured, and fully documented.
