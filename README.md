# DermaPaw AI — Advanced Starter

A responsive static website using HTML, CSS, JavaScript, and the Teachable Machine image library (which uses TensorFlow.js) to connect an image classifier.

## Model species support and updates
The current model export at `https://teachablemachine.withgoogle.com/models/n1XfBcG2q/` exposes four skin-pattern class labels. Its `metadata.json` has an empty `userMetadata` object and no animal-species information; those labels do not establish whether cats, dogs, or both appeared in training. The application therefore defaults `MODEL_SPECIES_SUPPORT` in `script.js` to **Unknown / Not Verified**. Do not change it to a verified status until the original training dataset and separate, species-specific validation tests establish that support. Selecting Cat or Dog labels the screening, care guide, and treatment record but does not alter the trained model.

If review of the original Teachable Machine project finds missing or inadequate species coverage:

1. Open the original Image Project used to produce the connected export. If you cannot access that project or its training images, the export metadata alone cannot recover them; create a replacement project and assemble a documented dataset.
2. For each of the existing skin-pattern categories, add representative, correctly labeled images of every species you intend to claim support for: dog images in every class for dog support, cat images in every class for cat support, and both species in every class for both-species support. Cover varied individual animals, coat types, skin tones, body locations, lighting, camera distances, and image backgrounds. Include appropriate examples for the “No Obvious Skin Concern” class. Keep the categories and class labels consistent with the app's existing four-class mapping.
3. Reserve a separate holdout set of images that were not used for training. Include different individual animals in the holdout where possible, and record results separately for cats and dogs and for each class. Review errors and class balance; do not mark a species verified based solely on seeing it in the training data or on one successful prediction.
4. Add the approved training images to the corresponding Teachable Machine classes, train the model again, and export it using the TensorFlow.js (browser) export option. Keep the new export's `model.json`, weight shard file(s), and `metadata.json` together at a publicly reachable HTTPS directory.
5. Update `MODEL_URL` in `script.js` to that new export directory URL (ending in `/`). Confirm the new metadata still provides the four supported labels, run real cat and dog holdout images through the app, and review the returned class scores and prediction behavior. Preserve the actual scores; do not enter test outcomes into application code.
6. Only after documenting the dataset review and separate validation outcomes, set `MODEL_SPECIES_SUPPORT` in `script.js` to `SPECIES_SUPPORT.DOGS_VERIFIED`, `SPECIES_SUPPORT.CATS_VERIFIED`, or `SPECIES_SUPPORT.DOGS_AND_CATS_VERIFIED` as appropriate. Otherwise leave it at `SPECIES_SUPPORT.UNKNOWN_NOT_VERIFIED`.

## Treatment Progress page
Open **Treatment progress** in the sidebar, or visit `#treatment`, to use the separate veterinarian-guided treatment record, scheduled-event adherence log, owner-observation journal, and transparent recovery outlook. The Treatment Progress page is independent of the Skin Screening and How It Works views. Enter only treatment instructions supplied by the pet's veterinarian. The app does not prescribe a medicine, dose, frequency, or duration.

Use **Add an animal** to create a progress record with a pet identifier and species. A veterinarian-provided treatment plan is optional: save the pet first to add baseline observations even if treatment has not been prescribed. A schedule requires the veterinarian-entered start date, frequency, and duration. Select **Edit existing record** to update its details; **Delete record** removes that pet and its associated event and journal history after confirmation.

After a successful image screening, **Start Treatment Tracking** can transfer the actual model class scores, top visible-pattern label, animal type, date, and a compressed copy of the selected photo to a matching local pet record (same name and species) or create one. This handoff does not diagnose a condition or prescribe treatment. Manual journal entries let owners record redness, hair loss, scabs/scaling, itching/discomfort, an overall visible-progress assessment, notes, and an optional JPG/PNG/WEBP photo up to 512 KB. Entries can be edited or deleted and are shown by date.

## Skin Care & Treatment Guide
The guide library searches the four categories configured from the connected Teachable Machine model labels. Opening a category card shows the existing educational guidance without inventing a screening prediction. A matching actual screening result adds its original class name and returned scores. The guide's Cat/Dog selector synchronizes with the screening selection but does not change or retrain the classifier; species-specific model performance remains unverified until supported by separate dataset review and validation.

The guide checklist, step position, safety selections, veterinarian-provided notes, and observations use the existing localStorage store on this browser and device. **Next Step** and **Previous Step** navigate the guide without checking a step automatically. Starting a new session retains earlier care-session history. Checklist completion records care-guide activity only; it is not evidence of medical improvement or recovery. Veterinary source links are limited to the references already present in `script.js`.

The dashboard shows the initial screening/baseline and latest saved photos and notes. The before-and-after selectors compare saved photos and display model scores only for photos that came from screening; changes in lighting, angle, distance, coat position, and image quality can affect appearance and scores. A score change is not evidence of recovery. Save a future photo-reminder date to show it in the app's upcoming reminders list. These are in-app reminders only; they do not notify you when the site is closed.

### Adherence calculation and date handling
Recorded adherence is:

`completed due events / (completed due events + missed due events) × 100`

Only events whose scheduled time has passed and whose status is completed or missed are included. Future events and all pending events are excluded from both the numerator and denominator. If there are no completed or missed due events, the UI displays “Not available yet” rather than dividing by zero. Total scheduled, completed, missed, and pending event counts are shown separately. This is a record of owner-entered events, not proof that the treatment was followed exactly or that the pet is improving.

The planned treatment end date is calculated as the treatment start date plus the veterinarian-entered duration minus one day (the start date is day one). It is a reminder of the entered prescription duration only; it is separate from and must not be confused with an estimated recovery date.

### Evidence, ranges, and specific recovery estimates
`recovery-evidence.js` stores structured citations with DOI links, species and condition context, population, treatment context, indexed reported outcomes, evidence notes, limitations, and explicit flags for whether a source evaluates adherence or supports recovery estimates/missed-treatment adjustments. `treatment.js` renders these source records and checks species, condition, and treatment keywords. A future numeric range requires a verified source, an explicitly supported outcome, a documented estimate method, valid day bounds, and a context match. The current entries do not meet that requirement.

The user interface distinguishes expected time to initial improvement, expected time to complete resolution, prescribed treatment duration, owner-recorded adherence, observed progress, and a specific estimated recovery date. No validated recovery model or applicable numerical recovery range is currently implemented. Therefore both improvement and resolution ranges, and any specific recovery-day/date estimate, remain unavailable for every current case. The system does not convert adherence percentages, missed events, treatment duration, or image-classification scores into recovery days.

Case 1 (treatment followed as prescribed) displays the recorded adherence and plan without concluding that the pet is healing. Case 2 reports the count of missed events and explicitly states that there is insufficient evidence to calculate a missed-treatment recovery adjustment. The app does not assume that a missed event adds a fixed number of days. Follow the veterinarian's instructions about missed applications and do not double or change treatment unless the veterinarian advises it.

### Sources checked
Source metadata and indexed abstracts were checked through Crossref on 2026-10-24. Publisher pages for the Wiley papers were not accessible during implementation, so the app deliberately does not infer unreported outcomes from full text:

- Loeffler A, et al. *Antimicrobial use guidelines for canine pyoderma by the International Society for Companion Animal Infectious Diseases (ISCAID).* 2025. [doi:10.1111/vde.13342](https://doi.org/10.1111/vde.13342). The abstract reports initial systemic treatment-course recommendations of 2 weeks for superficial and 3 weeks for deep canine pyoderma, followed by re-examination. Those durations are not encoded as recovery timelines.
- Moriello KA, et al. *Diagnosis and treatment of dermatophytosis in dogs and cats.* 2017. [doi:10.1111/vde.12440](https://doi.org/10.1111/vde.12440). The abstract describes consensus diagnosis and treatment recommendations, including concurrent systemic antifungal therapy and topical coat disinfection, but supplies no numerical recovery range.
- Miller J, et al. *2023 AAHA Management of Allergic Skin Diseases in Dogs and Cats Guidelines.* 2023. [doi:10.5326/jaaha-ms-7396](https://doi.org/10.5326/jaaha-ms-7396). The abstract describes multimodal management and notes that management may be prolonged; it does not provide a numerical recovery range. The DOI supplied in the project prompt, `10.5326/JAAHA-MS-7368`, resolves to the 2023 AAHA Selected Endocrinopathies of Dogs and Cats Guidelines and is not the allergic-skin guideline.

None of these checked sources establishes a quantitative relationship between owner-recorded missed treatment events and extra recovery days. No source currently supplies a specific estimated recovery date for the app to calculate.

### Local data and privacy
Treatment records, event histories, observations, and optional compressed-size-limited photos are stored in `localStorage` for this browser and device only. They are not uploaded, backed up, or synchronized. Stored records are validated before display. Missing storage starts an empty record list; invalid/corrupted storage is reported, left untouched, and not overwritten. Browser storage limits can prevent saving; the app reports that failure instead of claiming persistence.

### Test treatment tracking before connecting a model
1. Start with VS Code Live Server and open the sidebar's **Treatment progress** page, or directly visit the Live Server URL with `#treatment`. The image classifier can remain disconnected; treatment tracking does not require it.
2. Save a sample treatment plan using a pet identifier, species, veterinarian-entered frequency, start date, and duration. Confirm the planned end date is distinct from the unavailable recovery date.
3. Select **Edit existing record** and save an adjustment, then test deleting a sample record. Add an event in the past, mark it completed, add another due event and mark it missed, then correct one status. Confirm adherence updates as completed divided by completed plus missed.
4. Add a due event left pending and a future event. Confirm both remain pending and neither changes the adherence denominator. With no completed or missed due events, adherence should display as unavailable.
5. Save progress-only animal records without a treatment plan. Add journal entries with an owner-selected overall status, redness, hair loss, scabs/scaling, optional notes, and a small photo. Use the journal's Edit/Delete buttons. Confirm adherence alone does not change the owner-recorded progress assessment.
6. From Skin Screening, enter a pet name or identifier, run a real model screening, then choose **Start Treatment Tracking**. Confirm that the matching pet record (or a new one) receives the real returned scores and a local photo baseline. Check the dashboard's initial/latest photos, newest notes, and before-and-after selectors. Do not expect a recovery prediction from a screening score.
7. Save a future photo reminder and a veterinarian follow-up date, then confirm they appear in upcoming reminders. These reminders are visible only while using the site.
8. Use each **View Evidence** button to inspect the source title, publication year, DOI, findings, and limitations. The outlook should continue to state that numeric ranges and a specific date are unavailable; missed events must not produce an arbitrary delay.
9. Reload to check local persistence, choose another pet record, and verify its logs stay with that record. To clear test data, use the browser developer tools to remove the `dermapaw-treatment-records-v1` localStorage key.
10. Navigate between `#guide`, `#screening`, `#care-guide`, and `#treatment`, including browser Back/Forward; verify only one view is displayed at a time, the active navigation item updates, and the treatment page remains independent of screening.
9. Separately test the existing image upload and four-class model connection flow described below.

## Four model classes
Create exactly these four classes in Teachable Machine:
1. `Redness / Irritation`
2. `Hair Loss / Alopecia`
3. `Scabs / Scaling`
4. `No Obvious Skin Concern`

These are visible-pattern categories, not confirmed diseases. Use appropriate, licensed, correctly labeled images. Include varied pets, lighting, coat colors, and angles. Test with photos not used during training. Avoid claiming validated accuracy unless you have performed a proper evaluation.

## Test the connected AI model
1. Start the page with VS Code Live Server. The model status should progress from loading to ready; Analyze stays disabled until both the model and an image are ready.
2. The current model URL is `https://teachablemachine.withgoogle.com/models/n1XfBcG2q/`. The page loads its `model.json` and `metadata.json` through the Teachable Machine image library and TensorFlow.js, each imported once in `index.html`.
3. Select Cat or Dog, choose or drag in a JPG, JPEG, PNG, or WEBP image up to 10 MB, and check its preview. Select Analyze to run the loaded model. Scores are taken directly from returned probabilities, displayed as percentages, and sorted high-to-low without rescaling their total.
4. Try an unsupported file, remove/reselect an image, and navigate to How it works, Skin Care & Treatment Guide, or Treatment progress and back. The model stays loaded for the page session; results do not appear unless prediction succeeds.
5. The current metadata class labels are `Redness / Irritation`, `Hair loss / Alopecia ` (trailing space), `Scabs / Scalling`, and `No Obvious Skin Concern`. The app trims/case-normalizes labels for display and corrects the clear `Scalling` spelling error to `Scabs / Scaling`. Unrecognized metadata labels are reported and not assigned to a different category.
6. The metadata does not document whether the training set includes cats, dogs, or both. The app permits selecting either animal but does not claim species-specific accuracy; the displayed notice explains this limitation.

The displayed scores are model image-classification scores, not verified disease probabilities, diagnostic certainty, or evidence of model accuracy. Evaluate the model on representative, held-out veterinary images before making any accuracy claims. It does not diagnose or prescribe treatment.

## Skin Care & Treatment Guide
The separate **Skin Care & Treatment Guide** sidebar page is available at `#care-guide`. After a successful screening, **View Care & Treatment Guide** opens its **Before You Start Treatment** section with the actual model class names and scores, selected species, and relevant visible-pattern education. The current metadata contains `Redness / Irritation`, `Hair loss / Alopecia ` (trailing space), `Scabs / Scalling`, and `No Obvious Skin Concern`; the app trims whitespace and maps the known `Scalling` spelling to the user-facing `Scabs / Scaling` label. Scores remain image classifications, not diagnoses or confirmed disease probabilities. The model metadata does not establish accuracy for cats, dogs, or either species separately.

The page provides category-specific possible causes, conservative initial precautions, warning signs, and educational examples of diagnostic or treatment approaches a veterinarian may consider. References are linked to AAHA allergic-skin guidelines, the ISCAID canine pyoderma guideline, and the World Association for Veterinary Dermatology dermatophytosis consensus guideline. Treatment options depend on an examination and confirmed cause; no prescription or dosage is selected from the model result.

The guidance is shown only when the actual model class maps to one of the four recognized metadata classes; it does not guess a guide for an unknown class. A validated result is retained in the current browser tab so the guide can be refreshed without inventing or rescaling scores. Directly opening `#care-guide` without a current result shows a prompt to screen an image. Where species-specific performance or a cause cannot be determined from the image, that limitation is stated rather than inferring a diagnosis.

Before opening the step-by-step guide, choose whether a veterinarian has examined the pet and whether you have veterinary instructions. You can record those instructions as notes, but the checklist does not change a prescribed medicine, dose, or duration. Choosing **My pet's condition is getting worse** displays a reassessment warning and hides routine checklist actions; selecting an urgent warning sign (severe pain, rapidly spreading swelling, significant bleeding, or rapid deterioration) displays an urgent-care notice. Educational information remains available.

The guide separates low-risk observation steps from veterinary treatment, includes supplies, precautions, things to avoid, and changes to monitor, and saves checked steps with completion dates. Owners can add dated observations and create new care sessions without deleting earlier session history. The **Track Progress & Veterinary Instructions** link opens the existing Treatment Progress view for progress photos, observations, and veterinarian-entered schedules. Care-guide safety answers, instructions, checklist sessions, dates, and notes are stored in the `dermapaw-care-progress-v1` localStorage key on this browser and device only. Existing version-1 checklist data is migrated in memory when valid; historic completion dates are not fabricated. No backend, account, synchronization, or database is configured.

### Test the screening-to-care flow
1. Run the site over VS Code Live Server, select Cat or Dog, then upload or capture an image and wait for a successful model prediction.
2. Select **View Care & Treatment Guide** in the screening results and confirm the separate page opens with the actual top model class, all four metadata labels and scores, explanatory text, and linked veterinary sources. Refresh `#care-guide` in the same tab and confirm the real result remains available.
3. Verify the possible causes, precautions, and treatment-option notes match the displayed class. Confirm the page states the result is not a diagnosis and does not recommend medicine.
4. Try each safety-check answer. Record sample veterinarian instructions, select worsening, and select each urgent warning sign; check that worsening/urgent states do not offer a routine checklist. Remove test data afterward using browser developer tools if desired.
5. For a non-worsening answer, select **Continue to Care Guide**, check and uncheck observation steps, save an observation, and start a new session. Confirm completion dates and earlier sessions remain visible. Reload and confirm the current session's checklist and notes restore.
6. Follow **Track Progress & Veterinary Instructions** to the existing Treatment Progress page and confirm its data and navigation remain available.

## How It Works page
Open **How it works** in the sidebar or visit `#guide` for the complete eight-step journey: choose a cat or dog, upload or capture an image, run the in-browser image classifier, understand its output, review pre-treatment safety guidance, use the category-specific observation checklist, track records and photos, and seek veterinary advice when needed. The model's class names are populated from its loaded metadata rather than duplicated in the guide; after a successful prediction, the guide can show the actual returned class names and scores. Before a result is available, it explicitly says so.

The guide links to Skin Screening, the existing Skin Care & Treatment Guide, and Treatment Progress. It explains current upload format and size limits, camera permission and secure-origin requirements, visible-pattern score limitations, implemented local progress features, and the absence of a validated recovery-date predictor. Its workflow adapts to narrow screens. The sidebar labels wrap when space is limited without changing navigation behavior.

### Test the How It Works page
1. Open `#guide` and confirm the eight workflow steps, safety notice, capability limits, and links to `#screening`, `#care-guide`, and `#treatment`.
2. Wait for the model status. Confirm class labels match the loaded model metadata. Run a screening and return to How it works to see the actual result scores; reset the screening and confirm those scores are cleared.
3. At desktop, tablet, and mobile widths, confirm the workflow becomes vertical on narrow screens and the page has no horizontal overflow. Expand/collapse the sidebar and confirm the long Care & Treatment Guide label stays within the link and its icon remains aligned.

## Live Camera Capture
On the Skin Screening page, select **Open Camera** and allow camera permission when prompted. Camera access requires HTTPS or localhost and is never requested automatically. Mobile browsers are asked to prefer the rear-facing camera; use **Switch Camera** when available to switch between rear and front cameras.

Capture a still image, then choose **Retake Photo** or **Use This Photo**. The confirmed photo is placed in the same local preview and analyzed by the already-loaded Teachable Machine model using the same Analyze Image button as uploaded photos. Selecting a new upload replaces the prior preview and clears its previous results. **Close Camera** stops the active camera tracks. The camera is also stopped when leaving Skin Screening or switching the browser tab away. Captured photos remain local in the browser and are not uploaded to a separate image service. If camera access is unavailable or denied, image upload remains available.

## Run in VS Code
Extract the ZIP, open the `DermaPaw_AI_Advanced` folder, install Live Server, then right-click `index.html` and choose Open with Live Server. Internet is needed for the hosted libraries and fonts.

## Deploy
Deploy the static folder using a static host such as Vercel or GitHub Pages. Test on desktop and mobile after deployment.

## Safety and limitations
Educational guidance only, not a veterinary diagnostic tool. Predictions can be inaccurate or biased by dataset and image quality. High score does not prove disease; low score does not rule it out. Do not use results to select medication or delay veterinary care. Consult a veterinarian for persistent, painful, spreading, bleeding, swollen, or worsening skin problems.

Skin-pattern image classification does not diagnose the underlying condition or determine a reliable recovery timeline. Owner-recorded changes are not a veterinary diagnosis. Contact a veterinarian promptly if the pet's condition worsens, becomes painful, bleeds, develops swelling or discharge, or the pet appears unwell. Do not change a prescribed treatment plan based on this educational app.

## Files
- `index.html`: interface and library imports
- `style.css`: responsive visual design
- `script.js`: upload validation, model loading, four-class scores, and safe guidance
- `treatment.js`: local treatment plans, adherence events, observation journal, and evidence display
- `recovery-evidence.js`: source metadata and estimate eligibility configuration
