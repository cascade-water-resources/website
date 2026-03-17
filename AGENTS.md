# AGENTS.md
Guidelines for AI agents contributing to the Cascade Water Resources website repository.

This repository contains a **simple static portfolio / landing page** for:

Roger C. Sutherland, PE  
Principal — Cascade Water Resources, LLC

Roger is a water resources engineer with over five decades of professional experience in stormwater modeling, watershed management, and pollutant reduction strategies. The site highlights selected projects, publications, presentations, and collaborations.

The site should remain **simple, readable, and maintainable by a non-professional web developer**.

---

# Development Philosophy

This project follows a **progressive build approach**.

### Phase 1 — Initial Scaffold
- Basic layout
- Navigation
- Placeholder content
- Horizontal scrolling containers for projects
- Minimal styling

### Phase 2 — Content Expansion
- Add project summaries
- Add images
- Expand publications and presentations
- Improve layout and spacing

### Phase 3 — Document Library
- Report downloads
- Presentation links
- External research links

Agents should **not jump ahead to complex functionality**.

---

# Technology Stack

Static website only.

Allowed:
- HTML5
- CSS3
- Small optional JavaScript

Not allowed:
- React
- Vue
- Angular
- Tailwind
- Bootstrap
- Node build systems
- package.json dependencies

The site must run by simply opening:


index.html


---

# Design Goals

The site should feel like a **professional engineering portfolio**.

Characteristics:

- clean
- calm
- readable
- minimal
- technical / professional tone

Color palette:


Primary dark blue #0e2a47
Secondary blue #2f5d8c
Off white #f4f6f8


Design layout:

- continuous vertical scroll
- wide sections
- readable typography
- horizontal project containers

---

# Repository Structure

Agents must maintain this structure:


cascade-water-site
│
├── index.html
├── projects.html
├── presentations.html
├── publications.html
│
├── css
│ ├── global.css
│ ├── layout.css
│ ├── home.css
│ ├── projects.css
│ └── components.css
│
├── js
│ └── navigation.js
│
├── assets
│ ├── logo
│ │ └── cwr_logo.png
│ ├── images
│ └── icons
│
├── reports
│ └── placeholder.txt
│
└── presentations
└── placeholder.txt


Rules:

- CSS must live in the `/css` directory.
- Images must live in `/assets/images`.
- Logos must live in `/assets/logo`.
- Reports and downloadable files go in `/reports`.

---

# CSS Organization

Each CSS file has a clear purpose.

### global.css
Contains:

- color variables
- typography
- default spacing
- base body styles

### layout.css
Contains:

- section layout
- containers
- grid systems
- spacing between sections

### components.css
Contains reusable UI elements:

- cards
- buttons
- scroll containers
- navigation bar
- hero banner

### home.css
Styling specific to the homepage.

### projects.css
Styling specific to the projects page.

---

# HTML Style Guidelines

HTML must be:

- very readable
- clearly commented
- beginner friendly
- consistently indented

Example section structure:

<!-- ===================================== --> <!-- HERO SECTION --> <!-- Main landing banner --> <!-- ===================================== --> <section class="hero"> </section> ```

Use large comment blocks to separate sections.

Avoid deeply nested structures.

Homepage Structure

The homepage should contain the following sections.

1. Hero Section

Large introduction area.

Content:

Cascade Water Resources

Roger C. Sutherland

short subtitle

Example:

Cascade Water Resources
Water Resources Engineering & Stormwater Modeling
2. About Section

Short summary describing Roger’s expertise:

water resources engineering

stormwater quality modeling

watershed management

creator of SIMPTM model

3. Featured Projects

Displayed as horizontal scrolling cards.

Example behavior:

[ Project ] [ Project ] [ Project ] →

Each project card contains:

title

short description

placeholder for future link

Example projects to include initially:

Livonia Stormwater Pollutant Reduction Study

Jackson Michigan Stormwater Modeling Study

Cross Israel Highway Stormwater Study

Seattle Street Sweeping Pilot Study

San Juan County Street Dirt Analysis

Publications Section

Show only a few highlighted publications.

Examples:

Enhanced Street Sweeping Guidelines (2024)

Street Sweeping: America's First Line of Defense for Stormwater Pollution Runoff Abatement (2023)

Street Dirt: A Better Way of Measuring BMP Effectiveness

Stormwater Quality Modeling of Cross Israel Highway Runoff

Later versions may link to ResearchGate.

Presentations Section

Create cards for selected presentations:

Examples:

California Stormwater Awareness Week 2024

California Stormwater Awareness Week 2023

CSWA conference presentations

Minnesota presentation

Each card includes:

title

location/event

placeholder link

External Links Section

Include links to:

ResearchGate profile

WorldSweeper collaboration article

Clean Streets + Cleaner Waters Initiative

Fathom Solutions website

Horizontal Scroll Containers

Featured project cards should use a horizontal scrolling container.

Example layout:

<div class="project-scroll">

  <div class="project-card"></div>

  <div class="project-card"></div>

  <div class="project-card"></div>

</div>

Cards should have:

subtle shadow

rounded corners

hover effect

Code Style

Agents must prioritize clarity over cleverness.

Example CSS comment style:

/* =====================================
   HERO SECTION
   Main landing banner styles
===================================== */

Naming conventions:

hero-section
project-card
horizontal-scroll
section-container

Avoid cryptic class names.

Things Agents Must NOT Do

Do not introduce:

React

Vue

Angular

Bootstrap

Tailwind

complex JavaScript frameworks

npm packages

Do not introduce build systems.

Do not add unnecessary abstractions.

Future Expansion

Later we may add:

individual project pages

embedded presentations

downloadable reports

images and diagrams

Example future structure:

projects
│
├── livonia.html
├── jackson.html
└── cross-israel-highway.html

Agents should write code so these additions are easy.

Final Principle

This repository prioritizes:

clarity
simplicity
maintainability

It should always remain understandable to someone learning web development.