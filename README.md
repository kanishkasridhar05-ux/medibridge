# MediBridge

A frontend-first medicine eligibility screening and traceability prototype. The app demonstrates review and simulated request workflows; it is not an unrestricted medicine exchange marketplace.

## Run locally

Requires Node.js 20.19+ or 22.12+ for the included Vite version.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create and serve a production build:

```sh
npm run build
npm run preview
```

## Demo access

- Donor sample profile: `nia.demo` (open Donor, then choose the sample account)
- Receiver sample profile: `alex.demo` (open Receiver, then choose the sample account)
- Pharmacist username: `pharmacist.demo`
- Pharmacist password: `review123`

The pharmacist credentials are intentionally public and are defined in `src/config.js`. This is not secure authentication. All sample people, package photos, and medicine records are fictional.

## Included workflows

- Donors can create a fictional profile, upload a package image, run Tesseract.js OCR, edit suggestions, and submit an OTC demo for manual review.
- The pharmacist can approve or reject pending submissions; rejection requires a reason. Only approved, available, unexpired examples appear in receiver search.
- Receivers can search by name and submit a simulated request. A donor response reserves the listing, closes competing pending requests, and can record a simulated completion.
- Donor, receiver, pharmacist, and traceability views share records in localStorage. Status actions include an actor and timestamp.
- Use **Reset demo data** in the navigation to restore the fictional seed records.

## Boundaries

OCR reads visible text only. It does not verify authenticity, identity, package condition, storage, medicine safety, or eligibility. OCR suggestions are editable and uncertain fields are left blank. Prescription, controlled, and uncertain categories are blocked from advancement in this demonstration; real eligibility depends on applicable local rules and authorized professionals.

Approval is a simulated review decision, not a guarantee that a medicine is safe or legally distributable. A listing is not a guarantee of eligibility or safe use. The app does not publish contact details or full addresses and does not implement a real medicine handover. Real distribution would require an authorized process with legal, safety, privacy, identity, and custody controls.

This prototype has no backend. Browser localStorage is not encrypted, authenticated, or shared between devices. Do not enter real personal information or medicine data. OCR language assets may need to download on first use, so OCR requires network access; manual entry remains available.