const MODEL_URL = "https://teachablemachine.withgoogle.com/models/n1XfBcG2q/";
const SPECIES_SUPPORT = Object.freeze({
	UNKNOWN_NOT_VERIFIED: "unknown-not-verified",
	DOGS_VERIFIED: "dogs-verified",
	CATS_VERIFIED: "cats-verified",
	DOGS_AND_CATS_VERIFIED: "dogs-and-cats-verified"
});
// Change this only after the training dataset and separate validation tests establish support.
const MODEL_SPECIES_SUPPORT = SPECIES_SUPPORT.UNKNOWN_NOT_VERIFIED;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const CLASS_INFO = {
	"Redness / Irritation": {
		description: "Redness or irritation-like visible pattern.",
		guidance: "This pattern can have many causes. Prevent scratching if practical and seek veterinary advice, especially if it is painful, spreading, swollen, or persistent."
	},
	"Hair Loss / Alopecia": {
		description: "Thinning or loss of fur-like visible pattern.",
		guidance: "Hair loss has many possible causes. A veterinarian can examine the skin and decide whether further assessment is needed."
	},
	"Scabs / Scaling": {
		description: "Crusting, flaking, or scaling-like visible pattern.",
		guidance: "Avoid picking scabs or applying human products. Seek veterinary advice, especially for bleeding, discharge, discomfort, or worsening skin."
	},
	"No Obvious Skin Concern": {
		description: "No obvious concern was detected in this image by the model.",
		guidance: "This result does not rule out a problem. Contact a veterinarian if symptoms or behavior changes are present."
	}
};
const CLASS_LABEL_ALIASES = {
	"redness / irritation": "Redness / Irritation",
	"hair loss / alopecia": "Hair Loss / Alopecia",
	"scabs / scaling": "Scabs / Scaling",
	"scabs / scalling": "Scabs / Scaling",
	"no obvious skin concern": "No Obvious Skin Concern"
};
const CARE_GUIDE_ICONS = {
	"Redness / Irritation": "◉",
	"Hair Loss / Alopecia": "⌁",
	"Scabs / Scaling": "✧",
	"No Obvious Skin Concern": "♡"
};
const CARE_GUIDES = {
	"Redness / Irritation": {
		causes: "Possible causes include allergies, parasites, infection, contact irritation, or injury. These are possibilities, not a diagnosis; a photo cannot distinguish them, and a veterinary examination may be needed.",
		homeCare: "While arranging advice, low-risk observation is reasonable if your pet is comfortable: avoid rubbing the area, keep the pet from causing further trauma if this can be done without distress, and record changes. Do not apply products to the skin unless a veterinarian says to.",
		firstActions: ["Take a clear photo and note when the redness began and whether it is changing.", "Avoid rubbing, scratching, or manipulating the area; prevent self-trauma only if this is safe and comfortable.", "Contact a veterinarian if redness persists, spreads, recurs, or is itchy or uncomfortable."],
		avoid: ["Do not apply human creams, essential oils, disinfectants, or leftover veterinary products.", "Do not give medication or use parasite products without veterinary guidance, especially products not labeled for this species.", "Do not scrub or bandage the area unless a veterinarian instructs you."],
		whenVet: "Arrange veterinary assessment for persistent, spreading, recurrent, itchy, painful, swollen, wet, or infected-looking skin. Seek urgent care for severe pain, rapidly spreading swelling, significant bleeding, or rapid deterioration.",
		options: "After an examination, a veterinarian may check for parasites, infection, injury, or allergic disease and may recommend appropriate tests such as skin cytology, flea combing, or skin scrapings. Management depends on the cause; allergy care may involve a diagnostic work-up and a tailored, sometimes multimodal plan. The image result alone cannot select a treatment.",
		purpose: "Observe the skin without irritating it, record changes, and arrange veterinary assessment when indicated. This checklist is not a treatment plan.",
		supplies: ["A phone or camera for dated progress photos.", "A short note of when the change started and any observed symptoms."],
		precautions: ["Keep handling gentle and stop if your pet is uncomfortable.", "If a veterinarian has given instructions, follow those instructions exactly."],
		checklist: ["Photograph the area in good light without touching or stretching painful skin.", "Record when the redness began and any itching, discomfort, swelling, or discharge.", "Check the area once daily for spreading, wounds, bleeding, or worsening.", "Contact a veterinarian if the change persists, recurs, spreads, or causes discomfort."],
		monitor: ["Extent of redness and any new areas.", "Itching, licking, pain, swelling, discharge, bleeding, and changes in behavior or appetite."],
		vetContact: "Contact a veterinarian for persistent, recurring, spreading, painful, or worsening redness. Severe pain, rapidly spreading swelling, significant bleeding, or rapid deterioration requires urgent veterinary care.",
		sources: ["aaha-allergic-skin-2023", "iscaid-canine-pyoderma-2025"]
	},
	"Hair Loss / Alopecia": {
		causes: "Possible causes include parasites, fungal disease, allergies, excessive licking, or other health conditions. These are possibilities, not a diagnosis; a veterinary examination may be needed to identify the cause.",
		homeCare: "Low-risk observation is appropriate while seeking advice: take dated photos and note the location and spread. Veterinary examination and sometimes diagnostic testing are needed to identify the cause before treatment is selected.",
		firstActions: ["Photograph the area and note whether hair loss is spreading, itchy, scaly, or sore.", "Avoid applying products or starting parasite or fungal treatments without species-appropriate veterinary advice.", "Arrange a veterinary examination for new, spreading, patchy, itchy, or persistent hair loss."],
		avoid: ["Do not assume hair loss is ringworm, allergy, or a hormone problem from the image.", "Do not start antifungal, antibiotic, steroid, parasite, or human medication without veterinary direction.", "Do not shave, pluck, or aggressively brush affected skin."],
		whenVet: "A veterinary appointment is recommended for new, persistent, spreading, patchy, itchy, or inflamed hair loss. Some infectious causes can affect other animals or people, so ask the veterinarian about precautions if infection is suspected.",
		options: "A veterinarian may examine the skin and coat and choose tests based on findings, such as parasite checks, skin cytology or scrapings, or fungal testing. Treatment differs by cause and may include targeted parasite control, infection-specific treatment, or an allergy/endocrine work-up. The image result cannot identify the cause or choose a medicine.",
		purpose: "Document the pattern and arrange assessment so the underlying cause can be identified before treatment.",
		supplies: ["A phone or camera for dated photos.", "Notes about onset, itching, and any recent changes in the pet's routine."],
		precautions: ["Use gentle handling and avoid painful skin.", "If infection is suspected, ask a veterinarian about sensible contact and cleaning precautions rather than self-treating."],
		checklist: ["Photograph the affected area and note its location.", "Record whether the area is growing, itchy, scaly, red, or painful.", "Arrange veterinary assessment for new or persistent hair loss.", "Ask the veterinarian whether diagnostic tests or precautions around other pets or people are needed."],
		monitor: ["Size and location of hairless areas.", "Itching, broken hairs, redness, crusts, odor, wounds, or new affected sites."],
		vetContact: "Seek veterinary assessment for new, spreading, recurrent, or persistent hair loss, particularly if there is itching, inflammation, scaling, or discomfort. Avoid treating a presumed disease without a diagnosis.",
		sources: ["wavd-dermatophytosis-2017", "aaha-allergic-skin-2023"]
	},
	"Scabs / Scaling": {
		causes: "Possible causes include irritation, parasites, fungal or bacterial skin conditions, allergies, or wounds. These are possibilities, not a diagnosis; a veterinary examination may be needed to identify the cause.",
		homeCare: "Avoid disturbing the skin and document changes. Basic observation is the safest interim step; a veterinarian should advise whether cleansing or other care is appropriate for the specific lesion.",
		firstActions: ["Take a dated photo without picking or removing crusts or scales.", "Note any itching, pain, bleeding, discharge, odor, or new lesions.", "Arrange veterinary advice if lesions persist, spread, recur, or are uncomfortable."],
		avoid: ["Do not pick scabs, forcefully remove scales, or scrub the skin.", "Do not apply unapproved chemicals, human creams, essential oils, or leftover medicine.", "Do not cover or clean the area with a product unless a veterinarian recommends it."],
		whenVet: "Have a veterinarian examine persistent, spreading, recurrent, painful, bleeding, wet, smelly, or discharge-producing lesions. Significant bleeding, severe pain, rapidly spreading swelling, or rapid deterioration needs urgent care.",
		options: "Depending on the examination, a veterinarian may perform skin cytology, parasite checks or scrapings, or fungal tests. Treatment is selected for the identified cause; confirmed bacterial or fungal disease may require different, targeted approaches. Do not infer or start these treatments from the image.",
		purpose: "Observe lesions without removing protective crusts and arrange assessment if the skin is not settling or is worsening.",
		supplies: ["A phone or camera for dated photos.", "A note of lesion location, onset, and any observed symptoms."],
		precautions: ["Keep the pet comfortable and avoid touching painful lesions.", "Follow only care directions given by the pet's veterinarian."],
		checklist: ["Photograph the lesions without touching or removing crusts.", "Record whether there is itching, pain, bleeding, discharge, odor, or spread.", "Avoid applying products and arrange veterinary advice for persistent or worsening lesions.", "Contact a veterinarian promptly if the pet becomes uncomfortable or the area changes quickly."],
		monitor: ["Number and size of scabs or scaly areas.", "Bleeding, discharge, odor, swelling, pain, itching, and new lesions."],
		vetContact: "Veterinary examination is recommended for persistent, spreading, recurrent, painful, bleeding, or discharge-producing lesions. Seek urgent care for severe pain, significant bleeding, rapidly spreading swelling, or rapid deterioration.",
		sources: ["wavd-dermatophytosis-2017", "iscaid-canine-pyoderma-2025", "aaha-allergic-skin-2023"]
	},
	"No Obvious Skin Concern": {
		causes: "The model did not identify a strong visible pattern in its other categories in this image. This does not rule out a skin problem. If signs persist or your pet seems uncomfortable, a veterinary examination may be needed.",
		homeCare: "If your pet is comfortable and you have no concerns, routine observation is reasonable. There is no image-based reason to start treatment. Seek veterinary advice if symptoms continue or you notice a change.",
		firstActions: ["Observe your pet's skin and behavior during normal care; do not repeatedly handle or irritate the area.", "If you notice symptoms, record when they started and take a clear photo.", "Arrange veterinary assessment for persistent itching, hair loss, wounds, discomfort, or other concerning signs."],
		avoid: ["Do not interpret this result as a clean bill of health.", "Do not start medication or apply products to prevent a condition that has not been diagnosed.", "Do not delay veterinary care when symptoms are present just because the model score was low."],
		whenVet: "Contact a veterinarian if you notice persistent itching, hair loss, wounds, discomfort, redness, scabs, or changes in behavior or appetite. A normal-looking image cannot rule out a skin or other health problem.",
		options: "If symptoms are present, a veterinarian can examine the pet and decide whether tests or treatment are needed. The possible options depend on examination findings and the cause; this model output does not support a treatment recommendation.",
		purpose: "Support calm routine observation without starting unnecessary treatment, and seek assessment if symptoms appear or persist.",
		supplies: ["No treatment supplies are needed for this model result.", "If symptoms are noticed, use a phone or camera to document them."],
		precautions: ["Let your pet rest if handling is uncomfortable.", "Use veterinary advice if a concern develops, even if this photo was classified as no obvious concern."],
		checklist: ["Observe your pet during routine care without repeatedly manipulating the skin.", "Note any persistent itching, hair loss, wounds, discomfort, or behavior changes.", "If a concern develops, take a clear photo and contact a veterinarian for advice."],
		monitor: ["Persistent itching, hair loss, wounds, redness, scabs, discomfort, and changes in behavior or appetite."],
		vetContact: "Contact a veterinarian if symptoms persist or you notice itching, hair loss, wounds, discomfort, or other concerning changes. The model cannot rule out disease.",
		sources: ["aaha-allergic-skin-2023", "wavd-dermatophytosis-2017"]
	}
};
const VETERINARY_SOURCES = {
	"aaha-allergic-skin-2023": {
		name: "American Animal Hospital Association (AAHA), 2023 Management of Allergic Skin Diseases in Dogs and Cats Guidelines",
		url: "https://www.aaha.org/resources/2023-aaha-management-of-allergic-skin-diseases-in-dogs-and-cats-guidelines/"
	},
	"iscaid-canine-pyoderma-2025": {
		name: "ISCAID 2025 canine pyoderma guideline (dogs only; applies to veterinarian-assessed pyoderma)",
		url: "https://doi.org/10.1111/vde.13342",
		species: ["dog"]
	},
	"wavd-dermatophytosis-2017": {
		name: "World Association for Veterinary Dermatology consensus guideline, Diagnosis and treatment of dermatophytosis in dogs and cats (2017)",
		url: "https://doi.org/10.1111/vde.12440"
	}
};
const $ = id => document.getElementById(id);
const sidebar = $("sidebar");
const menuButton = $("menuToggle");
const menuOverlay = $("menuOverlay");
const navLinks = [...document.querySelectorAll(".sidebar .nav")];
const views = {
	guide: $("guide"),
	screening: $("screening"),
	"care-guide": $("care-guide"),
	treatment: $("treatment")
};
const elements = {
	analyzeButton: $("analyzeBtn"),
	cameraCaptureButton: $("capturePhoto"),
	cameraCloseButton: $("closeCamera"),
	cameraOpenButton: $("openCamera"),
	cameraRetakeButton: $("retakePhoto"),
	cameraStatus: $("cameraStatus"),
	cameraStill: $("cameraStill"),
	cameraSwitchButton: $("switchCamera"),
	cameraUseButton: $("useCameraPhoto"),
	cameraVideo: $("cameraVideo"),
	cameraViewport: $("cameraViewport"),
	dropzone: $("dropzone"),
	emptyState: $("emptyState"),
	errorBox: $("errorBox"),
	fileInput: $("imageInput"),
	fileName: $("fileName"),
	fileSize: $("fileSize"),
	guidanceText: $("guidanceText"),
	modelStatus: $("modelStatus"),
	previewImage: $("previewImage"),
	previewWrap: $("previewWrap"),
	removeButton: $("removeImage"),
	resultContent: $("resultContent"),
	resultStatus: $("resultStatus"),
	scoreList: $("scoreList"),
	screeningPetName: $("screeningPetName"),
	startTreatmentTracking: $("startTreatmentTracking"),
	openCareJourney: $("openCareJourney"),
	careJourney: $("beforeStartTreatment"),
	careNoScreening: $("careNoScreening"),
	careResultCategory: $("careResultCategory"),
	careOriginalClass: $("careOriginalClass"),
	careResultScore: $("careResultScore"),
	careResultBanner: $("careResultBanner"),
	careScoreCard: $("careScoreCard"),
	careGuideOverview: $("careGuideOverview"),
	readCareInstructions: $("readCareInstructions"),
	viewCareOptions: $("viewCareOptions"),
	careOptionsDetails: $("careOptionsDetails"),
	careSafetyCheck: $("careSafetyCheck"),
	careResultExplanation: $("careResultExplanation"),
	carePossibleCauses: $("carePossibleCauses"),
	careHomeCare: $("careHomeCare"),
	careFirstActions: $("careFirstActions"),
	careAvoid: $("careAvoid"),
	careWhenVet: $("careWhenVet"),
	careVetOptions: $("careVetOptions"),
	careReferences: $("careReferences"),
	careScoreList: $("careScoreList"),
	careSafetyResponse: $("careSafetyResponse"),
	vetInstructionsPanel: $("vetInstructionsPanel"),
	vetInstructions: $("vetInstructions"),
	saveVetInstructions: $("saveVetInstructions"),
	urgentCareNotice: $("urgentCareNotice"),
	worseningCareNotice: $("worseningCareNotice"),
	careContinueDescription: $("careContinueDescription"),
	openStepByStepGuide: $("openStepByStepGuide"),
	openStepByStepGuideCard: $("openStepByStepGuideCard"),
	stepByStepCareGuide: $("stepByStepCareGuide"),
	careSpeciesLabel: $("careSpeciesLabel"),
	careGuidePurpose: $("careGuidePurpose"),
	careGuideSupplies: $("careGuideSupplies"),
	careGuidePrecautions: $("careGuidePrecautions"),
	careGuideAvoid: $("careGuideAvoid"),
	careGuideMonitor: $("careGuideMonitor"),
	careChecklist: $("careChecklist"),
	careProgressText: $("careProgressText"),
	careProgressTrack: $("careProgressTrack"),
	careProgressFill: $("careProgressFill"),
	careSaveStatus: $("careSaveStatus"),
	careSessionDate: $("careSessionDate"),
	careSessionControls: $("careSessionControls"),
	careObservationForm: $("careObservationForm"),
	careObservationNote: $("careObservationNote"),
	careSessionHistory: $("careSessionHistory"),
	careObservationHistory: $("careObservationHistory"),
	newCareSession: $("newCareSession"),
	careGuideVetContact: $("careGuideVetContact"),
	careGuideLibrary: $("careGuideLibrary"),
	careGuideSearch: $("careGuideSearch"),
	careGuideSpecies: $("careGuideSpecies"),
	careGuideStatus: $("careGuideStatus"),
	careGuideCards: $("careGuideCards"),
	backToCareGuides: $("backToCareGuides"),
	careStepNavigation: $("careStepNavigation"),
	previousCareStep: $("previousCareStep"),
	nextCareStep: $("nextCareStep"),
	careStepPosition: $("careStepPosition"),
	topDescription: $("topDescription"),
	topLabel: $("topLabel"),
	topPercent: $("topPercent"),
	resultSpecies: $("resultSpecies")
};
const missingElements = Object.entries(elements).filter(([, element]) => !element).map(([name]) => name);
if (missingElements.length) {
	throw new Error(`DermaPaw UI is missing required elements: ${missingElements.join(", ")}`);
}
if (!sidebar || !menuButton || !menuOverlay) {
	throw new Error("DermaPaw sidebar menu controls are missing from index.html.");
}
if (Object.values(views).some(view => !view)) {
	throw new Error("DermaPaw page views are missing from index.html.");
}

let selectedPet = "cat";
let selectedFile = null;
let previewObjectUrl = null;
let model = null;
let modelPromise = null;
let modelState = "loading";
let modelClassInfo = new Map();
let selectionRevision = 0;
let isAnalyzing = false;
let cameraStream = null;
let cameraOpening = false;
let cameraRequestRevision = 0;
let cameraFacingMode = "environment";
let capturedCameraBlob = null;
let capturedCameraUrl = null;
let lastScreeningResult = null;
let activeGuideCategory = "";
const CARE_PROGRESS_KEY = "dermapaw-care-progress-v1";
const CARE_SCREENING_KEY = "dermapaw-care-screening-context-v1";
let careProgress = { version: 2, items: {} };
let careProgressAvailable = true;
let activeCareKey = "";
const petButtons = [...document.querySelectorAll(".pet")];
const mobileMenuQuery = window.matchMedia("(max-width: 650px)");
const emptyMessage = elements.emptyState.querySelector("p");
const uploadNote = $("uploadPrivacyNote");
const guideModelStatus = $("guideModelStatus");
const guideCategoryStatus = $("guideCategoryStatus");
const guideCategoryList = $("guideCategoryList");
const guideResultsMessage = $("guideResultsMessage");
const guideActualScoreList = $("guideActualScoreList");
function setMenuOpen(isOpen) {
	if (mobileMenuQuery.matches) {
		sidebar.classList.remove("is-collapsed");
		document.body.classList.remove("sidebar-collapsed");
		sidebar.classList.toggle("is-mobile-open", isOpen);
		menuOverlay.hidden = !isOpen;
		document.body.classList.toggle("sidebar-menu-open", isOpen);
		menuButton.setAttribute("aria-expanded", String(isOpen));
		menuButton.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
		return;
	}
	sidebar.classList.remove("is-mobile-open");
	menuOverlay.hidden = true;
	document.body.classList.remove("sidebar-menu-open");
	sidebar.classList.toggle("is-collapsed", !isOpen);
	document.body.classList.toggle("sidebar-collapsed", !isOpen);
	menuButton.setAttribute("aria-expanded", String(isOpen));
	menuButton.setAttribute("aria-label", isOpen ? "Collapse sidebar" : "Expand sidebar");
}

menuButton.addEventListener("click", () => {
	setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
});
menuOverlay.addEventListener("click", () => setMenuOpen(false));
sidebar.querySelectorAll(".nav").forEach(link => {
	link.addEventListener("click", () => {
		if (mobileMenuQuery.matches) setMenuOpen(false);
	});
});
function showView(viewName) {
	const activeView = views[viewName] ? viewName : "screening";
	Object.entries(views).forEach(([name, view]) => {
		const isActive = name === activeView;
		view.hidden = !isActive;
		view.setAttribute("aria-hidden", String(!isActive));
	});
	navLinks.forEach(link => {
		const isActive = link.hash === `#${activeView}`;
		link.classList.toggle("active", isActive);
		if (isActive) {
			link.setAttribute("aria-current", "location");
		} else {
			link.removeAttribute("aria-current");
		}
	});
	updateCarePageAvailability();
}
function syncViewToLocation() {
	const requestedView = window.location.hash.slice(1);
	const activeView = views[requestedView] ? requestedView : "screening";
	showView(activeView);
	if (window.location.hash !== `#${activeView}`) {
		window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${activeView}`);
	}
	window.scrollTo({ top: 0, behavior: "smooth" });
}
window.addEventListener("hashchange", syncViewToLocation);
syncViewToLocation();
document.addEventListener("keydown", event => {
	if (event.key === "Escape" && mobileMenuQuery.matches && sidebar.classList.contains("is-mobile-open")) {
		setMenuOpen(false);
		menuButton.focus();
	}
});
mobileMenuQuery.addEventListener("change", event => setMenuOpen(!event.matches));
setMenuOpen(!mobileMenuQuery.matches);

elements.dropzone.tabIndex = 0;
elements.dropzone.setAttribute("role", "button");
elements.dropzone.setAttribute("aria-controls", "imageInput");
elements.dropzone.setAttribute("aria-label", "Choose a JPG, JPEG, PNG, or WEBP pet photo, up to 10 megabytes");
elements.resultStatus.setAttribute("aria-live", "polite");
elements.errorBox.setAttribute("role", "alert");
elements.removeButton.setAttribute("type", "button");
elements.removeButton.setAttribute("aria-label", "Remove selected image");
document.querySelector(".pet-switch")?.setAttribute("role", "group");
document.querySelector(".pet-switch")?.setAttribute("aria-label", "Choose animal type");
elements.fileInput.accept = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

if (uploadNote) uploadNote.textContent = "Uploaded photos are analyzed in this browser and are not sent to an unrelated image service. Image classification alone cannot determine a reliable recovery timeline.";
if (emptyMessage) emptyMessage.textContent = "Load a photo and analyze it to see the model's actual scores for all four classes.";
updateIdleStatus();
initializeModel();
loadCareProgress();
renderCareGuideLibrary();
restoreCareScreeningContext();

petButtons.forEach(button => {
	button.setAttribute("aria-pressed", String(button.dataset.pet === selectedPet));
	button.classList.toggle("selected", button.dataset.pet === selectedPet);
	button.addEventListener("click", () => {
		if (isAnalyzing || button.dataset.pet === selectedPet) return;
		selectedPet = button.dataset.pet;
		elements.careGuideSpecies.value = selectedPet;
		petButtons.forEach(petButton => {
			const isSelected = petButton === button;
			petButton.classList.toggle("selected", isSelected);
			petButton.setAttribute("aria-pressed", String(isSelected));
		});
		resetResults();
	});
});
elements.careGuideSearch.addEventListener("input", renderCareGuideLibrary);
elements.careGuideSpecies.addEventListener("change", () => {
	const category = activeGuideCategory;
	selectedPet = elements.careGuideSpecies.value;
	petButtons.forEach(button => {
		const isSelected = button.dataset.pet === selectedPet;
		button.classList.toggle("selected", isSelected);
		button.setAttribute("aria-pressed", String(isSelected));
	});
	if (lastScreeningResult && lastScreeningResult.species !== selectedPet) resetResults();
	if (category && CARE_GUIDES[category]) {
		const matchingScore = lastScreeningResult?.predictedCategory === category
			? lastScreeningResult.scores.find(score => score.displayName === category)
			: null;
		const leading = matchingScore
			? { displayName: category, sourceName: matchingScore.className, score: matchingScore.probability }
			: null;
		renderCareJourney(leading, category);
	}
});
elements.careGuideCards.addEventListener("click", event => {
	const button = event.target.closest("[data-care-guide]");
	if (!button) return;
	renderCareJourney(null, button.dataset.careGuide);
	elements.careJourney.scrollIntoView({ behavior: "smooth", block: "start" });
});
elements.readCareInstructions.addEventListener("click", () => {
	elements.careSafetyCheck.scrollIntoView({ behavior: "smooth", block: "start" });
	const firstAssessmentOption = document.querySelector('input[name="vetAssessment"]');
	if (elements.openStepByStepGuide.disabled) firstAssessmentOption?.focus();
	else openStepByStepCareGuide();
});
elements.viewCareOptions.addEventListener("click", () => {
	elements.careOptionsDetails.open = true;
	elements.careOptionsDetails.scrollIntoView({ behavior: "smooth", block: "center" });
});
elements.backToCareGuides.addEventListener("click", () => {
	activeGuideCategory = "";
	updateCarePageAvailability();
	elements.careGuideLibrary.scrollIntoView({ behavior: "smooth", block: "start" });
});

elements.fileInput.addEventListener("change", event => {
	const file = event.target.files?.[0];
	event.target.value = "";
	handleFile(file);
});
elements.removeButton.addEventListener("click", clearImage);
$("resetBtn")?.addEventListener("click", clearImage);
elements.dropzone.addEventListener("keydown", event => {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		elements.fileInput.click();
	}
});
elements.dropzone.addEventListener("dragover", event => {
	event.preventDefault();
	elements.dropzone.classList.add("dragover");
});
elements.dropzone.addEventListener("dragleave", event => {
	if (!elements.dropzone.contains(event.relatedTarget)) {
		elements.dropzone.classList.remove("dragover");
	}
});
elements.dropzone.addEventListener("drop", event => {
	event.preventDefault();
	elements.dropzone.classList.remove("dragover");
	handleFile(event.dataTransfer?.files?.[0]);
});
elements.analyzeButton.addEventListener("click", analyze);
elements.startTreatmentTracking.addEventListener("click", startTreatmentTracking);
document.querySelectorAll('input[name="vetAssessment"]').forEach(input => {
	input.addEventListener("change", updateCareSafetyState);
});
document.querySelectorAll('input[name="urgentSign"]').forEach(input => {
	input.addEventListener("change", updateCareSafetyState);
});
elements.saveVetInstructions.addEventListener("click", saveVeterinaryInstructions);
elements.openStepByStepGuide.addEventListener("click", openStepByStepCareGuide);
elements.openStepByStepGuideCard.addEventListener("click", openStepByStepCareGuide);
elements.careChecklist.addEventListener("change", saveCareChecklist);
elements.previousCareStep.addEventListener("click", () => moveCareStep(-1));
elements.nextCareStep.addEventListener("click", () => moveCareStep(1));
elements.newCareSession.addEventListener("click", startNewCareSession);
elements.careObservationForm.addEventListener("submit", saveCareObservation);
elements.screeningPetName.addEventListener("change", () => {
	if (activeGuideCategory) activateCareProgress();
});
elements.cameraOpenButton.addEventListener("click", openCamera);
elements.cameraCaptureButton.addEventListener("click", captureCameraPhoto);
elements.cameraRetakeButton.addEventListener("click", retakeCameraPhoto);
elements.cameraUseButton.addEventListener("click", useCameraPhoto);
elements.cameraCloseButton.addEventListener("click", () => closeCamera());
elements.cameraSwitchButton.addEventListener("click", switchCamera);
window.addEventListener("hashchange", () => {
	if (window.location.hash !== "#screening") stopCameraOutsideScreening();
});
document.addEventListener("visibilitychange", () => {
	if (document.hidden) stopCameraOutsideScreening();
});
window.addEventListener("beforeunload", () => {
	if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
	closeCamera({ announce: false });
});

function stopCameraOutsideScreening() {
	if (cameraStream || cameraOpening || capturedCameraBlob) {
		closeCamera({ message: "Camera stopped because you left Skin Screening or switched away from this page." });
	}
}

async function openCamera() {
	if (cameraOpening || cameraStream) return;
	if (!window.isSecureContext) {
		setCameraStatus("Camera access requires a secure context. Open this page over HTTPS or use localhost.", "error");
		return;
	}
	if (!navigator.mediaDevices?.getUserMedia) {
		setCameraStatus("This browser does not support camera access. You can still upload a photo below.", "error");
		return;
	}

	cameraOpening = true;
	const requestRevision = ++cameraRequestRevision;
	elements.cameraOpenButton.hidden = true;
	elements.cameraCloseButton.hidden = false;
	elements.cameraCaptureButton.hidden = true;
	elements.cameraSwitchButton.hidden = true;
	setCameraStatus("Requesting camera permission…", "loading");
	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: false,
			video: { facingMode: { ideal: cameraFacingMode } }
		});
		if (requestRevision !== cameraRequestRevision) {
			stream.getTracks().forEach(track => track.stop());
			return;
		}
		cameraStream = stream;
		stream.getVideoTracks().forEach(track => {
			track.addEventListener("ended", () => {
				if (cameraStream === stream) {
					closeCamera({ message: "Camera connection ended. Open the camera again or upload a photo.", state: "error" });
				}
			}, { once: true });
		});
		elements.cameraVideo.srcObject = stream;
		elements.cameraViewport.hidden = false;
		elements.cameraVideo.hidden = false;
		elements.cameraStill.hidden = true;
		await elements.cameraVideo.play();
		if (requestRevision !== cameraRequestRevision) return;
		elements.cameraCaptureButton.hidden = false;
		elements.cameraCaptureButton.disabled = false;
		elements.cameraSwitchButton.hidden = false;
		setCameraStatus("Camera is active. Position your pet comfortably, then capture a clear image.", "active");
	} catch (error) {
		if (requestRevision !== cameraRequestRevision) return;
		releaseCameraStream();
		elements.cameraOpenButton.hidden = false;
		elements.cameraCloseButton.hidden = true;
		elements.cameraViewport.hidden = true;
		setCameraStatus(cameraErrorMessage(error), "error");
	} finally {
		if (requestRevision === cameraRequestRevision) cameraOpening = false;
	}
}

function cameraErrorMessage(error) {
	switch (error?.name) {
		case "NotAllowedError":
		case "PermissionDeniedError":
			return "Camera permission was denied. Allow camera access in your browser settings, or upload a photo below.";
		case "NotFoundError":
		case "DevicesNotFoundError":
			return "No camera was found on this device. You can still upload a photo below.";
		case "NotReadableError":
		case "TrackStartError":
			return "The camera could not start. It may be in use by another application; close that app and try again, or upload a photo.";
		case "OverconstrainedError":
			return "The requested camera is unavailable. Try switching cameras or upload a photo.";
		case "SecurityError":
			return "Camera access is blocked by browser security. Open this page over HTTPS or use localhost, then check camera permissions.";
		default:
			return "The camera could not start. Check browser permissions and that the camera is available, or upload a photo.";
	}
}

function setCameraStatus(message, state = "idle") {
	elements.cameraStatus.textContent = message;
	elements.cameraStatus.dataset.state = state;
}

function releaseCameraStream() {
	if (cameraStream) {
		cameraStream.getTracks().forEach(track => track.stop());
		cameraStream = null;
	}
	elements.cameraVideo.srcObject = null;
}

function clearCapturedCameraPhoto() {
	if (capturedCameraUrl) URL.revokeObjectURL(capturedCameraUrl);
	capturedCameraUrl = null;
	capturedCameraBlob = null;
	elements.cameraStill.removeAttribute("src");
}

function closeCamera({ announce = true, message = "Camera closed. You can upload a photo or open the camera again.", state = "idle" } = {}) {
	cameraRequestRevision++;
	cameraOpening = false;
	releaseCameraStream();
	clearCapturedCameraPhoto();
	elements.cameraViewport.hidden = true;
	elements.cameraVideo.hidden = false;
	elements.cameraStill.hidden = true;
	elements.cameraOpenButton.hidden = false;
	elements.cameraCaptureButton.hidden = true;
	elements.cameraCaptureButton.disabled = true;
	elements.cameraSwitchButton.hidden = true;
	elements.cameraRetakeButton.hidden = true;
	elements.cameraUseButton.hidden = true;
	elements.cameraCloseButton.hidden = true;
	if (announce) setCameraStatus(message, state);
}

function captureCameraPhoto() {
	if (!cameraStream || !elements.cameraVideo.videoWidth || !elements.cameraVideo.videoHeight) {
		setCameraStatus("The camera preview is not ready yet. Wait for the live picture and try again.", "error");
		return;
	}
	const canvas = document.createElement("canvas");
	canvas.width = elements.cameraVideo.videoWidth;
	canvas.height = elements.cameraVideo.videoHeight;
	const context = canvas.getContext("2d");
	if (!context) {
		setCameraStatus("This browser could not capture an image from the camera. You can upload a photo instead.", "error");
		return;
	}
	if (typeof canvas.toBlob !== "function") {
		setCameraStatus("This browser cannot create a camera photo. You can upload a photo instead.", "error");
		return;
	}
	try {
		context.drawImage(elements.cameraVideo, 0, 0, canvas.width, canvas.height);
		canvas.toBlob(blob => {
			if (!cameraStream) return;
			if (!blob) {
				setCameraStatus("The camera photo could not be created. Try again or upload a photo.", "error");
				return;
			}
			clearCapturedCameraPhoto();
			capturedCameraBlob = blob;
			capturedCameraUrl = URL.createObjectURL(blob);
			elements.cameraStill.src = capturedCameraUrl;
			elements.cameraStill.hidden = false;
			elements.cameraVideo.hidden = true;
			elements.cameraCaptureButton.hidden = true;
			elements.cameraRetakeButton.hidden = false;
			elements.cameraUseButton.hidden = false;
			setCameraStatus("Photo captured. Retake it or use this photo for screening.", "active");
		}, "image/jpeg", 0.92);
	} catch {
		setCameraStatus("The camera photo could not be captured. Try again or upload a photo.", "error");
	}
}

function retakeCameraPhoto() {
	if (!cameraStream) {
		clearCapturedCameraPhoto();
		openCamera();
		return;
	}
	clearCapturedCameraPhoto();
	elements.cameraStill.hidden = true;
	elements.cameraVideo.hidden = false;
	elements.cameraCaptureButton.hidden = false;
	elements.cameraCaptureButton.disabled = false;
	elements.cameraRetakeButton.hidden = true;
	elements.cameraUseButton.hidden = true;
	setCameraStatus("Camera is active. Capture a new photo when ready.", "active");
}

async function useCameraPhoto() {
	if (!capturedCameraBlob) {
		setCameraStatus("Capture a photo before choosing Use This Photo.", "error");
		return;
	}
	const file = new File([capturedCameraBlob], `dermapaw-camera-${Date.now()}.jpg`, { type: "image/jpeg" });
	await handleFile(file);
}

async function switchCamera() {
	if (!cameraStream || cameraOpening) return;
	cameraFacingMode = cameraFacingMode === "environment" ? "user" : "environment";
	releaseCameraStream();
	elements.cameraViewport.hidden = true;
	elements.cameraOpenButton.hidden = false;
	elements.cameraCaptureButton.hidden = true;
	elements.cameraSwitchButton.hidden = true;
	elements.cameraCloseButton.hidden = true;
	setCameraStatus("Switching camera…", "loading");
	await openCamera();
}

async function handleFile(file) {
	if (!file || isAnalyzing) return;
	const revision = ++selectionRevision;
	hideError();
	const cameraWasInUse = Boolean(cameraStream || cameraOpening || capturedCameraBlob);
	closeCamera({
		announce: cameraWasInUse,
		message: "Camera closed. The selected photo is ready for screening.",
		state: "active"
	});
	if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
	previewObjectUrl = null;
	selectedFile = null;
	elements.previewImage.removeAttribute("src");
	elements.previewWrap.hidden = true;
	elements.dropzone.hidden = false;
	elements.analyzeButton.disabled = true;
	resetResults();
	const extension = file.name.split(".").pop()?.toLowerCase();
	const allowedExtensions = new Set(["jpg", "jpeg", "png", "webp"]);
	if (!allowedExtensions.has(extension) || (file.type && !ALLOWED_TYPES.has(file.type.toLowerCase()))) {
		showError("Unsupported image type. Choose a JPG, JPEG, PNG, or WEBP image.");
		return;
	}
	if (file.size > MAX_FILE_SIZE) {
		showError("This image is larger than 10 MB. Choose a smaller photo.");
		return;
	}

	const objectUrl = URL.createObjectURL(file);
	try {
		await loadImage(objectUrl);
		if (revision !== selectionRevision) {
			URL.revokeObjectURL(objectUrl);
			return;
		}
		if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
		previewObjectUrl = objectUrl;
		selectedFile = file;
		elements.previewImage.src = objectUrl;
		elements.previewImage.alt = `Preview of ${file.name}`;
		elements.fileName.textContent = file.name;
		elements.fileSize.textContent = `${formatFileSize(file.size)} • Ready`;
		elements.previewWrap.hidden = false;
		elements.dropzone.hidden = true;
		elements.analyzeButton.disabled = false;
		updateAnalysisReadiness();
		resetResults();
	} catch {
		URL.revokeObjectURL(objectUrl);
		showError("This file could not be opened as an image. Try another JPG, PNG, or WEBP photo.");
	}
}

function loadImage(source) {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = resolve;
		image.onerror = reject;
		image.src = source;
	});
}

function waitForImageElement(image) {
	if (image.complete) {
		return image.naturalWidth > 0
			? Promise.resolve()
			: Promise.reject(new Error("The selected image could not be decoded."));
	}
	return new Promise((resolve, reject) => {
		image.addEventListener("load", resolve, { once: true });
		image.addEventListener("error", () => reject(new Error("The selected image could not be decoded.")), { once: true });
	});
}

function formatFileSize(bytes) {
	return bytes < 1024 * 1024
		? `${Math.max(1, Math.round(bytes / 1024))} KB`
		: `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function clearImage() {
	if (isAnalyzing) return;
	selectionRevision++;
	if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
	previewObjectUrl = null;
	selectedFile = null;
	elements.fileInput.value = "";
	elements.previewImage.removeAttribute("src");
	elements.previewImage.alt = "Pet photo preview";
	elements.previewWrap.hidden = true;
	elements.dropzone.hidden = false;
	elements.analyzeButton.disabled = true;
	updateAnalysisReadiness();
	resetResults();
}

function resetResults() {
	elements.resultContent.hidden = true;
	elements.startTreatmentTracking.hidden = true;
	elements.openCareJourney.hidden = true;
	activeGuideCategory = "";
	elements.stepByStepCareGuide.hidden = true;
	elements.openStepByStepGuide.setAttribute("aria-expanded", "false");
	elements.emptyState.hidden = false;
	elements.scoreList.replaceChildren();
	lastScreeningResult = null;
	clearGuidePrediction();
	try {
		window.sessionStorage.removeItem(CARE_SCREENING_KEY);
	} catch (error) {
		elements.careSaveStatus.textContent = `The previous screening context could not be cleared from this browser tab: ${error.message || "session storage is unavailable"}.`;
	}
	hideError();
	updateIdleStatus();
	updateCarePageAvailability();
}

function updateIdleStatus() {
	elements.resultStatus.textContent = modelState === "loading"
		? "Loading model"
		: modelState === "unavailable"
			? "Model unavailable"
			: selectedFile ? "Image selected" : "Model ready";
	updateAnalysisReadiness();
}

function updateAnalysisReadiness() {
	elements.analyzeButton.disabled = !selectedFile || modelState !== "ready" || isAnalyzing;
}

function updateModelStatus(message, state) {
	elements.modelStatus.textContent = message;
	elements.modelStatus.dataset.state = state;
	if (guideModelStatus) {
		guideModelStatus.textContent = message;
		guideModelStatus.dataset.state = state;
	}
	if (state === "error" && guideCategoryStatus) {
		guideCategoryStatus.textContent = "Model classes are unavailable because the model could not be loaded.";
	}
}

function normalizeClassName(name) {
	return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function configureModelClasses(labels) {
	if (!Array.isArray(labels) || labels.length !== 4 || labels.some(label => typeof label !== "string" || !label.trim())) {
		throw new Error("The model metadata did not provide exactly four valid class names.");
	}
	const classes = new Map();
	const categories = new Set();
	for (const sourceName of labels) {
		const key = normalizeClassName(sourceName);
		const displayName = CLASS_LABEL_ALIASES[key];
		if (!displayName || classes.has(key) || categories.has(displayName)) {
			throw new Error(`The model metadata contains class names that cannot be safely mapped to the four supported skin-pattern categories: ${labels.join(", ")}`);
		}
		classes.set(key, { sourceName, displayName, ...CLASS_INFO[displayName] });
		categories.add(displayName);
	}
	if (categories.size !== Object.keys(CLASS_INFO).length) {
		throw new Error(`The model metadata does not match all four supported skin-pattern categories. Classes found: ${labels.join(", ")}`);
	}
	modelClassInfo = classes;
	return labels;
}

function renderGuideModelClasses() {
	if (!guideCategoryList || !guideCategoryStatus) return;
	guideCategoryList.replaceChildren();
	[...modelClassInfo.values()].forEach(info => {
		const item = document.createElement("li");
		item.textContent = info.sourceName;
		guideCategoryList.append(item);
	});
	guideCategoryStatus.textContent = modelClassInfo.size
		? "Class names below are read from the connected model's metadata:"
		: "Waiting for model class names from its metadata.";
}

function clearGuidePrediction() {
	if (guideResultsMessage) {
		guideResultsMessage.textContent = "No screening result is available yet. Run a screening to see actual model predictions here.";
	}
	guideActualScoreList?.replaceChildren();
}

function renderGuidePrediction(result) {
	if (!guideResultsMessage || !guideActualScoreList) return;
	guideActualScoreList.replaceChildren();
	if (!result || !Array.isArray(result.scores) || !result.scores.length) {
		clearGuidePrediction();
		return;
	}
	guideResultsMessage.textContent = `Most recent screening: ${result.predictedCategory} for ${result.species === "cat" ? "Cat" : "Dog"}. These are actual model outputs, not a diagnosis.`;
	result.scores.forEach(score => {
		const row = document.createElement("p");
		const label = document.createElement("strong");
		label.textContent = score.className;
		const value = document.createElement("span");
		value.textContent = `${(score.probability * 100).toFixed(1)}%`;
		row.append(label, value);
		guideActualScoreList.append(row);
	});
}

async function initializeModel() {
	updateModelStatus("Loading the trained image model…", "loading");
	elements.resultStatus.textContent = "Loading model";
	try {
		const activeModel = await getModel();
		if (typeof activeModel.getClassLabels !== "function") {
			throw new Error("The loaded model library cannot read the model's class labels.");
		}
		const labels = configureModelClasses(activeModel.getClassLabels());
		renderGuideModelClasses();
		modelState = "ready";
		updateModelStatus(`Model ready. Classes from metadata: ${labels.join("; ")}`, "ready");
	} catch (error) {
		modelState = "unavailable";
		updateModelStatus(error.message || "The trained model could not be loaded.", "error");
	}
	updateIdleStatus();
}

async function getModel() {
	if (!window.tmImage?.load) {
		throw new Error("The Teachable Machine library did not load. Check your internet connection and refresh the page.");
	}
	if (!modelPromise) {
		let baseUrl;
		try {
			baseUrl = new URL(MODEL_URL);
			if (baseUrl.protocol !== "https:") throw new Error("Use the HTTPS URL for your exported model directory.");
			baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, "")}/`;
			baseUrl.search = "";
			baseUrl.hash = "";
		} catch (error) {
			throw new Error(error.message || "MODEL_URL is invalid. Paste the HTTPS model directory URL from Teachable Machine.");
		}
		modelPromise = window.tmImage.load(new URL("model.json", baseUrl).href, new URL("metadata.json", baseUrl).href);
		try {
			model = await modelPromise;
		} catch {
			modelPromise = null;
			throw new Error("The AI model could not be loaded. Check MODEL_URL, confirm model.json and metadata.json are hosted there, and try again.");
		}
	} else {
		model = await modelPromise;
	}
	if (!model || typeof model.predict !== "function") {
		model = null;
		modelPromise = null;
		throw new Error("The AI model loaded without a usable prediction function. Check the exported model files and URL, then try again.");
	}
	return model;
}

function validatePredictions(predictions) {
	if (!Array.isArray(predictions) || predictions.length !== modelClassInfo.size) {
		throw new Error("The model did not return all four classes declared in its metadata. No screening results were displayed.");
	}
	const seen = new Set();
	const items = predictions.map(prediction => {
		const sourceName = prediction?.className;
		const score = prediction?.probability;
		const key = typeof sourceName === "string" ? normalizeClassName(sourceName) : "";
		const info = modelClassInfo.get(key);
		if (!info || seen.has(key)) {
			throw new Error(`The model returned an unknown or duplicate class label${sourceName ? `: ${sourceName}` : ""}. No screening results were displayed.`);
		}
		if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1) {
			throw new Error("The model returned an invalid score. No screening results were displayed.");
		}
		seen.add(key);
		return { ...info, score };
	});
	if (seen.size !== modelClassInfo.size) {
		throw new Error("The model did not return every class listed in its metadata.");
	}
	return items.sort((first, second) => second.score - first.score);
}

async function analyze() {
	if (isAnalyzing) return;
	if (!selectedFile) {
		showError("Select a pet photo before starting screening.");
		return;
	}
	const currentRevision = selectionRevision;
	isAnalyzing = true;
	updateAnalysisReadiness();
	elements.analyzeButton.classList.add("is-loading");
	elements.analyzeButton.setAttribute("aria-busy", "true");
	elements.analyzeButton.textContent = "Loading model and analyzing";
	elements.removeButton.disabled = true;
	petButtons.forEach(button => { button.disabled = true; });
	elements.resultStatus.textContent = "Analyzing";
	hideError();
	try {
		const activeModel = await getModel();
		await waitForImageElement(elements.previewImage);
		const predictions = await activeModel.predict(elements.previewImage);
		if (currentRevision !== selectionRevision || !selectedFile) return;
		renderResults(validatePredictions(predictions));
	} catch (error) {
		if (currentRevision === selectionRevision) {
			showError(error.message || "Screening could not be completed. Check the model connection and try again.");
			elements.resultStatus.textContent = "Screening unavailable";
		}
	} finally {
		isAnalyzing = false;
		elements.analyzeButton.classList.remove("is-loading");
		elements.analyzeButton.removeAttribute("aria-busy");
		elements.analyzeButton.textContent = "Analyze image";
		elements.removeButton.disabled = false;
		petButtons.forEach(button => { button.disabled = false; });
		updateAnalysisReadiness();
	}
}

function renderResults(items) {
	const leading = items[0];
	const uncertain = leading.score < 0.55 || leading.score - items[1].score < 0.1;
	lastScreeningResult = {
		at: new Date().toISOString(),
		petName: elements.screeningPetName.value.trim(),
		species: selectedPet,
		modelUrl: MODEL_URL,
		predictedCategory: leading.displayName,
		scores: items.map(item => ({
			className: item.sourceName,
			displayName: item.displayName,
			probability: item.score
		}))
	};
	try {
		window.sessionStorage.setItem(CARE_SCREENING_KEY, JSON.stringify(lastScreeningResult));
	} catch (error) {
		showError(`Screening completed, but its result could not be retained for a page refresh: ${error.message || "session storage is unavailable"}.`);
	}
	elements.emptyState.hidden = true;
	elements.resultContent.hidden = false;
	elements.startTreatmentTracking.hidden = false;
	elements.openCareJourney.hidden = false;
	elements.careJourney.hidden = false;
	elements.careNoScreening.hidden = true;
	elements.resultStatus.textContent = "Model screening complete";
	elements.resultSpecies.textContent = `Selected animal: ${selectedPet === "cat" ? "Cat" : "Dog"}.`;
	const topHeading = elements.topLabel.closest(".summary")?.querySelector("small");
	if (topHeading) topHeading.textContent = "LEADING VISIBLE-PATTERN PREDICTION";
	elements.topLabel.textContent = leading.displayName;
	elements.topDescription.textContent = `${leading.description} This is the model's top predicted visible skin-pattern category, not a confirmed disease.`;
	elements.topPercent.textContent = `${(leading.score * 100).toFixed(1)}%`;
	elements.guidanceText.textContent = leading.guidance;
	elements.scoreList.replaceChildren();
	renderGuidePrediction(lastScreeningResult);
	renderCareJourney(leading);

	items.forEach(item => {
		const percentage = item.score * 100;
		const row = document.createElement("div");
		row.className = "score-row";
		const meta = document.createElement("div");
		meta.className = "score-meta";
		const label = document.createElement("strong");
		label.textContent = item.displayName;
		label.title = `Model class label: ${item.sourceName}`;
		const value = document.createElement("span");
		value.textContent = `${percentage.toFixed(1)}%`;
		meta.append(label, value);
		const track = document.createElement("div");
		track.className = "track";
		track.setAttribute("role", "progressbar");
		track.setAttribute("aria-label", `${item.displayName} model score`);
		track.setAttribute("aria-valuemin", "0");
		track.setAttribute("aria-valuemax", "100");
		track.setAttribute("aria-valuenow", percentage.toFixed(1));
		const fill = document.createElement("div");
		fill.className = "fill";
		fill.style.width = `${percentage}%`;
		track.append(fill);
		row.append(meta, track);
		elements.scoreList.append(row);
	});

	if (uncertain) {
		const caution = document.createElement("p");
		caution.className = "tiny caution";
		caution.textContent = "The model scores are close or the leading score is low. Treat this result as uncertain and ask a veterinarian for an assessment.";
		elements.scoreList.append(caution);
	}
}

function updateCarePageAvailability() {
	const hasSelectedGuide = Boolean(activeGuideCategory && CARE_GUIDES[activeGuideCategory]);
	elements.careGuideLibrary.hidden = hasSelectedGuide;
	elements.careJourney.hidden = !hasSelectedGuide;
	elements.careNoScreening.hidden = Boolean(lastScreeningResult) || hasSelectedGuide;
}

function restoreCareScreeningContext() {
	let serialized;
	try {
		serialized = window.sessionStorage.getItem(CARE_SCREENING_KEY);
	} catch (error) {
		elements.careSaveStatus.textContent = `A screening result could not be restored from this browser tab: ${error.message || "session storage is unavailable"}.`;
		return;
	}
	if (!serialized) {
		updateCarePageAvailability();
		return;
	}
	try {
		const result = JSON.parse(serialized);
		if (!result || result.modelUrl !== MODEL_URL || !["dog", "cat"].includes(result.species) ||
			typeof result.at !== "string" || !Number.isFinite(Date.parse(result.at)) ||
			typeof result.petName !== "string" || result.petName.length > 100 ||
			!Array.isArray(result.scores) || result.scores.length !== 4 ||
			!result.scores.every(score => score && typeof score.className === "string" &&
				typeof score.displayName === "string" &&
				CLASS_LABEL_ALIASES[normalizeClassName(score.className)] === score.displayName &&
				Number.isFinite(score.probability) && score.probability >= 0 && score.probability <= 1) ||
			new Set(result.scores.map(score => normalizeClassName(score.className))).size !== 4 ||
			new Set(result.scores.map(score => score.displayName)).size !== Object.keys(CLASS_INFO).length) {
			throw new Error("The saved screening result did not pass validation.");
		}
		const leading = [...result.scores].sort((a, b) => b.probability - a.probability)[0];
		if (result.predictedCategory !== leading.displayName || !CARE_GUIDES[result.predictedCategory]) {
			throw new Error("The saved screening category is not supported.");
		}
		lastScreeningResult = result;
		selectedPet = result.species;
		elements.careGuideSpecies.value = selectedPet;
		petButtons.forEach(button => {
			const isSelected = button.dataset.pet === selectedPet;
			button.classList.toggle("selected", isSelected);
			button.setAttribute("aria-pressed", String(isSelected));
		});
		elements.screeningPetName.value = result.petName;
		renderGuidePrediction(result);
		renderCareJourney({
			displayName: leading.displayName,
			sourceName: leading.className,
			score: leading.probability
		});
		updateCarePageAvailability();
	} catch (error) {
		elements.careSaveStatus.textContent = `The saved screening result could not be validated and was not displayed: ${error.message || ""}`;
		updateCarePageAvailability();
	}
}

function loadCareProgress() {
	try {
		const serialized = window.localStorage.getItem(CARE_PROGRESS_KEY);
		if (!serialized) return;
		const parsed = JSON.parse(serialized);
		if (!parsed || ![1, 2].includes(parsed.version) || !parsed.items || typeof parsed.items !== "object" || Array.isArray(parsed.items)) {
			throw new Error("Saved care-guide progress has an unsupported format.");
		}
		const validAnswers = new Set(["instructions", "not-consulted", "worsening", ""]);
		const validUrgentSigns = new Set(["severe-pain", "spreading-swelling", "significant-bleeding", "rapid-deterioration"]);
		const isValidDate = value => typeof value === "string" && Number.isFinite(Date.parse(value));
		for (const [key, item] of Object.entries(parsed.items)) {
			if (key.length > 220 || !item || typeof item !== "object" || !validAnswers.has(item.answer) ||
				typeof item.instructions !== "string" || item.instructions.length > 1000 ||
				!Array.isArray(item.urgentSigns) || !item.urgentSigns.every(sign => validUrgentSigns.has(sign))) {
				throw new Error("Saved care-guide progress could not be validated.");
			}
			if (parsed.version === 1) {
				if (!Array.isArray(item.checklist) || item.checklist.length > 20 || !item.checklist.every(checked => typeof checked === "boolean")) {
					throw new Error("Saved care-guide progress could not be validated.");
				}
				const id = `legacy-${Object.keys(parsed.items).indexOf(key)}`;
				item.sessions = [{
					id,
					startedAt: null,
					legacy: true,
					checklist: [...item.checklist],
					completedAt: item.checklist.map(() => null),
					observations: []
				}];
				item.activeSessionId = id;
				delete item.checklist;
			}
			if (!Array.isArray(item.sessions) || item.sessions.length > 1000 ||
				typeof item.activeSessionId !== "string" ||
				(item.activeSessionId && !item.sessions.some(session => session.id === item.activeSessionId))) {
				throw new Error("Saved care-guide sessions could not be validated.");
			}
			for (const session of item.sessions) {
				if (!session || typeof session.id !== "string" || !session.id || session.id.length > 100 ||
					(session.startedAt !== null && !isValidDate(session.startedAt)) ||
					typeof session.legacy !== "boolean" ||
					!Array.isArray(session.checklist) || session.checklist.length > 20 ||
					!session.checklist.every(checked => typeof checked === "boolean") ||
					(session.currentStepIndex !== undefined &&
						(!Number.isInteger(session.currentStepIndex) || session.currentStepIndex < 0 || session.currentStepIndex >= session.checklist.length)) ||
					!Array.isArray(session.completedAt) || session.completedAt.length !== session.checklist.length ||
					!session.completedAt.every(date => date === null || isValidDate(date)) ||
					!Array.isArray(session.observations) || session.observations.length > 500 ||
					!session.observations.every(observation => observation && isValidDate(observation.at) &&
						typeof observation.note === "string" && observation.note.length <= 1000)) {
					throw new Error("Saved care-guide sessions could not be validated.");
				}
				if (session.currentStepIndex === undefined) session.currentStepIndex = 0;
			}
		}
		careProgress = { version: 2, items: parsed.items };
	} catch (error) {
		careProgressAvailable = false;
		elements.careSaveStatus.textContent = `Saved care checklist data could not be loaded. Existing browser data was left unchanged. ${error.message || ""}`;
	}
}

function getCareProgressEntry() {
	return careProgress.items[activeCareKey] || {
		answer: "",
		instructions: "",
		urgentSigns: [],
		sessions: [],
		activeSessionId: ""
	};
}

function getActiveCareSession(entry = getCareProgressEntry()) {
	return entry.sessions.find(session => session.id === entry.activeSessionId) || null;
}

function createCareSession(entry) {
	const stepCount = activeGuideCategory
		? CARE_GUIDES[activeGuideCategory]?.checklist.length || 0
		: 0;
	const session = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
		startedAt: new Date().toISOString(),
		legacy: false,
		currentStepIndex: 0,
		checklist: Array(stepCount).fill(false),
		completedAt: Array(stepCount).fill(null),
		observations: []
	};
	entry.sessions.push(session);
	entry.activeSessionId = session.id;
	return session;
}

function activateCareProgress() {
	if (!activeGuideCategory) return;
	const petName = elements.screeningPetName.value.trim().toLocaleLowerCase() || "guide";
	activeCareKey = `${selectedPet}|${petName}|${activeGuideCategory}`.slice(0, 220);
	const saved = getCareProgressEntry();
	careProgress.items[activeCareKey] = saved;
	document.querySelectorAll('input[name="vetAssessment"]').forEach(input => { input.checked = input.value === saved.answer; });
	document.querySelectorAll('input[name="urgentSign"]').forEach(input => { input.checked = saved.urgentSigns.includes(input.value); });
	elements.vetInstructions.value = saved.instructions;
	renderCareChecklist();
	renderCareSessionHistory(saved);
	updateCareSafetyState();
}

function renderCareJourney(leading, category = leading?.displayName) {
	renderCareJourneyForCategory(category, leading);
}

function renderCareJourneyForCategory(category, leading = null) {
	const guide = CARE_GUIDES[category];
	if (!guide) {
		elements.careJourney.hidden = true;
		elements.openCareJourney.hidden = true;
		return;
	}
	activeGuideCategory = category;
	const hasMatchingResult = Boolean(lastScreeningResult && leading && lastScreeningResult.predictedCategory === category);
	elements.careJourney.hidden = false;
	elements.careGuideLibrary.hidden = true;
	elements.careNoScreening.hidden = true;
	elements.careResultBanner.hidden = !hasMatchingResult;
	elements.careScoreCard.hidden = !hasMatchingResult;
	elements.careResultCategory.textContent = category;
	elements.careOriginalClass.textContent = hasMatchingResult
		? `Original model metadata class: ${JSON.stringify(leading.sourceName)}`
		: "";
	elements.careResultScore.textContent = hasMatchingResult
		? `Top model score: ${(leading.score * 100).toFixed(1)}%. This is a classification score for a visible pattern, not a confirmed disease or probability of disease.`
		: "";
	elements.careGuideOverview.textContent = `${CLASS_INFO[category].description} This category describes a visible pattern, not a confirmed disease.`;
	elements.careResultExplanation.textContent = guide.causes;
	elements.carePossibleCauses.textContent = guide.causes;
	elements.careScoreList.replaceChildren();
	if (hasMatchingResult) {
		lastScreeningResult.scores.forEach(score => {
			const row = document.createElement("p");
			const className = document.createElement("strong");
			className.textContent = score.className;
			className.title = `Normalized display category: ${score.displayName}`;
			const value = document.createElement("span");
			value.textContent = `${(score.probability * 100).toFixed(1)}% model score`;
			row.append(className, value);
			elements.careScoreList.append(row);
		});
	}
	elements.careHomeCare.textContent = guide.homeCare;
	renderTextList(elements.careFirstActions, guide.firstActions);
	renderTextList(elements.careAvoid, guide.avoid);
	elements.careWhenVet.textContent = guide.whenVet;
	elements.careVetOptions.textContent = guide.options;
	elements.careReferences.replaceChildren();
	guide.sources.forEach(sourceId => {
		const source = VETERINARY_SOURCES[sourceId];
		if (!source || (source.species && !source.species.includes(selectedPet))) return;
		const link = document.createElement("a");
		link.href = source.url;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		link.textContent = source.name;
		elements.careReferences.append(link);
	});
	const evidenceNote = document.createElement("p");
	evidenceNote.textContent = "These references cover the named veterinary guidelines or conditions; they do not establish the cause of this image pattern or a treatment for this pet.";
	elements.careReferences.append(evidenceNote);
	elements.careSpeciesLabel.textContent = selectedPet === "cat" ? "Cat guide" : "Dog guide";
	elements.careGuidePurpose.textContent = guide.purpose;
	renderTextList($("careGuideSupplies"), guide.supplies);
	renderTextList($("careGuidePrecautions"), guide.precautions);
	renderTextList($("careGuideAvoid"), guide.avoid);
	renderTextList($("careGuideMonitor"), guide.monitor);
	elements.careGuideVetContact.textContent = guide.vetContact;
	elements.openStepByStepGuide.textContent = "Continue to Care Guide";
	elements.stepByStepCareGuide.hidden = true;
	elements.openStepByStepGuide.setAttribute("aria-expanded", "false");
	activateCareProgress();
	updateCarePageAvailability();
}

function renderCareGuideLibrary() {
	const query = elements.careGuideSearch.value.trim().toLocaleLowerCase();
	const categories = Object.keys(CARE_GUIDES).filter(category => {
		const guide = CARE_GUIDES[category];
		const referenceTitles = guide.sources.map(sourceId => VETERINARY_SOURCES[sourceId]?.name || "").join(" ");
		const searchableText = [
			category,
			CLASS_INFO[category].description,
			guide.causes,
			guide.homeCare,
			guide.firstActions.join(" "),
			guide.avoid.join(" "),
			guide.whenVet,
			guide.options,
			guide.checklist.join(" "),
			referenceTitles
		].join(" ").toLocaleLowerCase();
		return searchableText.includes(query);
	});
	elements.careGuideCards.replaceChildren();
	elements.careGuideStatus.textContent = categories.length
		? `${categories.length} of ${Object.keys(CARE_GUIDES).length} available care guides`
		: "No available care guides match this search. Try a different skin concern.";
	categories.forEach(category => {
		const guide = CARE_GUIDES[category];
		const card = document.createElement("article");
		card.className = "care-guide-card";
		const icon = document.createElement("span");
		icon.className = "care-guide-card-icon";
		icon.setAttribute("aria-hidden", "true");
		icon.textContent = CARE_GUIDE_ICONS[category];
		const title = document.createElement("h3");
		title.textContent = category;
		const description = document.createElement("p");
		description.textContent = CLASS_INFO[category].description;
		const content = document.createElement("small");
		content.textContent = `${guide.checklist.length} observation steps · causes · veterinary options`;
		const button = document.createElement("button");
		button.type = "button";
		button.className = "treatment-button treatment-button-secondary";
		button.dataset.careGuide = category;
		button.textContent = "View Care Guide";
		card.append(icon, title, description, content, button);
		elements.careGuideCards.append(card);
	});
}

function renderTextList(list, items) {
	list.replaceChildren();
	items.forEach(text => {
		const item = document.createElement("li");
		item.textContent = text;
		list.append(item);
	});
}

function updateCareSafetyState() {
	if (!activeGuideCategory) return;
	const answer = document.querySelector('input[name="vetAssessment"]:checked')?.value || "";
	const urgentSigns = [...document.querySelectorAll('input[name="urgentSign"]:checked')].map(input => input.value);
	const response = {
		instructions: "Follow the veterinarian's directions exactly. This page does not replace, change, or schedule a prescribed medicine; use Treatment Progress to record the plan supplied by your veterinarian.",
		"not-consulted": "This checklist provides only low-risk observation and safety information. Arrange veterinary assessment when symptoms persist, spread, recur, or cause discomfort.",
		worsening: "Contact a veterinarian for reassessment rather than trying a new or stronger treatment based on the image classification."
	}[answer] || "Choose an option to see the relevant safety guidance. You can still read all educational information above.";
	elements.careSafetyResponse.textContent = response;
	elements.vetInstructionsPanel.hidden = answer !== "instructions";
	elements.worseningCareNotice.hidden = answer !== "worsening";
	elements.urgentCareNotice.hidden = urgentSigns.length === 0;
	elements.openStepByStepGuide.disabled = !answer;
	elements.openStepByStepGuideCard.disabled = !answer;
	elements.careContinueDescription.textContent = answer === "worsening"
		? "Veterinary reassessment is the next step. The guide will show the warning and hide routine checklist actions."
		: urgentSigns.length
			? "Urgent veterinary care is recommended. The routine checklist will remain hidden."
			: answer === "instructions"
				? "Continue with general observation steps while following the veterinarian's instructions exactly."
				: answer === "not-consulted"
					? "Continue to the general, low-risk observation checklist; it does not replace veterinary care."
					: "Select a safety-check option to open the relevant educational care guide.";
	const shouldHoldRoutineSteps = answer === "worsening" || urgentSigns.length > 0;
	$("careChecklistHeading").hidden = shouldHoldRoutineSteps;
	$("careChecklistHelper").hidden = shouldHoldRoutineSteps;
	$("careProgress").hidden = shouldHoldRoutineSteps;
	elements.careChecklist.hidden = shouldHoldRoutineSteps;
	elements.careStepNavigation.hidden = shouldHoldRoutineSteps || elements.careChecklist.children.length < 2;
	elements.careSessionControls.hidden = shouldHoldRoutineSteps;
	elements.careObservationForm.hidden = shouldHoldRoutineSteps;
	updateCareProcess(answer, shouldHoldRoutineSteps);
	if (activeCareKey) {
		const saved = getCareProgressEntry();
		careProgress.items[activeCareKey] = { ...saved, answer, urgentSigns };
		persistCareProgress();
	}
}

function updateCareProcess(answer, needsVeterinaryCare) {
	const steps = [...document.querySelectorAll(".care-process li")];
	steps.forEach((step, index) => {
		step.classList.remove("is-complete", "is-current");
		step.removeAttribute("aria-current");
		if (index === 0) step.classList.add("is-complete");
	});
	if (!answer) {
		steps[1]?.classList.add("is-current");
		steps[1]?.setAttribute("aria-current", "step");
		return;
	}
	for (let index = 1; index <= 3; index++) steps[index]?.classList.add("is-complete");
	const guideOpen = !elements.stepByStepCareGuide.hidden;
	const currentIndex = needsVeterinaryCare ? 6 : guideOpen ? 5 : 4;
	if (needsVeterinaryCare) {
		steps[6]?.classList.add("is-current");
		steps[6]?.setAttribute("aria-current", "step");
		return;
	}
	if (guideOpen) steps[4]?.classList.add("is-complete");
	steps[currentIndex]?.classList.add("is-current");
	steps[currentIndex]?.setAttribute("aria-current", "step");
}

function saveVeterinaryInstructions() {
	if (!activeCareKey) return;
	if (elements.vetInstructions.value.length > 1000) {
		elements.careSaveStatus.textContent = "Veterinary instructions must be 1,000 characters or fewer.";
		return;
	}
	const saved = getCareProgressEntry();
	careProgress.items[activeCareKey] = { ...saved, instructions: elements.vetInstructions.value.trim() };
	persistCareProgress("Veterinary instructions saved in this browser on this device. Follow them exactly as provided by your veterinarian.");
}

function openStepByStepCareGuide() {
	if (elements.openStepByStepGuide.disabled) return;
	elements.stepByStepCareGuide.hidden = false;
	updateCareSafetyState();
	elements.stepByStepCareGuide.scrollIntoView({ behavior: "smooth", block: "start" });
	elements.openStepByStepGuide.setAttribute("aria-expanded", "true");
}

function renderCareChecklist() {
	if (!activeGuideCategory) return;
	const guide = CARE_GUIDES[activeGuideCategory];
	if (!guide) return;
	const session = getActiveCareSession();
	const currentStepIndex = session?.currentStepIndex || 0;
	elements.careChecklist.replaceChildren();
	guide.checklist.forEach((text, index) => {
		const item = document.createElement("li");
		item.classList.toggle("is-current", index === currentStepIndex);
		const label = document.createElement("label");
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.dataset.careStep = String(index);
		checkbox.checked = session?.checklist[index] === true;
		if (index === currentStepIndex) label.setAttribute("aria-current", "step");
		const description = document.createElement("span");
		description.textContent = text;
		label.append(checkbox, description);
		item.append(label);
		if (session?.completedAt[index]) {
			const completedDate = document.createElement("small");
			completedDate.className = "care-step-date";
			completedDate.textContent = `Completed ${formatCareDate(session.completedAt[index])}`;
			item.append(completedDate);
		}
		elements.careChecklist.append(item);
	});
	elements.careSessionDate.textContent = session
		? session.startedAt ? `Active session started ${formatCareDate(session.startedAt)}` : "Active session imported from earlier saved checklist (date unavailable)"
		: "No care session started yet.";
	elements.careStepNavigation.hidden = guide.checklist.length < 2 || elements.careChecklist.hidden;
	elements.previousCareStep.disabled = currentStepIndex === 0;
	elements.nextCareStep.disabled = currentStepIndex >= guide.checklist.length - 1;
	elements.careStepPosition.textContent = `Step ${currentStepIndex + 1} of ${guide.checklist.length}`;
	updateCareChecklistProgress();
}

function saveCareChecklist() {
	if (!activeCareKey) return;
	const entry = getCareProgressEntry();
	const session = getActiveCareSession(entry) || createCareSession(entry);
	const checkboxes = [...elements.careChecklist.querySelectorAll('input[type="checkbox"]')];
	session.checklist = checkboxes.map(input => input.checked);
	session.completedAt = checkboxes.map((input, index) => input.checked
		? session.completedAt[index] || new Date().toISOString()
		: null);
	careProgress.items[activeCareKey] = entry;
	persistCareProgress("Care checklist and completion dates saved in this browser on this device.");
	renderCareChecklist();
	renderCareSessionHistory(entry);
	updateCareChecklistProgress();
}

function moveCareStep(direction) {
	if (!activeCareKey || !activeGuideCategory) return;
	const guide = CARE_GUIDES[activeGuideCategory];
	const entry = getCareProgressEntry();
	const session = getActiveCareSession(entry) || createCareSession(entry);
	session.currentStepIndex = Math.max(0, Math.min(guide.checklist.length - 1, session.currentStepIndex + direction));
	careProgress.items[activeCareKey] = entry;
	if (!persistCareProgress("Care-guide step position saved in this browser on this device.")) return;
	renderCareChecklist();
	elements.careChecklist.querySelector(".is-current input")?.focus();
}

function startNewCareSession() {
	if (!activeCareKey || !activeGuideCategory) return;
	const entry = getCareProgressEntry();
	createCareSession(entry);
	careProgress.items[activeCareKey] = entry;
	persistCareProgress("New care session saved. Earlier sessions and their records were retained.");
	renderCareChecklist();
	renderCareSessionHistory(entry);
}

function saveCareObservation(event) {
	event.preventDefault();
	if (!activeCareKey || !activeGuideCategory) return;
	const note = elements.careObservationNote.value.trim();
	if (!note) {
		elements.careSaveStatus.textContent = "Enter an observation before saving.";
		return;
	}
	const entry = getCareProgressEntry();
	const session = getActiveCareSession(entry) || createCareSession(entry);
	session.observations.unshift({ at: new Date().toISOString(), note });
	if (session.observations.length > 500) session.observations.length = 500;
	careProgress.items[activeCareKey] = entry;
	if (persistCareProgress("Observation saved in this browser on this device.")) {
		elements.careObservationNote.value = "";
		renderCareChecklist();
		renderCareSessionHistory(entry);
	}
}

function formatCareDate(value) {
	return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function renderCareSessionHistory(entry = getCareProgressEntry()) {
	elements.careSessionHistory.replaceChildren();
	elements.careObservationHistory.replaceChildren();
	const sessions = [...entry.sessions].sort((a, b) =>
		(b.startedAt ? Date.parse(b.startedAt) : 0) - (a.startedAt ? Date.parse(a.startedAt) : 0));
	sessions.forEach(session => {
		const row = document.createElement("li");
		const title = session.legacy
			? "Earlier checklist (date unavailable)"
			: `Session started ${formatCareDate(session.startedAt)}`;
		const completed = session.checklist.filter(Boolean).length;
		row.textContent = `${title} · ${completed} of ${session.checklist.length} steps completed${session.id === entry.activeSessionId ? " · Active" : ""}`;
		elements.careSessionHistory.append(row);
		session.observations.forEach(observation => {
			const note = document.createElement("li");
			const date = document.createElement("time");
			date.dateTime = observation.at;
			date.textContent = formatCareDate(observation.at);
			const text = document.createElement("span");
			text.textContent = observation.note;
			note.append(date, text);
			elements.careObservationHistory.append(note);
		});
	});
}

function updateCareChecklistProgress() {
	const checkboxes = [...elements.careChecklist.querySelectorAll('input[type="checkbox"]')];
	const completed = checkboxes.filter(input => input.checked).length;
	const percentage = checkboxes.length ? completed / checkboxes.length * 100 : 0;
	elements.careProgressText.textContent = `${completed} of ${checkboxes.length} steps completed`;
	elements.careProgressTrack.setAttribute("aria-valuenow", percentage.toFixed(0));
	elements.careProgressFill.style.width = `${percentage}%`;
}

function persistCareProgress(successMessage = "Care-guide data saved in this browser on this device.") {
	if (!careProgressAvailable) {
		elements.careSaveStatus.textContent = "Care-guide changes are shown but could not be saved because stored data is unavailable or invalid.";
		return false;
	}
	try {
		window.localStorage.setItem(CARE_PROGRESS_KEY, JSON.stringify(careProgress));
		elements.careSaveStatus.textContent = successMessage;
		return true;
	} catch (error) {
		elements.careSaveStatus.textContent = `Care-guide changes could not be saved in this browser: ${error.message || "storage is unavailable"}.`;
		return false;
	}
}

async function startTreatmentTracking() {
	if (!lastScreeningResult || !selectedFile) {
		showError("Run an image screening before starting treatment tracking from its result.");
		return;
	}
	let petName = elements.screeningPetName.value.trim() || lastScreeningResult.petName;
	if (!petName) {
		petName = window.prompt(`Enter a name or identifier for this ${selectedPet}:`)?.trim() || "";
		if (!petName) return;
		elements.screeningPetName.value = petName;
	}
	try {
		const photo = await compressImageForLocalStorage(elements.previewImage);
		const screeningRecord = {
			...lastScreeningResult,
			petName,
			photo
		};
		window.sessionStorage.setItem("dermapaw-screening-handoff-v1", JSON.stringify(screeningRecord));
		window.location.hash = "#treatment";
	} catch (error) {
		showError(error.message || "The screening result could not be transferred to Treatment Progress.");
	}
}

async function compressImageForLocalStorage(image) {
	await waitForImageElement(image);
	const maxDimension = 1280;
	const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
	canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
	const context = canvas.getContext("2d");
	if (!context) throw new Error("This browser could not prepare the screening photo for local storage.");
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
	for (const quality of [0.82, 0.68, 0.54, 0.4]) {
		const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
		if (blob && blob.size <= 512 * 1024) return readBlobAsDataUrl(blob);
	}
	throw new Error("The screening photo could not be compressed below the 512 KB local photo limit. You can still create a progress record without transferring the photo.");
}

function readBlobAsDataUrl(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The screening photo could not be encoded."));
		reader.onerror = () => reject(reader.error || new Error("The screening photo could not be read."));
		reader.readAsDataURL(blob);
	});
}

function showError(message) {
	elements.errorBox.textContent = message;
	elements.errorBox.hidden = false;
}

function hideError() {
	elements.errorBox.textContent = "";
	elements.errorBox.hidden = true;
}
