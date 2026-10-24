export const RECOVERY_EVIDENCE = [
	{
		id: "iscaid-canine-pyoderma-2025",
		title: "Antimicrobial use guidelines for canine pyoderma by the International Society for Companion Animal Infectious Diseases (ISCAID)",
		year: 2025,
		url: "https://doi.org/10.1111/vde.13342",
		condition: "Canine staphylococcal pyoderma",
		conditionKeywords: ["pyoderma"],
		species: ["dog"],
		populationContext: "Veterinarian-assessed canine surface, superficial, and deep staphylococcal pyoderma.",
		treatmentContext: "Guideline recommendations for topical and systemic antimicrobial therapy, with re-examination.",
		treatmentKeywords: ["antimicrobial", "antibiotic"],
		reportedOutcome: "The abstract describes initial systemic therapy of 2 weeks for superficial and 3 weeks for deep pyoderma, followed by re-examination. These are initial treatment-course recommendations and reassessment points, not time-to-improvement or time-to-resolution estimates.",
		improvementRangeDays: null,
		resolutionRangeDays: null,
		estimateMethod: null,
		specificRecoveryDayOffset: null,
		specificRecoveryDayMethod: null,
		missedTreatmentAdjustmentDays: null,
		missedTreatmentAdjustmentMethod: null,
		limitations: "Applies to veterinarian-assessed canine pyoderma, not arbitrary image patterns or other conditions. The stated durations must not be interpreted as recovery times or substituted for an individual veterinarian's plan.",
		evidenceQualityNotes: "Guideline recommendations based on a systematic review of English-language treatment studies through December 2023, SORT quality assessment, and consensus. The abstract was reviewed; this app does not encode a quantitative prognosis from the guideline.",
		verifiedMetadata: true,
		evaluatesTreatmentAdherence: false,
		supportsRecoveryEstimate: false,
		supportsMissedTreatmentAdjustment: false
	},
	{
		id: "wavd-dermatophytosis-2017",
		title: "Diagnosis and treatment of dermatophytosis in dogs and cats",
		year: 2017,
		url: "https://doi.org/10.1111/vde.12440",
		condition: "Dermatophytosis",
		conditionKeywords: ["dermatophytosis", "ringworm"],
		species: ["cat", "dog"],
		populationContext: "Dogs and cats with veterinarian-assessed dermatophytosis.",
		treatmentContext: "Consensus recommendations include concurrent systemic antifungal treatment and topical disinfection of the hair coat.",
		treatmentKeywords: ["antifungal"],
		reportedOutcome: "The abstract reports consensus diagnostic and treatment recommendations, but no numerical time-to-improvement or time-to-resolution range.",
		improvementRangeDays: null,
		resolutionRangeDays: null,
		estimateMethod: null,
		specificRecoveryDayOffset: null,
		specificRecoveryDayMethod: null,
		missedTreatmentAdjustmentDays: null,
		missedTreatmentAdjustmentMethod: null,
		limitations: "Guideline literature review covered evidence available before September 2016. This source does not establish a numerical recovery timeline or a missed-treatment delay.",
		evidenceQualityNotes: "World Association for Veterinary Dermatology consensus guideline with a literature review; this app reviewed the indexed abstract and does not extrapolate a quantitative prognosis.",
		verifiedMetadata: true,
		evaluatesTreatmentAdherence: false,
		supportsRecoveryEstimate: false,
		supportsMissedTreatmentAdjustment: false
	},
	{
		id: "aaha-allergic-skin-2023",
		title: "2023 AAHA Management of Allergic Skin Diseases in Dogs and Cats Guidelines",
		year: 2023,
		url: "https://doi.org/10.5326/jaaha-ms-7396",
		condition: "Veterinarian-assessed allergic skin disease",
		conditionKeywords: ["allergic skin", "atopy", "atopic dermatitis", "flea allergy", "food allergy"],
		species: ["cat", "dog"],
		populationContext: "Dogs and cats with the allergic skin diseases covered in the guideline.",
		treatmentContext: "Guidelines for diagnosis and multimodal management of allergic skin disease, including flea allergy, food allergy, and atopic disease.",
		treatmentKeywords: ["allergy", "allergic", "atopy"],
		reportedOutcome: "The abstract describes diagnosis and ongoing management; it notes that management can be prolonged, but provides no specific time-to-improvement or time-to-resolution range.",
		improvementRangeDays: null,
		resolutionRangeDays: null,
		estimateMethod: null,
		specificRecoveryDayOffset: null,
		specificRecoveryDayMethod: null,
		missedTreatmentAdjustmentDays: null,
		missedTreatmentAdjustmentMethod: null,
		limitations: "Applies to the specified allergic diseases, not all skin conditions. The supplied DOI 10.5326/JAAHA-MS-7368 resolves to 2023 AAHA Selected Endocrinopathies of Dogs and Cats Guidelines, not allergic skin disease, and is excluded as mismatched.",
		evidenceQualityNotes: "Professional practice guideline describing a systematic diagnostic and management approach. The indexed abstract does not provide a numeric recovery outcome suitable for this app.",
		verifiedMetadata: true,
		evaluatesTreatmentAdherence: false,
		supportsRecoveryEstimate: false,
		supportsMissedTreatmentAdjustment: false
	}
];

export function getRecoveryOutlook(record) {
	const condition = record?.condition?.trim().toLowerCase() || "";
	const medicine = record?.medicine?.trim().toLowerCase() || "";
	const matchingSources = RECOVERY_EVIDENCE.filter(source =>
		source.verifiedMetadata &&
		source.species.includes(record?.species) &&
		source.conditionKeywords.some(keyword => condition.includes(keyword)) &&
		source.treatmentKeywords.some(keyword => medicine.includes(keyword))
	);
	const eligibleSource = matchingSources.find(source =>
		source.supportsRecoveryEstimate &&
		typeof source.estimateMethod === "string" &&
		(isValidRange(source.improvementRangeDays) || isValidRange(source.resolutionRangeDays)) &&
		(typeof source.initialImprovementOutcome === "string" || typeof source.resolutionOutcome === "string")
	);
	const hasSpecificDay = eligibleSource && typeof eligibleSource.specificRecoveryDayMethod === "string" &&
		Number.isInteger(eligibleSource.specificRecoveryDayOffset) &&
		eligibleSource.specificRecoveryDayOffset >= 0 && eligibleSource.specificRecoveryDayOffset <= 3650;
	const missedTreatmentAdjustmentDays = matchingSources.find(source =>
		source.supportsMissedTreatmentAdjustment &&
		typeof source.missedTreatmentAdjustmentMethod === "string" &&
		Number.isInteger(source.missedTreatmentAdjustmentDays) &&
		source.missedTreatmentAdjustmentDays >= 0 &&
		source.missedTreatmentAdjustmentDays <= 3650
	)?.missedTreatmentAdjustmentDays ?? null;

	if (eligibleSource) {
		const estimatedRecoveryDate = hasSpecificDay && record?.startDate
			? addDays(record.startDate, eligibleSource.specificRecoveryDayOffset)
			: null;
		return {
			status: "Evidence-matched outcome available; review the source and limitations.",
			improvementRangeDays: isValidRange(eligibleSource.improvementRangeDays) ? eligibleSource.improvementRangeDays : null,
			resolutionRangeDays: isValidRange(eligibleSource.resolutionRangeDays) ? eligibleSource.resolutionRangeDays : null,
			estimatedRecoveryDate,
			missedTreatmentAdjustmentDays,
			sourceIds: [eligibleSource.id],
			message: "Evidence-matched information is available; it is not a guarantee.",
			missedTreatmentMessage: missedTreatmentAdjustmentDays === null
				? "Insufficient evidence to calculate how missed treatment may affect recovery time."
				: "A missed-treatment adjustment is available only for this explicitly matched source and treatment context."
		};
	}
	return {
		status: "Insufficient evidence",
		improvementRangeDays: null,
		resolutionRangeDays: null,
		estimatedRecoveryDate: null,
		missedTreatmentAdjustmentDays: null,
		sourceIds: matchingSources.map(source => source.id),
		message: "A reliable specific recovery-day estimate is unavailable for this case. Review the evidence-supported information below and consult the veterinarian.",
		missedTreatmentMessage: "Insufficient evidence to calculate how missed treatment may affect recovery time."
	};
}

function addDays(dateOnly, days) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
	const date = new Date(`${dateOnly}T00:00:00.000Z`);
	if (!Number.isFinite(date.getTime())) return null;
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

function isValidRange(range) {
	return range && Number.isInteger(range.min) && Number.isInteger(range.max) &&
		range.min >= 0 && range.max >= range.min && range.max <= 3650;
}
