# Caryn Walker — static website

Plain HTML/CSS/JS. No build step. Upload the whole folder to any host
(Netlify, Vercel, GitHub Pages, cPanel/FTP) and index.html is the homepage.
All "home" links point to "/" (root-relative), so this build must be served
from a domain root, not a subdirectory.

## Structure

index.html          Landing page (all four ventures)
author.html         The Autobiography
counselling.html    Counselling
coaching.html       Life Coaching
britannia.html      Language Tutoring (Britannia School of Language)
css/style.css       All shared styling (colour "worlds" set via <body data-world="...">)
js/site.js          Booking-form validation + submission, scroll reveals, year stamp
images/             All photos and logos

## External dependencies (loaded from CDN, no install needed)

- Bootstrap 5.3.3 (grid, navbar, modal, carousel, forms)
- Google Fonts: Newsreader (headings) + Hanken Grotesk (body)

## Contact forms

Booking/enquiry modals on counselling.html, coaching.html and tutoring.html
POST to Formspree: https://formspree.io/f/mbdngope
All fields are included in the email body. To change the destination, edit the
form "action" attribute on those three pages.

## Colour scheme

Edit the CSS variables at the top of css/style.css.
:root sets the shared palette; each [data-world="..."] block overrides the
accent + hero colours for one venture.