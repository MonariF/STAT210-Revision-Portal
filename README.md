# STAT 210 Topic-by-Topic Revision Portal

**Lecturer:** Dr. Fred Monari  
**Course:** STAT 210 — Statistical Software and Data Analysis  
**Platform:** Google Apps Script, HTML, CSS, JavaScript and Google Sheets

## Features
- Student registration using name, registration number, email, course code and optional programme/class.
- Week-by-week revision lessons and topic navigation.
- R and SPSS concepts, practical examples and self-assessment questions.
- Repeatable topic assessments; each attempt is recorded separately.
- Lecturer dashboard with registration statistics, student performance, topic summaries and attempt history.
- Search and filters, refresh, CSV export and access to the records spreadsheet.
- Lecturer access code stored in Apps Script Script Properties, not hard-coded in the public source.

## Course content coverage
The source notes coverage of Weeks 1, 2, 3, 4, 6, 7, 8 and 9. Week 5 is not represented in the supplied course notes and has not been invented.

## Files
- `Code.gs` — server-side Apps Script functions for setup, student registration, assessment recording and lecturer dashboard.
- `index.html` — student learning interface and lecturer dashboard.

## Installation
1. Create a project at https://script.google.com/.
2. Replace the server-side file with `Code.gs`.
3. Add an HTML file named exactly `index` and paste `index.html`.
4. Save the project.
5. Run `setupSTAT210()` once and authorize the requested Google permissions. It creates a records spreadsheet if none is configured; it reuses the spreadsheet ID in Script Properties and does not clear existing rows.
6. Run `configureLecturerAccessCode()` and enter a private, strong access code when prompted.
7. Deploy as a Web App, selecting execution identity and access level according to university policy.
8. Test student registration, a topic assessment, lecturer login, refresh and CSV export with dummy records.

## Data and privacy
Student names, registration numbers, email addresses, assessment attempts and submitted answers are stored in a Google spreadsheet owned by the Apps Script account. Keep that spreadsheet private. Do not commit student records, exports, spreadsheet IDs, access codes or deployment URLs to this public repository.

Student-entered details are not identity verification. Follow university policy and applicable data-protection requirements.

## Important
GitHub stores the source code; it does not host or run the Apps Script backend. The application runs when deployed from Google Apps Script.
