// BD CGPA Calculator - Main JavaScript File
// Modular vanilla JS implementation with LocalStorage persistence

// ==============================================
// CONSTANTS & CONFIGURATION
// ==============================================

const UGC_GRADE_MAPPING = {
  "A+": { gpa: 4.0, minPercent: 80, maxPercent: 100 },
  A: { gpa: 3.75, minPercent: 75, maxPercent: 79 },
  "A-": { gpa: 3.5, minPercent: 70, maxPercent: 74 },
  "B+": { gpa: 3.25, minPercent: 65, maxPercent: 69 },
  B: { gpa: 3.0, minPercent: 60, maxPercent: 64 },
  "B-": { gpa: 2.75, minPercent: 55, maxPercent: 59 },
  "C+": { gpa: 2.5, minPercent: 50, maxPercent: 54 },
  C: { gpa: 2.25, minPercent: 45, maxPercent: 49 },
  D: { gpa: 2.0, minPercent: 40, maxPercent: 44 },
  F: { gpa: 0.0, minPercent: 0, maxPercent: 39 },
};

const UNIVERSITY_PRESETS = {
  ugc: {
    name: "UGC Standard",
    mapping: UGC_GRADE_MAPPING,
    info: "A+ (4.00), A (3.75), A- (3.50), B+ (3.25), B (3.00), B- (2.75), C+ (2.50), C (2.25), D (2.00), F (0.00)",
  },
  du: {
    name: "University of Dhaka (DU)",
    mapping: UGC_GRADE_MAPPING,
    info: "Follows UGC standard with 4.00 scale",
  },
  buet: {
    name: "BUET",
    mapping: UGC_GRADE_MAPPING,
    info: "BUET follows UGC grading system",
  },
  nsu: {
    name: "North South University (NSU)",
    mapping: UGC_GRADE_MAPPING,
    info: "NSU uses 4.00 scale with UGC mapping",
  },
  brac: {
    name: "BRAC University",
    mapping: UGC_GRADE_MAPPING,
    info: "BRAC follows standard UGC grading",
  },
  iub: {
    name: "Independent University Bangladesh (IUB)",
    mapping: UGC_GRADE_MAPPING,
    info: "IUB uses 4.00 point scale",
  },
  ruet: {
    name: "RUET",
    mapping: UGC_GRADE_MAPPING,
    info: "RUET follows UGC standard grading",
  },
  aust: {
    name: "AUST",
    mapping: UGC_GRADE_MAPPING,
    info: "AUST uses standard 4.00 scale",
  },
  iut: {
    name: "Islamic University of Technology (IUT)",
    mapping: UGC_GRADE_MAPPING,
    info: "IUT follows UGC grading system",
  },
  custom: {
    name: "Custom Grading Scale",
    mapping: UGC_GRADE_MAPPING,
    info: "Define your own grading scale",
  },
};

const STORAGE_KEYS = {
  subjects: "bdcgpa_subjects",
  scenarios: "bdcgpa_scenarios",
  university: "bdcgpa_university",
  theme: "bdcgpa_theme",
};

// ==============================================
// GLOBAL STATE
// ==============================================

let subjects = [];
let currentUniversity = "ugc";
let scenarios = {};

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

function parseNumber(value, defaultValue = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function formatGPA(gpa) {
  return parseNumber(gpa).toFixed(2);
}

function validateCredit(credit) {
  const parsed = parseNumber(credit);
  return parsed >= 0.5 && parsed <= 6 ? parsed : null;
}

function showSimpleMessage(message, type = "info") {
  // Create a simple status element if it doesn't exist
  let statusEl = document.getElementById("simple-status");
  if (!statusEl) {
    statusEl = document.createElement("div");
    statusEl.id = "simple-status";
    statusEl.className =
      "fixed top-4 right-4 px-3 py-2 rounded text-sm font-medium transition-all duration-300 z-50";
    document.body.appendChild(statusEl);
  }

  // Set colors based on type
  const colors = {
    success: "bg-green-100 text-green-800 border border-green-200",
    error: "bg-red-100 text-red-800 border border-red-200",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    info: "bg-blue-100 text-blue-800 border border-blue-200",
  };

  statusEl.className = `fixed top-4 right-4 px-3 py-2 rounded text-sm font-medium transition-all duration-300 z-50 ${
    colors[type] || colors.info
  }`;
  statusEl.textContent = message;
  statusEl.style.display = "block";
  statusEl.style.opacity = "1";

  // Auto hide after 2 seconds
  setTimeout(() => {
    statusEl.style.opacity = "0";
    setTimeout(() => {
      statusEl.style.display = "none";
    }, 300);
  }, 2000);
}

// ==============================================
// GRADE CONVERSION FUNCTIONS
// ==============================================

function gradeToGPA(grade) {
  const mapping = UNIVERSITY_PRESETS[currentUniversity].mapping;
  const upperGrade = grade.toUpperCase();
  return mapping[upperGrade] ? mapping[upperGrade].gpa : 0.0;
}

// ==============================================
// CALCULATION FUNCTIONS
// ==============================================

function computeSemesterGPA(subjectList = subjects) {
  if (subjectList.length === 0) return 0.0;

  let totalCredits = 0;
  let totalGradePoints = 0;

  for (const subject of subjectList) {
    totalCredits += subject.credit;
    totalGradePoints += subject.credit * subject.gpa;
  }

  return totalCredits > 0 ? totalGradePoints / totalCredits : 0.0;
}

function computeCGPA() {
  // For now, CGPA equals semester GPA since we're handling one semester
  // In a multi-semester implementation, this would include semester history
  return computeSemesterGPA();
}

function getTotalCredits() {
  return subjects.reduce((total, subject) => total + subject.credit, 0);
}

// ==============================================
// SUBJECT MANAGEMENT
// ==============================================

function addSubject(name, credit, letterGrade) {
  try {
    const validatedCredit = validateCredit(credit);
    if (!validatedCredit) {
      throw new Error("Credit must be between 0.5 and 6.0");
    }

    const gradeMapping =
      UNIVERSITY_PRESETS[currentUniversity].mapping[letterGrade];
    if (!gradeMapping) {
      throw new Error("Invalid letter grade selected");
    }

    const subject = {
      id: Date.now(),
      name: name.trim(),
      credit: validatedCredit,
      mode: "letter",
      originalValue: letterGrade,
      displayGrade: letterGrade,
      gpa: gradeMapping.gpa,
    };

    subjects.push(subject);
    saveToStorage();
    renderSubjectsList();
    updateResults();

    return true;
  } catch (error) {
    showSimpleMessage(error.message, "error");
    return false;
  }
}

function removeSubject(id) {
  const index = subjects.findIndex((subject) => subject.id === id);
  if (index !== -1) {
    subjects.splice(index, 1);
    saveToStorage();
    renderSubjectsList();
    updateResults();
  }
}

function clearAllSubjects() {
  subjects = [];
  saveToStorage();
  renderSubjectsList();
  updateResults();
}

// ==============================================
// UI RENDERING FUNCTIONS
// ==============================================

function renderSubjectsList() {
  const container = document.getElementById("subjects-list");
  const emptyState = document.getElementById("empty-state");
  const template = document.getElementById("subject-row-template");

  // Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();

  // Clear existing subjects (except empty state) more efficiently
  const existingRows = container.querySelectorAll(".subject-row");
  existingRows.forEach((row) => row.remove());

  if (subjects.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  // Batch DOM updates
  subjects.forEach((subject) => {
    const row = template.content.cloneNode(true);

    // Cache DOM queries for both mobile and desktop layouts
    const nameEl = row.querySelector(".subject-name");
    const modeEl = row.querySelector(".subject-mode");
    const creditEl = row.querySelector(".subject-credit");
    const gradeEl = row.querySelector(".subject-grade");
    const gpaEl = row.querySelector(".subject-gpa");
    
    // Mobile layout elements
    const nameElMobile = row.querySelector(".subject-name-mobile");
    const modeElMobile = row.querySelector(".subject-mode-mobile");
    const creditElMobile = row.querySelector(".subject-credit-mobile");
    const gradeElMobile = row.querySelector(".subject-grade-mobile");
    const gpaElMobile = row.querySelector(".subject-gpa-mobile");
    
    const removeBtn = row.querySelector(".remove-btn");
    const removeBtnDesktop = row.querySelector(".remove-btn-desktop");
    const rowElement = row.querySelector(".subject-row");

    // Update content efficiently for both layouts
    // Desktop layout
    if (nameEl) nameEl.textContent = subject.name;
    if (modeEl) modeEl.textContent = `(${subject.mode})`;
    if (creditEl) creditEl.textContent = subject.credit.toFixed(1);
    if (gradeEl) gradeEl.textContent = subject.displayGrade;
    if (gpaEl) gpaEl.textContent = formatGPA(subject.gpa);
    
    // Mobile layout
    if (nameElMobile) nameElMobile.textContent = subject.name;
    if (modeElMobile) modeElMobile.textContent = `(${subject.mode})`;
    if (creditElMobile) creditElMobile.textContent = subject.credit.toFixed(1);
    if (gradeElMobile) gradeElMobile.textContent = subject.displayGrade;
    if (gpaElMobile) gpaElMobile.textContent = formatGPA(subject.gpa);

    // Set up event listeners for both remove buttons
    const removeHandler = () => removeSubject(subject.id);
    if (removeBtn) {
      removeBtn.addEventListener("click", removeHandler, { once: false });
    }
    if (removeBtnDesktop) {
      removeBtnDesktop.addEventListener("click", removeHandler, { once: false });
    }

    rowElement.dataset.id = subject.id;
    fragment.appendChild(row);
  });

  // Single DOM update
  container.appendChild(fragment);
}

// Add debouncing for performance optimization
let updateResultsTimeout;

function updateResults() {
  // Debounce updates to prevent excessive recalculations
  clearTimeout(updateResultsTimeout);
  updateResultsTimeout = setTimeout(() => {
    const cgpa = computeSemesterGPA(); // Since it's single semester, use semester calculation
    const totalCredits = getTotalCredits();

    console.log("Updating results:", { cgpa, totalCredits });

    // Batch DOM updates
    requestAnimationFrame(() => {
      const cgpaEl = document.getElementById("cumulative-cgpa");
      const creditsEl = document.getElementById("total-credits");

      if (cgpaEl) {
        cgpaEl.textContent = cgpa.toFixed(2);
        console.log("Updated CGPA to:", cgpa.toFixed(2));
      }
      if (creditsEl) {
        creditsEl.textContent = totalCredits.toFixed(1);
        console.log("Updated total credits to:", totalCredits.toFixed(1));
      }
    });
  }, 50);
}

function updateUniversityInfo() {
  const preset = UNIVERSITY_PRESETS[currentUniversity];
  document.getElementById(
    "grading-info"
  ).innerHTML = `<strong>${preset.name}:</strong> ${preset.info}`;
}

// ==============================================
// FORM HANDLING
// ==============================================

function initializeForm() {
  const form = document.getElementById("add-subject-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("subject-name").value;
    const credit = document.getElementById("subject-credit").value;
    const letterGrade = document.getElementById("grade-select").value;

    if (addSubject(name, credit, letterGrade)) {
      form.reset();
    }
  });
}

function quickAddSubject(name, credit) {
  document.getElementById("subject-name").value = name;
  document.getElementById("subject-credit").value = credit;
  document.getElementById("grade-select").focus();
}

// ==============================================
// UNIVERSITY SELECTION
// ==============================================

function initializeUniversitySelector() {
  const selector = document.getElementById("university-select");

  selector.addEventListener("change", function () {
    currentUniversity = this.value;
    updateUniversityInfo();
    saveToStorage();

    // Recalculate all subjects with new grading scale
    subjects.forEach((subject) => {
      if (subject.mode === "letter" || subject.mode === "percentage") {
        try {
          const gradeData = parseGradeInput(
            subject.originalValue,
            subject.mode
          );
          subject.displayGrade = gradeData.displayGrade;
          subject.gpa = gradeData.gpa;
        } catch (error) {
          console.warn("Failed to recalculate subject:", subject.name, error);
        }
      }
    });

    renderSubjectsList();
    updateResults();
  });
}

// ==============================================
// CSV IMPORT/EXPORT
// ==============================================

function parseCSV(text) {
  const lines = text
    .trim()
    .split("\n")
    .filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0]
    .toLowerCase()
    .split(",")
    .map((h) => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    // Normalize column names
    const normalized = {
      name: row.subject || row.name || row.course || "",
      credit: parseNumber(row.credit || row.credits || row.hour || row.hours),
      value:
        row.grade || row.mark || row.marks || row.gpa || row.percentage || "",
      mode: "letter", // Will be determined based on value
    };

    // Determine mode based on value
    if (
      normalized.value.includes("%") ||
      (!isNaN(normalized.value) && parseNumber(normalized.value) > 4)
    ) {
      normalized.mode = "percentage";
      normalized.value = normalized.value.replace("%", "");
    } else if (!isNaN(normalized.value) && parseNumber(normalized.value) <= 4) {
      normalized.mode = "gpa";
    } else {
      normalized.mode = "letter";
    }

    data.push(normalized);
  }

  return data;
}

function importCSV() {
  const csvText = document.getElementById("csv-input").value.trim();
  if (!csvText) {
    showSimpleMessage("Please paste CSV data first", "warning");
    return;
  }

  try {
    const data = parseCSV(csvText);
    let imported = 0;
    let errors = 0;

    data.forEach((row) => {
      if (row.name && row.credit > 0 && row.value) {
        if (addSubject(row.name, row.credit, row.value, row.mode)) {
          imported++;
        } else {
          errors++;
        }
      } else {
        errors++;
      }
    });

    document.getElementById("csv-input").value = "";
    showSimpleMessage(
      `Imported ${imported} subjects${errors > 0 ? `, ${errors} errors` : ""}`,
      "success"
    );
  } catch (error) {
    showSimpleMessage("Failed to parse CSV: " + error.message, "error");
  }
}

function exportData() {
  if (subjects.length === 0) {
    showSimpleMessage("No subjects to export", "warning");
    return;
  }

  // Create CSV content
  let csvContent = "Subject Name,Credit Hours,Grade,GPA,Mode\n";

  subjects.forEach((subject) => {
    csvContent += `"${subject.name}","${subject.credit}","${subject.displayGrade}","${subject.gpa}","${subject.mode}"\n`;
  });

  // Add summary information
  csvContent += "\nSUMMARY\n";
  csvContent += `Total Credits,${getTotalCredits()}\n`;
  csvContent += `Semester GPA,${computeSemesterGPA().toFixed(2)}\n`;
  csvContent += `Cumulative CGPA,${computeCGPA().toFixed(2)}\n`;
  csvContent += `University,${UNIVERSITY_PRESETS[currentUniversity].name}\n`;
  csvContent += `Export Date,${new Date().toLocaleDateString()}\n`;

  const blob = new Blob([csvContent], {
    type: "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bd-cgpa-export-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showSimpleMessage("Exported successfully!", "success");
}

// ==============================================
// TARGET PLANNER
// ==============================================

function calculateTargetGrades() {
  const targetCGPA = parseNumber(document.getElementById("target-cgpa").value);
  const remainingCredits = parseNumber(
    document.getElementById("remaining-credits").value
  );

  if (targetCGPA <= 0 || targetCGPA > 4) {
    showSimpleMessage("Target CGPA must be between 0.01 and 4.00", "error");
    return;
  }

  if (remainingCredits <= 0) {
    showSimpleMessage("Remaining credits must be greater than 0", "error");
    return;
  }

  const currentCredits = getTotalCredits();
  const currentTotalGradePoints = subjects.reduce(
    (total, subject) => total + subject.credit * subject.gpa,
    0
  );

  const totalCreditsNeeded = currentCredits + remainingCredits;
  const requiredTotalGradePoints = targetCGPA * totalCreditsNeeded;
  const requiredRemainingGradePoints =
    requiredTotalGradePoints - currentTotalGradePoints;
  const requiredAverageGPA = requiredRemainingGradePoints / remainingCredits;

  const resultDiv = document.getElementById("target-result");

  if (requiredAverageGPA < 0) {
    resultDiv.innerHTML = `<div class="p-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
            <strong>Good news!</strong> You've already exceeded your target CGPA of ${formatGPA(
              targetCGPA
            )}.
        </div>`;
  } else if (requiredAverageGPA > 4.0) {
    resultDiv.innerHTML = `<div class="p-3 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
            <strong>Target not achievable.</strong> You would need an average GPA of ${formatGPA(
              requiredAverageGPA
            )} 
            in remaining courses, which exceeds the maximum of 4.00.
        </div>`;
  } else {
    // Find nearest letter grade
    let nearestGrade = "F";
    let minDiff = Infinity;
    const mapping = UNIVERSITY_PRESETS[currentUniversity].mapping;

    for (const [grade, data] of Object.entries(mapping)) {
      const diff = Math.abs(data.gpa - requiredAverageGPA);
      if (diff < minDiff) {
        minDiff = diff;
        nearestGrade = grade;
      }
    }

    resultDiv.innerHTML = `<div class="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg">
            <strong>Target achievable!</strong><br>
            Required average GPA: <strong>${formatGPA(
              requiredAverageGPA
            )}</strong><br>
            Nearest letter grade: <strong>${nearestGrade}</strong><br>
            <small>You need to maintain approximately <strong>${nearestGrade}</strong> grade in your remaining ${remainingCredits} credits.</small>
        </div>`;
  }
}

// ==============================================
// SCENARIO MANAGEMENT
// ==============================================

function saveScenario() {
  const name = document.getElementById("scenario-name").value.trim();
  if (!name) {
    showSimpleMessage("Please enter a scenario name", "warning");
    return;
  }

  scenarios[name] = {
    subjects: [...subjects],
    university: currentUniversity,
    gpa: {
      semester: computeSemesterGPA(),
      cumulative: computeCGPA(),
      totalCredits: getTotalCredits(),
    },
    savedDate: new Date().toISOString(),
  };

  saveToStorage();
  updateScenarioList();
  document.getElementById("scenario-name").value = "";
  showSimpleMessage(`"${name}" saved!`, "success");
}

function loadSelectedScenario() {
  const select = document.getElementById("scenario-list");
  const scenarioName = select.value;

  if (!scenarioName || !scenarios[scenarioName]) {
    showSimpleMessage("Please select a scenario to load", "warning");
    return;
  }

  const scenario = scenarios[scenarioName];
  subjects = [...scenario.subjects];
  currentUniversity = scenario.university;

  document.getElementById("university-select").value = currentUniversity;
  updateUniversityInfo();

  saveToStorage();
  renderSubjectsList();
  updateResults();

  showSimpleMessage(`"${scenarioName}" loaded!`, "success");
}

function updateScenarioList() {
  const select = document.getElementById("scenario-list");
  select.innerHTML = '<option value="">Select scenario to load</option>';

  Object.keys(scenarios).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

// ==============================================
// PRINT & COPY FUNCTIONS
// ==============================================

function printSummary() {
  const printContent = `
        <html>
        <head>
            <title>BD CGPA Calculator - Summary</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .summary { background-color: #f9f9f9; padding: 15px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>BD CGPA Calculator - Academic Summary</h1>
            <div class="summary">
                <h2>Results Summary</h2>
                <p><strong>University:</strong> ${
                  UNIVERSITY_PRESETS[currentUniversity].name
                }</p>
                <p><strong>Semester GPA:</strong> ${formatGPA(
                  computeSemesterGPA()
                )}</p>
                <p><strong>Cumulative CGPA:</strong> ${formatGPA(
                  computeCGPA()
                )}</p>
                <p><strong>Total Credits:</strong> ${getTotalCredits().toFixed(
                  1
                )}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <h2>Subject Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Subject Name</th>
                        <th>Credit Hours</th>
                        <th>Grade</th>
                        <th>GPA</th>
                        <th>Grade Points</th>
                    </tr>
                </thead>
                <tbody>
                    ${subjects
                      .map(
                        (subject) => `
                        <tr>
                            <td>${subject.name}</td>
                            <td>${subject.credit.toFixed(1)}</td>
                            <td>${subject.displayGrade}</td>
                            <td>${formatGPA(subject.gpa)}</td>
                            <td>${formatGPA(subject.credit * subject.gpa)}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
            <p><em>Generated by BD CGPA Calculator - bdcgpacalculator.netlify.app</em></p>
        </body>
        </html>
    `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}

function copySummary() {
  const summary = `
BD CGPA Calculator - Academic Summary
=====================================

University: ${UNIVERSITY_PRESETS[currentUniversity].name}
Semester GPA: ${formatGPA(computeSemesterGPA())}
Cumulative CGPA: ${formatGPA(computeCGPA())}
Total Credits: ${getTotalCredits().toFixed(1)}

Subject Details:
${subjects
  .map(
    (subject) =>
      `${subject.name} | ${subject.credit.toFixed(1)} cr | ${
        subject.displayGrade
      } | ${formatGPA(subject.gpa)} GPA`
  )
  .join("\n")}

Generated: ${new Date().toLocaleDateString()}
Source: BD CGPA Calculator - bdcgpacalculator.netlify.app
    `.trim();

  navigator.clipboard
    .writeText(summary)
    .then(() => {
      showSimpleMessage("Copied to clipboard!", "success");
    })
    .catch(() => {
      showSimpleMessage("Failed to copy", "error");
    });
}

// ==============================================
// STORAGE FUNCTIONS
// ==============================================

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(subjects));
    localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(scenarios));
    localStorage.setItem(STORAGE_KEYS.university, currentUniversity);
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
    showSimpleMessage("Failed to save data", "error");
  }
}

function loadFromStorage() {
  try {
    const savedSubjects = localStorage.getItem(STORAGE_KEYS.subjects);
    if (savedSubjects) {
      subjects = JSON.parse(savedSubjects);
    }

    const savedScenarios = localStorage.getItem(STORAGE_KEYS.scenarios);
    if (savedScenarios) {
      scenarios = JSON.parse(savedScenarios);
    }

    const savedUniversity = localStorage.getItem(STORAGE_KEYS.university);
    if (savedUniversity && UNIVERSITY_PRESETS[savedUniversity]) {
      currentUniversity = savedUniversity;
    }
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    // Reset to defaults if storage is corrupted
    subjects = [];
    scenarios = {};
    currentUniversity = "ugc";
  }
}

// ==============================================
// THEME MANAGEMENT
// ==============================================

function initializeTheme() {
  console.log("🎨 Theme initialization starting...");

  // Clear localStorage theme to force light mode
  localStorage.removeItem(STORAGE_KEYS.theme);

  // Remove any dark class from HTML
  document.documentElement.classList.remove("dark");

  // Set to light mode explicitly
  setTheme("light");

  console.log("✅ Theme forced to light mode");

  const toggleButton = document.getElementById("theme-toggle");
  if (toggleButton) {
    toggleButton.addEventListener("click", toggleTheme);
    console.log("Theme toggle button initialized");
  } else {
    console.error("Theme toggle button not found!");
  }
}

// Debug function to force light mode - exposed globally
window.debugForceLight = function () {
  console.log("🚨 DEBUG: Force light mode triggered");
  localStorage.removeItem(STORAGE_KEYS.theme);
  document.documentElement.classList.remove("dark");
  setTheme("light");
  location.reload();
};

function setTheme(theme) {
  const htmlElement = document.documentElement;
  const sunIcon = document.getElementById("sun-icon");
  const moonIcon = document.getElementById("moon-icon");

  console.log(`Setting theme to: ${theme}`);
  console.log(`HTML element before:`, htmlElement.classList.toString());

  if (theme === "dark") {
    htmlElement.classList.add("dark");
    // Show sun icon for dark mode (sun = light theme option)
    if (sunIcon && moonIcon) {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
      console.log("Dark mode: showing sun icon");
    }
  } else {
    htmlElement.classList.remove("dark");
    // Show moon icon for light mode (moon = dark theme option)
    if (sunIcon && moonIcon) {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
      console.log("Light mode: showing moon icon");
    }
  }

  console.log(`HTML element after:`, htmlElement.classList.toString());
  localStorage.setItem(STORAGE_KEYS.theme, theme);

  // Update meta theme-color for mobile browsers
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.content = theme === "dark" ? "#1f2937" : "#2563EB";
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";

  console.log(
    `Switching theme from ${isDark ? "dark" : "light"} to ${newTheme}`
  );

  setTheme(newTheme);

  // Add subtle animation feedback
  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.style.transform = "scale(0.9)";
    setTimeout(() => {
      toggleBtn.style.transform = "scale(1)";
    }, 150);
  }
}

// ==============================================
// INITIALIZATION
// ==============================================

// Performance monitoring
const performanceMetrics = {
  startTime: performance.now(),
  domContentLoaded: null,
  scriptsLoaded: null,
  firstInteraction: null,
};

document.addEventListener("DOMContentLoaded", function () {
  performanceMetrics.domContentLoaded = performance.now();

  // Load saved data
  loadFromStorage();
  loadSemestersFromStorage();

  // Initialize UI components with error handling
  try {
    initializeTheme();
    initializeForm();
    initializeSemesterForm();
    initializeUniversitySelector();
  } catch (error) {
    console.error("Initialization error:", error);
    showSimpleMessage("Some features may not work properly", "warning");
  }

  // Set initial university
  const universitySelect = document.getElementById("university-select");
  if (universitySelect) {
    universitySelect.value = currentUniversity;
    updateUniversityInfo();
  }

  // Render initial state
  renderSubjectsList();
  updateResults();
  updateScenarioList();
  renderSemestersList();
  updateOverallResults();

  // Register service worker for offline support
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("js/sw.js")
      .then((registration) => {
        console.log("SW registered successfully");
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  }

  // Lazy load advanced features
  const advancedToolsSection = document.querySelector(".advanced-tools");
  if (advancedToolsSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initializeAdvancedFeatures();
          observer.unobserve(entry.target);
        }
      });
    });
    observer.observe(advancedToolsSection);
  }

  // Add global error handler
  window.addEventListener("error", function (e) {
    console.error("Global error:", e);
    showSimpleMessage("An unexpected error occurred", "error");
  });

  // Track first user interaction
  document.addEventListener(
    "click",
    function trackFirstInteraction() {
      if (!performanceMetrics.firstInteraction) {
        performanceMetrics.firstInteraction = performance.now();
        document.removeEventListener("click", trackFirstInteraction);
      }
    },
    { once: true }
  );

  performanceMetrics.scriptsLoaded = performance.now();
  console.log("BD CGPA Calculator initialized successfully", {
    initTime: performanceMetrics.scriptsLoaded - performanceMetrics.startTime,
  });
});

// Lazy initialization of advanced features
function initializeAdvancedFeatures() {
  // Add realistic loading delay and smooth transition
  setTimeout(() => {
    const loadingEl = document.getElementById("advanced-tools-loading");
    const contentEl = document.getElementById("advanced-tools-content");

    if (loadingEl && contentEl) {
      // Fade out loading
      loadingEl.style.opacity = "0";
      loadingEl.style.transform = "translateY(-20px)";

      setTimeout(() => {
        loadingEl.style.display = "none";
        contentEl.style.display = "block";
        contentEl.style.opacity = "0";
        contentEl.style.transform = "translateY(20px)";

        // Fade in content
        setTimeout(() => {
          contentEl.style.transition = "all 0.5s ease";
          contentEl.style.opacity = "1";
          contentEl.style.transform = "translateY(0)";
        }, 50);
      }, 300);
    }
  }, 1500); // Realistic loading time

  // CSV import paste listener with improved UX
  const csvInput = document.getElementById("csv-input");
  if (csvInput) {
    csvInput.addEventListener("paste", function () {
      setTimeout(() => {
        showSimpleMessage(
          "CSV data pasted. Click 'Import' to process.",
          "info"
        );
      }, 100);
    });
  }

  // Initialize keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    // Ctrl/Cmd + Enter to add subject
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      const form = document.getElementById("add-subject-form");
      if (form) {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
      }
    }

    // Escape to clear form
    if (e.key === "Escape") {
      const form = document.getElementById("add-subject-form");
      if (form) {
        form.reset();
        document.getElementById("subject-name").focus();
      }
    }
  });

  // Add focus management for better UX
  const firstInput = document.getElementById("subject-name");
  if (firstInput && document.activeElement === document.body) {
    firstInput.focus();
  }

  console.log("Advanced features initialized");
}

// ==============================================
// MULTI-SEMESTER CALCULATOR
// ==============================================

let semesters = [];

function addSemester(name, grade) {
  try {
    if (!name.trim()) {
      throw new Error("Semester name is required");
    }

    const gradeMapping = UNIVERSITY_PRESETS[currentUniversity].mapping[grade];
    if (!gradeMapping) {
      throw new Error("Invalid grade selected");
    }

    const semester = {
      id: Date.now(),
      name: name.trim(),
      grade: grade,
      gpa: gradeMapping.gpa,
    };

    semesters.push(semester);
    saveSemestersToStorage();
    renderSemestersList();
    updateOverallResults();

    return true;
  } catch (error) {
    showSimpleMessage(error.message, "error");
    return false;
  }
}

function removeSemester(id) {
  const index = semesters.findIndex((semester) => semester.id === id);
  if (index !== -1) {
    semesters.splice(index, 1);
    saveSemestersToStorage();
    renderSemestersList();
    updateOverallResults();
  }
}

function renderSemestersList() {
  const container = document.getElementById("semester-list");

  if (!container) return;

  container.innerHTML = "";

  if (semesters.length === 0) {
    container.innerHTML =
      '<div class="text-gray-500 dark:text-gray-400 text-center py-4">No semesters added yet</div>';
    return;
  }

  semesters.forEach((semester) => {
    const semesterElement = document.createElement("div");
    semesterElement.className =
      "flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3";

    semesterElement.innerHTML = `
      <div class="flex-1">
        <div class="font-medium text-gray-900 dark:text-white">${
          semester.name
        }</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">${
          semester.grade
        } (${semester.gpa.toFixed(2)})</div>
      </div>
      <button 
        onclick="removeSemester(${semester.id})" 
        class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
        title="Remove semester"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;

    container.appendChild(semesterElement);
  });
}

function updateOverallResults() {
  const overallCgpaEl = document.getElementById("overall-cgpa");
  const totalSemestersEl = document.getElementById("total-semesters");

  if (!overallCgpaEl || !totalSemestersEl) return;

  if (semesters.length === 0) {
    overallCgpaEl.textContent = "0.00";
    totalSemestersEl.textContent = "0";
    return;
  }

  // Calculate overall CGPA as average of all semester GPAs
  const totalGPA = semesters.reduce((sum, semester) => sum + semester.gpa, 0);
  const overallCGPA = totalGPA / semesters.length;

  overallCgpaEl.textContent = overallCGPA.toFixed(2);
  totalSemestersEl.textContent = semesters.length.toString();
}

function initializeSemesterForm() {
  const form = document.getElementById("semester-form");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("semester-name").value;
    const grade = document.getElementById("semester-grade").value;

    if (addSemester(name, grade)) {
      form.reset();
    }
  });
}

function saveSemestersToStorage() {
  try {
    localStorage.setItem("bdcgpa_semesters", JSON.stringify(semesters));
  } catch (error) {
    console.error("Failed to save semesters to localStorage:", error);
  }
}

function loadSemestersFromStorage() {
  try {
    const savedSemesters = localStorage.getItem("bdcgpa_semesters");
    if (savedSemesters) {
      semesters = JSON.parse(savedSemesters);
    }
  } catch (error) {
    console.error("Failed to load semesters from localStorage:", error);
    semesters = [];
  }
}

// ==============================================
// GLOBAL FUNCTIONS (for inline onclick handlers)
// ==============================================

// Make functions globally accessible
window.quickAddSubject = quickAddSubject;
window.importCSV = importCSV;
window.exportData = exportData;
window.calculateTargetGrades = calculateTargetGrades;
window.saveScenario = saveScenario;
window.loadSelectedScenario = loadSelectedScenario;
window.printSummary = printSummary;
window.copySummary = copySummary;
window.removeSemester = removeSemester;
window.showSemesterCalculator = showSemesterCalculator;
window.showOverallCalculator = showOverallCalculator;

// ==============================================
// CALCULATOR MODE NAVIGATION
// ==============================================

function showSemesterCalculator() {
  // Smooth scroll to semester calculator
  const calculatorSection = document.getElementById("calculator");
  if (calculatorSection) {
    calculatorSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

function showOverallCalculator() {
  // Smooth scroll to overall calculator
  const overallSection =
    document.querySelector('[id*="overall"]') ||
    document.querySelector('h3:contains("Overall CGPA Calculator")') ||
    document.getElementById("semester-form");

  if (overallSection) {
    overallSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } else {
    // Fallback: scroll to the overall calculator section
    const sections = document.querySelectorAll("section");
    sections.forEach((section) => {
      if (section.textContent.includes("Overall CGPA Calculator")) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  }
}
