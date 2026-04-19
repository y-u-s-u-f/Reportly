# Reportly

Reportly is a civic issue reporting app. Snap a photo of a pothole, overflowing trash can, or broken street light, and it gets categorized, routed to the right city department, and put on a map so neighbors can see it too. The design is built mobile-first because you're usually standing in front of the problem when you report it.

It's aligned with UN SDG 11 (Sustainable Cities and Communities) and really tries to make the gap between "I noticed something" and "someone's going to fix it" a lot smaller.

## How it works

- Submit a report with a photo, voice note, or just text — whatever's fastest.
- AI figures out what kind of issue it is and which department handles it.
- Auto-grabs your location and fills in the address.
- If someone already reported the same thing nearby, your submission bumps their count instead of creating a duplicate.
- Map view of everything open in your area, with color coding.
- Upvote, comment, and share reports other people.
- Admins post live updates ("a crew is on the way", "fixed") that residents see.
- One tap to draft an email to the actual city department responsible.

## Stack

React + Vite on the client, Express + Prisma + Postgres on the server. OpenAI (GPT-4o for classification, Whisper for voice). Leaflet + OpenStreetMap for maps. Cloudinary for photo storage.