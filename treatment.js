import { RECOVERY_EVIDENCE, getRecoveryOutlook } from "./recovery-evidence.js";

const STORAGE_KEY = "dermapaw-treatment-records-v1";
const MAX_PHOTO_BYTES = 512 * 1024;
const MAX_RECORDS = 30;
const MAX_EVENTS = 1000;
const MAX_OBSERVATIONS = 500;
const $ = id => document.getElementById(id);
const ui = {
	notice: $("treatmentNotice"),
	form: $("treatmentForm"),
	planSelect: $("savedPlanSelect"),
	newPlan: $("newTreatmentButton"),
	editPlan: $("editTreatmentButton"),
	deletePlan: $("deleteTreatmentButton"),
	savePlan: $("saveTreatmentButton"),
	petName: $("treatmentPetName"),
	species: $("treatmentSpecies"),
	condition: $("treatmentCondition"),
	medicine: $("treatmentMedicine"),
	startDate: $("treatmentStartDate"),
	frequency: $("treatmentFrequency"),
	duration: $("treatmentDuration"),
	followUp: $("treatmentFollowUp"),
	plannedEnd: $("plannedEndDate"),
	selectedSummary: $("selectedPlanSummary"),
	adherence: $("adherenceSummary"),
	eventForm: $("eventForm"),
	eventDueAt: $("eventDueAt"),
	eventHistory: $("treatmentHistory"),
	journalForm: $("journalForm"),
	observationDate: $("observationDate"),
	redness: $("rednessStatus"),
	hairLoss: $("hairLossStatus"),
	scaling: $("scalingStatus"),
	itching: $("itchingNotes"),
	progressNotes: $("progressNotes"),
	progressPhoto: $("progressPhoto"),
	overallStatus: $("progressStatusSelect"),
	progressHistory: $("progressHistory"),
	latestProgress: $("latestProgress"),
	initialImprovement: $("initialImprovement"),
	completeResolution: $("completeResolution"),
	recoveryDate: $("recoveryDate"),
	evidenceStatus: $("evidenceStatus"),
	followUpSummary: $("followUpSummary"),
	adherentScenario: $("adherentScenario"),
	missedScenario: $("missedScenario"),
	evidenceSources: $("evidenceSources"),
	dashboardPetName: $("dashboardPetName"),
	dashboardSpecies: $("dashboardSpecies"),
	dashboardScreeningDate: $("dashboardScreeningDate"),
	dashboardTreatmentStart: $("dashboardTreatmentStart"),
	dashboardFollowUp: $("dashboardFollowUp"),
	dashboardInitialPhoto: $("dashboardInitialPhoto"),
	dashboardInitialPhotoDate: $("dashboardInitialPhotoDate"),
	dashboardLatestPhoto: $("dashboardLatestPhoto"),
	dashboardLatestPhotoDate: $("dashboardLatestPhotoDate"),
	dashboardPattern: $("dashboardPattern"),
	dashboardProgressStatus: $("dashboardProgressStatus"),
	dashboardNotes: $("dashboardNotes"),
	reminderForm: $("reminderForm"),
	nextPhotoReminder: $("nextPhotoReminder"),
	reminderList: $("reminderList"),
	comparisonFirst: $("comparisonFirst"),
	comparisonSecond: $("comparisonSecond"),
	comparisonEmpty: $("comparisonEmpty"),
	comparisonImages: $("comparisonImages")
};

const requiredUi = Object.entries(ui).filter(([, element]) => !element).map(([id]) => id);
if (requiredUi.length) {
	throw new Error(`Treatment tracker is missing required interface elements: ${requiredUi.join(", ")}`);
}

const today = localDateString(new Date());
ui.observationDate.value = today;
let appData = { version: 1, records: [] };
let selectedRecordId = null;
let editingPlan = false;
let editingObservationId = null;
let storageIsValid = true;
loadRecords();
selectedRecordId = appData.records[0]?.id || null;
renderEvidenceSources();
renderRecords();
loadSelectedPlan();
renderTreatmentSummary();

ui.form.addEventListener("input", updatePlannedEndDate);
ui.form.addEventListener("submit", saveTreatmentPlan);
ui.newPlan.addEventListener("click", startNewTreatmentPlan);
ui.editPlan.addEventListener("click", () => setPlanEditing(true));
ui.deletePlan.addEventListener("click", deleteTreatmentPlan);
ui.planSelect.addEventListener("change", () => {
	selectedRecordId = ui.planSelect.value || null;
	editingObservationId = null;
	ui.journalForm.reset();
	ui.journalForm.querySelector('button[type="submit"]').textContent = "Save observation";
	loadSelectedPlan();
	renderTreatmentSummary();
});
ui.eventForm.addEventListener("submit", addScheduledEvent);
ui.eventHistory.addEventListener("click", handleEventHistoryClick);
ui.journalForm.addEventListener("submit", saveObservation);
ui.progressHistory.addEventListener("click", handleObservationHistoryClick);
ui.reminderForm.addEventListener("submit", savePhotoReminder);
ui.comparisonFirst.addEventListener("change", renderComparison);
ui.comparisonSecond.addEventListener("change", renderComparison);
window.addEventListener("hashchange", consumeScreeningHandoff);
consumeScreeningHandoff();

function setNotice(message, isVisible = true) {
	ui.notice.textContent = message;
	ui.notice.hidden = !isVisible;
}

function localDateString(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function isValidDateOnly(value) {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const date = new Date(`${value}T00:00:00.000Z`);
	return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isNonEmptyString(value, maxLength = 1000, allowEmpty = false) {
	return typeof value === "string" && value.length <= maxLength && (allowEmpty || value.trim().length > 0);
}

function isValidRecord(record) {
	if (!record || typeof record !== "object" || Array.isArray(record)) return false;
	if (!isNonEmptyString(record.id, 100) || !isNonEmptyString(record.petName, 80)) return false;
	if (!["cat", "dog"].includes(record.species)) return false;
	if (!isNonEmptyString(record.condition, 120, true) || !isNonEmptyString(record.medicine, 160, true)) return false;
	const hasTreatmentPlan = Boolean(record.startDate || record.frequency || record.durationDays);
	if (record.startDate !== "" && !isValidDateOnly(record.startDate)) return false;
	if (!isNonEmptyString(record.frequency, 100, true)) return false;
	if (record.durationDays !== null && record.durationDays !== undefined &&
		(!Number.isInteger(record.durationDays) || record.durationDays < 1 || record.durationDays > 3650)) return false;
	if (hasTreatmentPlan && (!isValidDateOnly(record.startDate) ||
		!isNonEmptyString(record.frequency, 100) ||
		!Number.isInteger(record.durationDays) || record.durationDays < 1 || record.durationDays > 3650)) return false;
	if (record.followUpDate !== "" && !isValidDateOnly(record.followUpDate)) return false;
	if (record.nextPhotoReminder && !Number.isFinite(Date.parse(record.nextPhotoReminder))) return false;
	if (!Array.isArray(record.events) || record.events.length > MAX_EVENTS) return false;
	if (!Array.isArray(record.observations) || record.observations.length > MAX_OBSERVATIONS) return false;
	if (!record.events.every(event =>
		event && isNonEmptyString(event.id, 100) &&
		typeof event.dueAt === "string" && Number.isFinite(Date.parse(event.dueAt)) &&
		["pending", "completed", "missed"].includes(event.status)
	)) return false;
	return record.observations.every(observation =>
		observation && isNonEmptyString(observation.id, 100) &&
		isValidDateOnly(observation.date) &&
		["not-assessed", "improved", "unchanged", "worse"].includes(observation.redness) &&
		["not-assessed", "improved", "unchanged", "worse"].includes(observation.hairLoss) &&
		["not-assessed", "improved", "unchanged", "worse"].includes(observation.scaling) &&
		isNonEmptyString(observation.itching, 500, true) &&
		isNonEmptyString(observation.notes, 1000, true) &&
		(observation.overallStatus === undefined || ["insufficient", "improving", "unchanged", "worsening", "needs-vet"].includes(observation.overallStatus)) &&
		(observation.source === undefined || ["manual", "screening"].includes(observation.source)) &&
		(observation.predictedCategory === undefined || isNonEmptyString(observation.predictedCategory, 120, true)) &&
		(observation.screeningScores === undefined || (Array.isArray(observation.screeningScores) && observation.screeningScores.length <= 20 &&
			observation.screeningScores.every(score => score && isNonEmptyString(score.className, 120) &&
				isNonEmptyString(score.displayName, 120) && Number.isFinite(score.probability) && score.probability >= 0 && score.probability <= 1))) &&
		(observation.photo === "" || (typeof observation.photo === "string" &&
			observation.photo.length <= 1_000_000 && /^data:image\/(jpeg|png|webp);base64,/.test(observation.photo)))
	);
}

function loadRecords() {
	let serialized;
	try {
		serialized = window.localStorage.getItem(STORAGE_KEY);
	} catch {
		storageIsValid = false;
		setNotice("Browser storage is unavailable. Treatment records cannot be loaded or safely saved in this browser.");
		return;
	}
	if (serialized === null) return;
	try {
		const parsed = JSON.parse(serialized);
		if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.records) ||
			parsed.records.length > MAX_RECORDS || !parsed.records.every(isValidRecord)) {
			throw new Error("Stored treatment data does not match the expected record format.");
		}
		appData = parsed;
	} catch (error) {
		storageIsValid = false;
		setNotice(`Saved treatment data could not be validated and was not loaded. Existing data was left untouched. ${error.message}`);
	}
}

function commitRecords(nextData) {
	if (!storageIsValid) {
		setNotice("Changes were not saved because the existing local treatment data is unavailable or invalid. Do not clear it if you need to recover those records.");
		return false;
	}
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
	} catch (error) {
		setNotice(`Treatment changes could not be saved to this browser: ${error.message || "storage quota or permissions error"}. Free local storage and try again.`);
		return false;
	}
	appData = nextData;
	setNotice("", false);
	return true;
}

function makeId(prefix) {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function addDays(dateOnly, days) {
	const date = new Date(`${dateOnly}T00:00:00.000Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

function plannedEndDate(record) {
	if (!isValidDateOnly(record.startDate) || !Number.isInteger(record.durationDays)) return "";
	return addDays(record.startDate, record.durationDays - 1);
}

function updatePlannedEndDate() {
	const startDate = ui.startDate.value;
	const durationDays = Number(ui.duration.value);
	if (!isValidDateOnly(startDate) || !Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
		ui.plannedEnd.textContent = "Planned end date: enter a valid start date and a duration from 1 to 3,650 days.";
		return;
	}
	ui.plannedEnd.textContent = `Planned end date: ${formatDate(plannedEndDate({ startDate, durationDays }))} (prescribed duration; not an estimated recovery date)`;
}

function formatDate(value) {
	if (!isValidDateOnly(value)) return "Not provided";
	const [year, month, day] = value.split("-").map(Number);
	return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
		.format(new Date(Date.UTC(year, month - 1, day)));
}

function formatDateTime(value) {
	return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getSelectedRecord() {
	return appData.records.find(record => record.id === selectedRecordId) || null;
}

function renderRecords() {
	const currentSelection = selectedRecordId;
	ui.planSelect.replaceChildren(new Option("Create or select an animal record", ""));
	appData.records.forEach(record => {
		const option = new Option(`${record.petName} (${record.species === "cat" ? "Cat" : "Dog"})`, record.id);
		ui.planSelect.add(option);
	});
	ui.planSelect.value = currentSelection && appData.records.some(record => record.id === currentSelection)
		? currentSelection
		: "";
	selectedRecordId = ui.planSelect.value || null;
}

function loadSelectedPlan() {
	const record = getSelectedRecord();
	ui.form.reset();
	ui.journalForm.reset();
	editingObservationId = null;
	ui.journalForm.querySelector('button[type="submit"]').textContent = "Save observation";
	ui.nextPhotoReminder.value = "";
	ui.planSelect.value = record?.id || "";
	if (!record) {
		ui.species.value = "cat";
		ui.eventForm.reset();
		ui.observationDate.value = localDateString(new Date());
		updatePlannedEndDate();
		setPlanEditing(true);
		renderEventHistory(null);
		renderObservationHistory(null);
		return;
	}
	ui.petName.value = record.petName;
	ui.species.value = record.species;
	ui.condition.value = record.condition;
	ui.medicine.value = record.medicine;
	ui.startDate.value = record.startDate;
	ui.frequency.value = record.frequency;
	ui.duration.value = record.durationDays ? String(record.durationDays) : "";
	ui.followUp.value = record.followUpDate;
	ui.nextPhotoReminder.value = record.nextPhotoReminder || "";
	ui.eventForm.reset();
	ui.observationDate.value = localDateString(new Date());
	updatePlannedEndDate();
	setPlanEditing(false);
	renderEventHistory(record);
	renderObservationHistory(record);
}

function setPlanEditing(isEditing) {
	editingPlan = isEditing;
	ui.form.querySelectorAll("input[name], select[name]").forEach(field => {
		field.disabled = !isEditing;
	});
	ui.savePlan.hidden = !isEditing;
	ui.savePlan.textContent = selectedRecordId ? "Save pet record" : "Create pet progress record";
	ui.editPlan.hidden = !selectedRecordId || isEditing;
	ui.deletePlan.hidden = !selectedRecordId;
	ui.eventForm.querySelectorAll("input, button").forEach(field => {
		field.disabled = !selectedRecordId || !getSelectedRecord()?.startDate;
	});
}

function startNewTreatmentPlan() {
	if (editingPlan && ui.petName.value.trim() && !window.confirm("Discard unsaved treatment-plan changes and create a new record?")) {
		return;
	}
	selectedRecordId = null;
	renderRecords();
	loadSelectedPlan();
	renderTreatmentSummary();
	ui.petName.focus();
}

function getFormRecord(existingRecord) {
	const formValues = new FormData(ui.form);
	const record = {
		id: existingRecord?.id || makeId("pet"),
		petName: String(formValues.get("petName") || "").trim(),
		species: String(formValues.get("species") || ""),
		condition: String(formValues.get("condition") || "").trim(),
		medicine: String(formValues.get("medicine") || "").trim(),
		startDate: String(formValues.get("startDate") || ""),
		frequency: String(formValues.get("frequency") || "").trim(),
		durationDays: String(formValues.get("durationDays") || "").trim()
			? Number(formValues.get("durationDays"))
			: null,
		followUpDate: String(formValues.get("followUpDate") || ""),
		nextPhotoReminder: existingRecord?.nextPhotoReminder || "",
		events: existingRecord?.events || [],
		observations: existingRecord?.observations || [],
		updatedAt: new Date().toISOString()
	};
	if (!isNonEmptyString(record.petName, 80) || !["cat", "dog"].includes(record.species)) {
		throw new Error("Enter a pet name or identifier and select Cat or Dog.");
	}
	const hasAnyPlanDetail = Boolean(record.startDate || record.frequency || record.durationDays !== null);
	const hasCompletePlan = Boolean(record.startDate && record.frequency && record.durationDays !== null);
	if (hasAnyPlanDetail && !hasCompletePlan) {
		throw new Error("To save treatment details, enter the start date, veterinarian-prescribed frequency, and duration together. Otherwise, leave treatment fields blank.");
	}
	if (hasCompletePlan && (!isValidDateOnly(record.startDate) || !isNonEmptyString(record.frequency, 100) ||
		!Number.isInteger(record.durationDays) || record.durationDays < 1 || record.durationDays > 3650)) {
		throw new Error("Enter a valid veterinarian-provided start date and frequency, and a duration from 1 to 3,650 days.");
	}
	if (record.followUpDate && !isValidDateOnly(record.followUpDate)) {
		throw new Error("Enter a valid veterinary follow-up date.");
	}
	if (record.followUpDate && record.startDate && record.followUpDate < record.startDate) {
		throw new Error("The follow-up date cannot be earlier than the treatment start date.");
	}
	const endDate = hasCompletePlan ? plannedEndDate(record) : "";
	if (record.events.length && !hasCompletePlan) {
		throw new Error("A saved treatment schedule requires a complete veterinarian-provided treatment plan.");
	}
	if (record.events.some(item => item.dueAt.slice(0, 10) < record.startDate || item.dueAt.slice(0, 10) > endDate)) {
		throw new Error("The updated treatment dates would exclude a saved schedule event. Adjust or delete the affected event first.");
	}
	return record;
}

function saveTreatmentPlan(event) {
	event.preventDefault();
	if (!editingPlan) return;
	const existingRecord = getSelectedRecord();
	let record;
	try {
		record = getFormRecord(existingRecord);
	} catch (error) {
		setNotice(error.message);
		return;
	}
	const nextRecords = [...appData.records];
	const existingIndex = nextRecords.findIndex(item => item.id === record.id);
	if (existingIndex >= 0) nextRecords[existingIndex] = record;
	else {
		if (nextRecords.length >= MAX_RECORDS) {
			setNotice(`A maximum of ${MAX_RECORDS} pet treatment records can be stored in this browser.`);
			return;
		}
		nextRecords.push(record);
	}
	if (!commitRecords({ version: 1, records: nextRecords })) return;
	selectedRecordId = record.id;
	renderRecords();
	loadSelectedPlan();
	renderTreatmentSummary();
}

function deleteTreatmentPlan() {
	const record = getSelectedRecord();
	if (!record || !window.confirm(`Delete the treatment record for ${record.petName}, including its treatment history and progress journal? This cannot be undone.`)) {
		return;
	}
	const nextRecords = appData.records.filter(item => item.id !== record.id);
	if (!commitRecords({ version: 1, records: nextRecords })) return;
	selectedRecordId = nextRecords[0]?.id || null;
	renderRecords();
	loadSelectedPlan();
	renderTreatmentSummary();
}

function adherenceStats(record) {
	const now = Date.now();
	const dueEvents = record.events.filter(item => Date.parse(item.dueAt) <= now);
	const completed = dueEvents.filter(item => item.status === "completed").length;
	const missed = dueEvents.filter(item => item.status === "missed").length;
	const denominator = completed + missed;
	return {
		scheduled: record.events.length,
		completed,
		missed,
		pending: record.events.length - completed - missed,
		dueWithOutcome: denominator,
		percentage: denominator === 0 ? null : completed / denominator * 100
	};
}

function renderTreatmentSummary() {
	const record = getSelectedRecord();
	ui.adherence.replaceChildren();
	if (!record) {
		ui.selectedSummary.textContent = "Create or select a pet treatment record to begin.";
		ui.latestProgress.textContent = "No progress records yet";
		ui.initialImprovement.textContent = "No verified range available";
		ui.completeResolution.textContent = "No verified range available";
		ui.recoveryDate.textContent = "Unavailable";
		ui.evidenceStatus.textContent = "Insufficient evidence to estimate recovery.";
		ui.followUpSummary.textContent = "Use the date provided by your veterinarian.";
		ui.adherentScenario.textContent = "Save a treatment record to review its recorded adherence and evidence status.";
		ui.missedScenario.textContent = "No treatment record selected.";
		renderStat("Scheduled", "0");
		renderStat("Completed", "0");
		renderStat("Missed", "0");
		renderStat("Pending", "0");
		renderStat("Recorded adherence", "Not available yet");
		renderAnimalDashboard(null);
		renderReminders(null);
		renderComparison(null);
		return;
	}
	const stats = adherenceStats(record);
	const species = record.species === "cat" ? "Cat" : "Dog";
	const planSummary = record.startDate
		? `${record.medicine || "No medicine recorded"} · ${record.frequency} · ${record.durationDays} day(s) prescribed`
		: "No veterinarian-provided treatment plan recorded";
	ui.selectedSummary.textContent = `${record.petName} · ${species}${record.condition ? ` · ${record.condition}` : ""} · ${planSummary}`;
	renderStat("Scheduled", String(stats.scheduled));
	renderStat("Completed", String(stats.completed));
	renderStat("Missed", String(stats.missed));
	renderStat("Pending", String(stats.pending));
	renderStat("Recorded adherence", stats.percentage === null ? "Not available yet" : `${stats.percentage.toFixed(1)}%`);
	ui.latestProgress.textContent = getProgressStatus(record.observations);
	ui.initialImprovement.textContent = "No verified condition-matched range";
	ui.completeResolution.textContent = "No verified condition-matched range";
	ui.recoveryDate.textContent = "Unavailable — not scientifically justified";
	const outlook = getRecoveryOutlook(record);
	ui.initialImprovement.textContent = formatRange(outlook.improvementRangeDays, "No verified condition-matched range");
	ui.completeResolution.textContent = formatRange(outlook.resolutionRangeDays, "No verified condition-matched range");
	ui.recoveryDate.textContent = outlook.estimatedRecoveryDate
		? `${formatDate(outlook.estimatedRecoveryDate)} — estimated, not guaranteed`
		: "Unavailable — not scientifically justified";
	ui.evidenceStatus.textContent = outlook.status === "Insufficient evidence"
		? "Insufficient evidence to estimate recovery."
		: outlook.status;
	ui.followUpSummary.textContent = record.followUpDate
		? formatDate(record.followUpDate)
		: "No follow-up date recorded; use your veterinarian's instructions.";
	const rateText = stats.percentage === null
		? "No completed or missed due events have been recorded, so adherence is not yet calculable."
		: `${stats.percentage.toFixed(1)}% recorded adherence among ${stats.dueWithOutcome} due events with a completed or missed status; pending events are excluded.`;
	ui.adherentScenario.textContent = record.startDate
		? `${record.petName}'s recorded plan: ${record.medicine || "No medicine name recorded"}; ${record.frequency}; prescribed duration ${record.durationDays} day(s). ${rateText} Recorded adherence and observations do not establish healing.`
		: `${record.petName} has a progress-only record and no treatment plan entered. ${rateText}`;
	ui.missedScenario.textContent = stats.missed
		? `${stats.missed} missed treatment event(s) recorded. ${rateText} ${outlook.missedTreatmentMessage}`
		: `No missed treatment events are currently recorded. ${rateText} A zero recorded miss count is not a prediction of recovery.`;
	renderEventHistory(record);
	renderObservationHistory(record);
	renderAnimalDashboard(record);
	renderReminders(record);
	renderComparison(record);
}

function renderAnimalDashboard(record) {
	if (!record) {
		ui.dashboardPetName.textContent = "No animal selected";
		ui.dashboardSpecies.textContent = "Create a pet progress record to get started.";
		ui.dashboardScreeningDate.textContent = "Initial screening: Not recorded";
		ui.dashboardTreatmentStart.textContent = "Treatment start: Not recorded";
		ui.dashboardFollowUp.textContent = "Veterinary follow-up: Not recorded";
		ui.dashboardPattern.textContent = "Not available";
		ui.dashboardProgressStatus.textContent = "Insufficient information to assess visible progress reliably.";
		ui.dashboardNotes.textContent = "No observations recorded.";
		setDashboardPhoto(ui.dashboardInitialPhoto, ui.dashboardInitialPhotoDate, null, "No baseline photo recorded");
		setDashboardPhoto(ui.dashboardLatestPhoto, ui.dashboardLatestPhotoDate, null, "No progress photo recorded");
		return;
	}
	const observations = [...record.observations].sort(compareObservations);
	const photoObservations = observations.filter(observation => observation.photo);
	const firstScreening = observations.find(observation => observation.source === "screening");
	const screeningObservations = observations.filter(observation => observation.predictedCategory);
	const latestScreening = screeningObservations[screeningObservations.length - 1];
	const latest = observations[observations.length - 1];
	const latestPhoto = photoObservations[photoObservations.length - 1];
	ui.dashboardPetName.textContent = record.petName;
	ui.dashboardSpecies.textContent = record.species === "cat" ? "Cat" : "Dog";
	ui.dashboardScreeningDate.textContent = `Initial screening: ${firstScreening ? formatDate(firstScreening.date) : "Not recorded"}`;
	ui.dashboardTreatmentStart.textContent = `Treatment start: ${record.startDate ? formatDate(record.startDate) : "Not recorded"}`;
	ui.dashboardFollowUp.textContent = `Veterinary follow-up: ${record.followUpDate ? formatDate(record.followUpDate) : "Not recorded"}`;
	ui.dashboardPattern.textContent = latestScreening?.predictedCategory
		? `${latestScreening.predictedCategory} (model-generated visible-pattern score; not a diagnosis)`
		: "Not available";
	ui.dashboardProgressStatus.textContent = getProgressStatus(record.observations);
	ui.dashboardNotes.textContent = latest?.notes || "No observations recorded.";
	setDashboardPhoto(
		ui.dashboardInitialPhoto,
		ui.dashboardInitialPhotoDate,
		firstScreening?.photo || photoObservations[0]?.photo,
		firstScreening ? `Screening baseline · ${formatDate(firstScreening.date)}` : photoObservations[0] ? `Earliest photo · ${formatDate(photoObservations[0].date)}` : "No baseline photo recorded"
	);
	setDashboardPhoto(
		ui.dashboardLatestPhoto,
		ui.dashboardLatestPhotoDate,
		latestPhoto?.photo,
		latestPhoto ? `Latest photo · ${formatDate(latestPhoto.date)}` : "No progress photo recorded"
	);
}

function setDashboardPhoto(image, caption, source, text) {
	image.hidden = !source;
	if (source) image.src = source;
	else image.removeAttribute("src");
	caption.textContent = text;
}

function compareObservations(first, second) {
	return first.date.localeCompare(second.date) ||
		(first.capturedAt || "").localeCompare(second.capturedAt || "");
}

function renderReminders(record) {
	ui.reminderList.replaceChildren();
	if (!record) {
		ui.reminderList.append(makeEmptyItem("Create or select an animal record to add reminders."));
		ui.reminderForm.querySelector("button").disabled = true;
		return;
	}
	ui.reminderForm.querySelector("button").disabled = false;
	const reminders = [];
	if (record.nextPhotoReminder && Date.parse(record.nextPhotoReminder) >= Date.now()) {
		reminders.push({ at: record.nextPhotoReminder, label: "Progress photo reminder" });
	}
	if (record.followUpDate && record.followUpDate >= localDateString(new Date())) {
		reminders.push({ at: `${record.followUpDate}T00:00`, dateOnly: true, label: "Veterinary follow-up" });
	}
	record.events.filter(item => item.status === "pending" && Date.parse(item.dueAt) >= Date.now())
		.forEach(item => reminders.push({ at: item.dueAt, label: "Scheduled treatment" }));
	reminders.sort((first, second) => Date.parse(first.at) - Date.parse(second.at));
	if (!reminders.length) {
		ui.reminderList.append(makeEmptyItem("No upcoming reminders recorded."));
		return;
	}
	reminders.slice(0, 15).forEach(reminder => {
		const item = document.createElement("li");
		item.className = "record-item";
		const info = document.createElement("div");
		info.className = "record-item-info";
		const title = document.createElement("strong");
		title.textContent = reminder.label;
		const date = document.createElement("span");
		date.textContent = reminder.dateOnly ? formatDate(reminder.at.slice(0, 10)) : formatDateTime(reminder.at);
		info.append(title, date);
		item.append(info);
		ui.reminderList.append(item);
	});
}

function savePhotoReminder(event) {
	event.preventDefault();
	const record = getSelectedRecord();
	if (!record) {
		setNotice("Create or select an animal record before saving a reminder.");
		return;
	}
	const reminder = ui.nextPhotoReminder.value;
	if (reminder && (!Number.isFinite(Date.parse(reminder)) || Date.parse(reminder) < Date.now())) {
		setNotice("Choose a future date and time for the progress-photo reminder, or leave it blank to remove it.");
		return;
	}
	if (replaceRecord({ ...record, nextPhotoReminder: reminder, updatedAt: new Date().toISOString() })) {
		renderTreatmentSummary();
	}
}

function renderComparison(record) {
	const photos = record
		? [...record.observations].filter(observation => observation.photo).sort(compareObservations)
		: [];
	const previousFirst = ui.comparisonFirst.value;
	const previousSecond = ui.comparisonSecond.value;
	ui.comparisonFirst.replaceChildren();
	ui.comparisonSecond.replaceChildren();
	if (photos.length < 2) {
		const optionText = photos.length ? `${formatDate(photos[0].date)} · saved photo` : "No photos available";
		ui.comparisonFirst.add(new Option(optionText, photos[0]?.id || ""));
		ui.comparisonSecond.add(new Option(optionText, photos[0]?.id || ""));
		ui.comparisonFirst.disabled = true;
		ui.comparisonSecond.disabled = true;
		ui.comparisonEmpty.hidden = false;
		ui.comparisonEmpty.textContent = photos.length
			? "Add a second saved photo to compare changes over time."
			: "Add progress photos to compare two entries.";
		ui.comparisonImages.hidden = true;
		return;
	}
	photos.forEach((photo, index) => {
		const label = `${formatDate(photo.date)}${photo.source === "screening" ? " · AI screening" : ` · Photo ${index + 1}`}`;
		ui.comparisonFirst.add(new Option(label, photo.id));
		ui.comparisonSecond.add(new Option(label, photo.id));
	});
	ui.comparisonFirst.disabled = false;
	ui.comparisonSecond.disabled = false;
	ui.comparisonFirst.value = photos.some(photo => photo.id === previousFirst) ? previousFirst : photos[0].id;
	ui.comparisonSecond.value = photos.some(photo => photo.id === previousSecond) ? previousSecond : photos[photos.length - 1].id;
	const earlier = photos.find(photo => photo.id === ui.comparisonFirst.value);
	const later = photos.find(photo => photo.id === ui.comparisonSecond.value);
	ui.comparisonEmpty.hidden = true;
	ui.comparisonImages.hidden = !earlier || !later;
	if (!earlier || !later) return;
	const setComparisonPhoto = (prefix, observation) => {
		$(`${prefix}Date`).textContent = `${observation.source === "screening" ? "Screening baseline" : "Progress photo"} · ${formatDate(observation.date)}`;
		$(`${prefix}Image`).src = observation.photo;
		$(`${prefix}Notes`).textContent = observation.notes || "No notes recorded.";
		$(`${prefix}Scores`).textContent = observation.screeningScores?.length
			? `Model scores: ${observation.screeningScores.map(score => `${score.displayName} ${Math.round(score.probability * 100)}%`).join(" · ")}`
			: observation.predictedCategory
				? `Top model-predicted visible pattern: ${observation.predictedCategory} (not a diagnosis).`
				: "No AI screening scores are attached to this photo.";
	};
	setComparisonPhoto("comparisonFirst", earlier);
	setComparisonPhoto("comparisonSecond", later);
}

function renderStat(label, value) {
	const card = document.createElement("div");
	const caption = document.createElement("span");
	const metric = document.createElement("strong");
	caption.textContent = label;
	metric.textContent = value;
	card.append(caption, metric);
	ui.adherence.append(card);
}

function formatRange(range, unavailableText) {
	if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max) {
		return unavailableText;
	}
	return `${range.min}–${range.max} days`;
}

function renderEventHistory(record) {
	ui.eventHistory.replaceChildren();
	if (!record?.events.length) {
		ui.eventHistory.append(makeEmptyItem("No scheduled treatment events recorded."));
		return;
	}
	[...record.events].sort((first, second) => Date.parse(first.dueAt) - Date.parse(second.dueAt)).forEach(event => {
		const item = document.createElement("li");
		item.className = "record-item";
		const eventInfo = document.createElement("div");
		eventInfo.className = "record-item-info";
		const title = document.createElement("strong");
		title.textContent = formatDateTime(event.dueAt);
		const status = document.createElement("span");
		status.textContent = `Current status: ${event.status}`;
		eventInfo.append(title, status);
		const statusSelect = document.createElement("select");
		statusSelect.className = "treatment-input status-select";
		statusSelect.dataset.eventId = event.id;
		[["pending", "Pending"], ["completed", "Completed"], ["missed", "Missed"]].forEach(([value, label]) => {
			statusSelect.add(new Option(label, value));
		});
		statusSelect.value = event.status;
		const updateButton = document.createElement("button");
		updateButton.type = "button";
		updateButton.className = "treatment-button treatment-button-quiet";
		updateButton.dataset.updateEvent = event.id;
		updateButton.textContent = "Update";
		const deleteButton = document.createElement("button");
		deleteButton.type = "button";
		deleteButton.className = "treatment-button treatment-button-danger";
		deleteButton.dataset.deleteEvent = event.id;
		deleteButton.textContent = "Delete";
		const future = Date.parse(event.dueAt) > Date.now();
		if (future) {
			statusSelect.disabled = true;
			updateButton.disabled = true;
			status.textContent = "Pending (scheduled in the future)";
		}
		item.append(eventInfo, statusSelect, updateButton, deleteButton);
		ui.eventHistory.append(item);
	});
}

function makeEmptyItem(text) {
	const item = document.createElement("li");
	item.className = "record-empty";
	item.textContent = text;
	return item;
}

function addScheduledEvent(event) {
	event.preventDefault();
	const record = getSelectedRecord();
	if (!record) {
		setNotice("Save or select a treatment record before adding a scheduled event.");
		return;
	}
	if (!record.startDate || !record.durationDays || !record.frequency) {
		setNotice("Enter and save the veterinarian-provided start date, frequency, and duration before scheduling treatment events.");
		return;
	}
	const selectedDate = ui.eventDueAt.value;
	const dueTime = Date.parse(selectedDate);
	if (!selectedDate || !Number.isFinite(dueTime)) {
		setNotice("Enter a valid scheduled date and time.");
		return;
	}
	const eventDate = selectedDate.slice(0, 10);
	if (eventDate < record.startDate || eventDate > plannedEndDate(record)) {
		setNotice("Schedule events within the veterinarian-entered treatment start date and planned duration.");
		return;
	}
	if (record.events.length >= MAX_EVENTS) {
		setNotice(`A maximum of ${MAX_EVENTS} scheduled events can be stored for this pet.`);
		return;
	}
	const nextRecord = {
		...record,
		events: [...record.events, { id: makeId("event"), dueAt: selectedDate, status: "pending" }],
		updatedAt: new Date().toISOString()
	};
	if (!replaceRecord(nextRecord)) return;
	ui.eventForm.reset();
	renderTreatmentSummary();
}

function handleEventHistoryClick(event) {
	const updateButton = event.target.closest("[data-update-event]");
	const deleteButton = event.target.closest("[data-delete-event]");
	if (!updateButton && !deleteButton) return;
	const record = getSelectedRecord();
	if (!record) return;
	const eventId = updateButton?.dataset.updateEvent || deleteButton.dataset.deleteEvent;
	const treatmentEvent = record.events.find(item => item.id === eventId);
	if (!treatmentEvent) {
		setNotice("The selected treatment event could not be found. Reload the saved record and try again.");
		return;
	}
	if (deleteButton) {
		if (!window.confirm(`Delete the scheduled event for ${formatDateTime(treatmentEvent.dueAt)}?`)) return;
		const nextRecord = { ...record, events: record.events.filter(item => item.id !== eventId), updatedAt: new Date().toISOString() };
		if (replaceRecord(nextRecord)) renderTreatmentSummary();
		return;
	}
	const statusSelect = ui.eventHistory.querySelector(`select[data-event-id="${CSS.escape(eventId)}"]`);
	if (!statusSelect) {
		setNotice("The selected treatment event could not be found. Reload the saved record and try again.");
		return;
	}
	if (Date.parse(treatmentEvent.dueAt) > Date.now() && statusSelect.value !== "pending") {
		setNotice("A future treatment event cannot be marked completed or missed before its scheduled time.");
		return;
	}
	const nextRecord = {
		...record,
		events: record.events.map(item => item.id === eventId ? { ...item, status: statusSelect.value } : item),
		updatedAt: new Date().toISOString()
	};
	if (replaceRecord(nextRecord)) renderTreatmentSummary();
}

function replaceRecord(updatedRecord) {
	const records = appData.records.map(record => record.id === updatedRecord.id ? updatedRecord : record);
	if (!records.some(record => record.id === updatedRecord.id)) {
		setNotice("The selected pet record no longer exists. Select it again before making changes.");
		return false;
	}
	return commitRecords({ version: 1, records });
}

async function saveObservation(event) {
	event.preventDefault();
	const record = getSelectedRecord();
	if (!record) {
		setNotice("Save or select a treatment record before adding a progress observation.");
		return;
	}
	const observationDate = ui.observationDate.value;
	if (!isValidDateOnly(observationDate) || observationDate > localDateString(new Date())) {
		setNotice("Enter a valid observation date that is not in the future.");
		return;
	}
	if (!editingObservationId && record.observations.length >= MAX_OBSERVATIONS) {
		setNotice(`A maximum of ${MAX_OBSERVATIONS} observations can be stored for this pet.`);
		return;
	}
	let photo = "";
	const file = ui.progressPhoto.files?.[0];
	if (file) {
		if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_PHOTO_BYTES) {
			setNotice("Choose a JPG, PNG, or WEBP follow-up photo no larger than 512 KB.");
			return;
		}
		try {
			photo = await readFileAsDataUrl(file);
		} catch {
			setNotice("The follow-up photo could not be read. Try another image.");
			return;
		}
	}
	const previousObservation = record.observations.find(item => item.id === editingObservationId);
	const observation = {
		id: editingObservationId || makeId("observation"),
		date: observationDate,
		overallStatus: ui.overallStatus.value,
		redness: ui.redness.value,
		hairLoss: ui.hairLoss.value,
		scaling: ui.scaling.value,
		itching: ui.itching.value.trim(),
		notes: ui.progressNotes.value.trim(),
		photo: photo || previousObservation?.photo || "",
		source: previousObservation?.source || "manual",
		...(previousObservation?.predictedCategory ? { predictedCategory: previousObservation.predictedCategory } : {}),
		...(previousObservation?.screeningScores ? { screeningScores: previousObservation.screeningScores } : {}),
		...(previousObservation?.modelUrl ? { modelUrl: previousObservation.modelUrl } : {}),
		...(previousObservation?.capturedAt ? { capturedAt: previousObservation.capturedAt } : {})
	};
	const nextRecord = {
		...record,
		observations: editingObservationId
			? record.observations.map(item => item.id === editingObservationId ? observation : item)
			: [...record.observations, observation],
		updatedAt: new Date().toISOString()
	};
	if (!replaceRecord(nextRecord)) return;
	editingObservationId = null;
	ui.journalForm.querySelector('button[type="submit"]').textContent = "Save observation";
	ui.journalForm.reset();
	ui.observationDate.value = localDateString(new Date());
	renderTreatmentSummary();
}

function handleObservationHistoryClick(event) {
	const editButton = event.target.closest("[data-edit-observation]");
	const deleteButton = event.target.closest("[data-delete-observation]");
	if (!editButton && !deleteButton) return;
	const record = getSelectedRecord();
	if (!record) return;
	const observationId = editButton?.dataset.editObservation || deleteButton.dataset.deleteObservation;
	const observation = record.observations.find(item => item.id === observationId);
	if (!observation) {
		setNotice("The selected observation could not be found. Reload the saved record and try again.");
		return;
	}
	if (deleteButton) {
		if (!window.confirm(`Delete the progress observation from ${formatDate(observation.date)}?`)) return;
		const nextRecord = { ...record, observations: record.observations.filter(item => item.id !== observationId), updatedAt: new Date().toISOString() };
		if (replaceRecord(nextRecord)) {
			if (editingObservationId === observationId) {
				editingObservationId = null;
				ui.journalForm.reset();
				ui.journalForm.querySelector('button[type="submit"]').textContent = "Save observation";
			}
			renderTreatmentSummary();
		}
		return;
	}
	editingObservationId = observation.id;
	ui.observationDate.value = observation.date;
	ui.overallStatus.value = observation.overallStatus || "insufficient";
	ui.redness.value = observation.redness;
	ui.hairLoss.value = observation.hairLoss;
	ui.scaling.value = observation.scaling;
	ui.itching.value = observation.itching;
	ui.progressNotes.value = observation.notes;
	ui.journalForm.querySelector('button[type="submit"]').textContent = "Save observation changes";
	ui.observationDate.focus();
}

function readFileAsDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid photo data."));
		reader.onerror = () => reject(reader.error || new Error("Photo read failed."));
		reader.readAsDataURL(file);
	});
}

function getProgressStatus(observations) {
	if (!observations.length) return "Insufficient information to assess visible progress reliably.";
	const latest = observations.reduce((current, observation) =>
		observation.date >= current.date ? observation : current
	);
	if (latest.overallStatus) {
		return {
			insufficient: "Insufficient information to assess visible progress reliably.",
			improving: "Owner recorded visible improvement; this is not a diagnosis or recovery assessment.",
			unchanged: "Owner recorded no significant visible change.",
			worsening: "Owner recorded worsening; contact a veterinarian promptly.",
			"needs-vet": "Needs veterinary assessment."
		}[latest.overallStatus];
	}
	const assessed = [latest.redness, latest.hairLoss, latest.scaling].filter(status => status !== "not-assessed");
	if (!assessed.length) return "Insufficient information";
	if (assessed.includes("worse")) return "Worsening";
	if (assessed.every(status => status === "improved")) return "Improving";
	if (assessed.every(status => status === "unchanged")) return "Unchanged";
	return "Insufficient information";
}

function consumeScreeningHandoff() {
	if (window.location.hash !== "#treatment") return;
	let serialized;
	try {
		serialized = window.sessionStorage.getItem("dermapaw-screening-handoff-v1");
	} catch (error) {
		setNotice(`The screening result could not be read from this browser session: ${error.message || "session storage is unavailable"}.`);
		return;
	}
	if (!serialized) return;
	let screening;
	try {
		screening = JSON.parse(serialized);
		if (!screening || !isNonEmptyString(screening.petName, 80) ||
			!["cat", "dog"].includes(screening.species) ||
			!Number.isFinite(Date.parse(screening.at)) ||
			!isNonEmptyString(screening.predictedCategory, 120) ||
			!Array.isArray(screening.scores) || !screening.scores.length || screening.scores.length > 20 ||
			!screening.scores.every(score => score && isNonEmptyString(score.className, 120) &&
				isNonEmptyString(score.displayName, 120) && Number.isFinite(score.probability) &&
				score.probability >= 0 && score.probability <= 1) ||
			typeof screening.photo !== "string" || screening.photo.length > 1_000_000 ||
			!/^data:image\/jpeg;base64,/.test(screening.photo)) {
			throw new Error("The saved screening handoff is incomplete or invalid.");
		}
	} catch (error) {
		setNotice(`The screening result was not added to the animal record: ${error.message}`);
		try {
			window.sessionStorage.removeItem("dermapaw-screening-handoff-v1");
		} catch {
			setNotice("The screening result could not be added or cleared from this browser session.");
		}
		return;
	}
	const normalizedName = screening.petName.trim().toLocaleLowerCase();
	const currentRecord = appData.records.find(record =>
		record.species === screening.species && record.petName.trim().toLocaleLowerCase() === normalizedName
	);
	if (!currentRecord && appData.records.length >= MAX_RECORDS) {
		setNotice(`The screening result was not added because this browser already has the maximum of ${MAX_RECORDS} animal records.`);
		return;
	}
	const observationDate = localDateString(new Date(screening.at));
	const duplicate = currentRecord?.observations.some(item => item.capturedAt === screening.at);
	if (duplicate) {
		try {
			window.sessionStorage.removeItem("dermapaw-screening-handoff-v1");
		} catch (error) {
			setNotice(`The screening was already recorded, but the temporary handoff could not be cleared: ${error.message || "session storage is unavailable"}.`);
		}
		selectedRecordId = currentRecord.id;
		renderRecords();
		loadSelectedPlan();
		renderTreatmentSummary();
		return;
	}
	if (currentRecord && currentRecord.observations.length >= MAX_OBSERVATIONS) {
		setNotice(`The screening result was not added because ${screening.petName} already has the maximum of ${MAX_OBSERVATIONS} saved observations.`);
		return;
	}
	const observation = {
		id: makeId("screening"),
		date: observationDate,
		capturedAt: screening.at,
		overallStatus: "insufficient",
		redness: "not-assessed",
		hairLoss: "not-assessed",
		scaling: "not-assessed",
		itching: "",
		notes: `Initial AI screening: ${screening.predictedCategory}. The model result is an image-classification score, not a veterinary diagnosis.`,
		photo: screening.photo,
		source: "screening",
		predictedCategory: screening.predictedCategory,
		screeningScores: screening.scores,
		modelUrl: screening.modelUrl
	};
	const record = currentRecord || {
		id: makeId("pet"),
		petName: screening.petName.trim(),
		species: screening.species,
		condition: "",
		medicine: "",
		startDate: "",
		frequency: "",
		durationDays: null,
		followUpDate: "",
		nextPhotoReminder: "",
		events: [],
		observations: [],
		updatedAt: new Date().toISOString()
	};
	const updatedRecord = {
		...record,
		observations: [...record.observations, observation],
		updatedAt: new Date().toISOString()
	};
	const records = currentRecord
		? appData.records.map(item => item.id === currentRecord.id ? updatedRecord : item)
		: [...appData.records, updatedRecord];
	if (!commitRecords({ version: 1, records })) return;
	try {
		window.sessionStorage.removeItem("dermapaw-screening-handoff-v1");
	} catch (error) {
		setNotice(`The screening was saved, but its temporary handoff could not be cleared: ${error.message || "session storage is unavailable"}.`);
	}
	selectedRecordId = updatedRecord.id;
	renderRecords();
	loadSelectedPlan();
	renderTreatmentSummary();
	setNotice(`The actual screening result and a local photo baseline were added to ${updatedRecord.petName}'s progress record.`);
}

function renderObservationHistory(record) {
	ui.progressHistory.replaceChildren();
	if (!record?.observations.length) {
		ui.progressHistory.append(makeEmptyItem("No progress observations recorded."));
		return;
	}
	[...record.observations].sort(compareObservations).forEach(observation => {
		const item = document.createElement("li");
		item.className = "record-item observation-item";
		const details = document.createElement("div");
		details.className = "record-item-info";
		const title = document.createElement("strong");
		title.textContent = formatDate(observation.date);
		const summary = document.createElement("span");
		summary.textContent = `Redness: ${labelStatus(observation.redness)} · Hair loss: ${labelStatus(observation.hairLoss)} · Scabs/scaling: ${labelStatus(observation.scaling)}`;
		details.append(title, summary);
		if (observation.itching) {
			const itch = document.createElement("p");
			itch.textContent = `Itching/discomfort: ${observation.itching}`;
			details.append(itch);
		}
		if (observation.notes) {
			const notes = document.createElement("p");
			notes.textContent = observation.notes;
			details.append(notes);
		}
		if (observation.predictedCategory) {
			const prediction = document.createElement("p");
			prediction.textContent = `Model-predicted visible skin pattern: ${observation.predictedCategory} (not a veterinary diagnosis).`;
			details.append(prediction);
		}
		item.append(details);
		if (observation.photo) {
			const image = document.createElement("img");
			image.className = "observation-photo";
			image.src = observation.photo;
			image.alt = `Owner-recorded skin progress on ${formatDate(observation.date)}`;
			item.append(image);
		}
		const actions = document.createElement("div");
		actions.className = "record-actions";
		const editButton = document.createElement("button");
		editButton.type = "button";
		editButton.className = "treatment-button treatment-button-quiet";
		editButton.dataset.editObservation = observation.id;
		editButton.textContent = "Edit";
		const deleteButton = document.createElement("button");
		deleteButton.type = "button";
		deleteButton.className = "treatment-button treatment-button-danger";
		deleteButton.dataset.deleteObservation = observation.id;
		deleteButton.textContent = "Delete";
		actions.append(editButton, deleteButton);
		item.append(actions);
		ui.progressHistory.append(item);
	});
}

function labelStatus(status) {
	return {
		"not-assessed": "not assessed",
		improved: "improved",
		unchanged: "unchanged",
		worse: "worse"
	}[status] || "not assessed";
}

function renderEvidenceSources() {
	ui.evidenceSources.replaceChildren();
	RECOVERY_EVIDENCE.forEach(source => {
		const entry = document.createElement("article");
		entry.className = "evidence-entry";
		const button = document.createElement("button");
		button.type = "button";
		button.className = "evidence-toggle";
		button.setAttribute("aria-expanded", "false");
		button.textContent = `View Evidence: ${source.title} (${source.year})`;
		const details = document.createElement("div");
		details.className = "evidence-details";
		details.hidden = true;
		const metadata = [
			`Relevant condition and species: ${source.condition}; ${source.species.map(value => value === "cat" ? "cats" : "dogs").join(" and ")}.`,
			`Population or study context: ${source.populationContext}`,
			`Treatment context: ${source.treatmentContext}`,
			`Reported outcome: ${source.reportedOutcome}`,
			`Reported time range: no time-to-improvement or time-to-resolution range is used by this app.`,
			`Limitations and applicability: ${source.limitations}`,
			`Evidence quality note: ${source.evidenceQualityNotes}`,
			`Treatment adherence evaluated: ${source.evaluatesTreatmentAdherence ? "yes" : "no"}.`,
			`Missed-treatment adjustment supported: ${source.supportsMissedTreatmentAdjustment ? "yes" : "no"}.`
		];
		metadata.forEach(text => {
			const paragraph = document.createElement("p");
			paragraph.textContent = text;
			details.append(paragraph);
		});
		const link = document.createElement("a");
		link.href = source.url;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		link.textContent = source.url;
		details.append(link);
		button.addEventListener("click", () => {
			details.hidden = !details.hidden;
			button.setAttribute("aria-expanded", String(!details.hidden));
		});
		entry.append(button, details);
		ui.evidenceSources.append(entry);
	});
}
