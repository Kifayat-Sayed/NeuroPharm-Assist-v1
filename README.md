# 🩺 NeuroPharm Assist
### AI-Assisted Clinical Decision Support System (CDSS) for Pharmacist-Led Medication Optimisation and Neuropathic Pain Assessment

<p align="center">

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-Latest-purple?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38BDF8?logo=tailwind-css)
![License](https://img.shields.io/badge/License-Academic-green)
![Status](https://img.shields.io/badge/Status-Active%20Development-orange)

</p>

---

# 📖 Overview

**NeuroPharm Assist** is a modern Clinical Decision Support System (CDSS) designed to support pharmacist-led medication optimisation for patients experiencing **Neuropathic Pain**.

The application digitizes standardized clinical assessment workflows by replacing paper-based questionnaires and Google Forms with an intuitive, interactive, and structured clinical platform.

The primary objective is to enable pharmacists to perform standardized DN4 assessments, document medication reviews, generate evidence-based recommendations, and produce professional clinical reports within a single workflow.

---

# 🎯 Research Project

This software is being developed as part of the PharmD research project:

> **Development, Validation and Implementation of a Pharmacist-Led Medication Optimisation Strategy Incorporating Standardized Assessment Scale for Neuropathic Pain**

The application serves as the digital clinical platform supporting the implementation and validation of the proposed medication optimisation strategy.

---

# ✨ Key Features

## 👤 Patient Management

- Register new patients
- Store demographic information
- Maintain longitudinal patient profiles
- Record diagnoses and comorbidities
- Maintain complete medication history
- Track follow-up appointments

---

## 📋 Standardized DN4 Assessment

Supports the complete **10-item DN4 Neuropathic Pain Questionnaire**

Includes:

- Burning
- Painful Cold
- Electric Shock-like Pain
- Tingling
- Pricking
- Numbness
- Itching
- Touch Hypoesthesia
- Pricking Hypoesthesia
- Pain Provoked by Brushing

Features:

- Live score calculation
- Automatic interpretation
- Clinical severity indication
- Timestamped assessments

---

## 💊 Medication Review

Each medication can be evaluated for:

- Effectiveness
- Dose appropriateness
- Adverse Drug Reactions (ADR)
- Dose adjustment requirements
- Clinical observations
- Monitoring recommendations

---

## 🧑‍⚕️ Pharmacist Recommendations

Document:

- Medication optimisation strategy
- Clinical rationale
- Follow-up plan
- Monitoring recommendations
- Patient counselling notes

---

## 📈 Clinical Dashboard

Interactive dashboard displaying:

- Active patients
- Assessment statistics
- Severe neuropathic pain cases
- Recent assessments
- Recent clinical activities
- Upcoming follow-ups

---

## 📄 Clinical Report Generation

Automatically generates structured pharmacist reports containing:

- Patient demographics
- Clinical history
- DN4 responses
- Total DN4 score
- Interpretation
- Medication review
- Recommendations
- Clinical notes
- Follow-up plan

---

## 📥 PDF Export

Generate professional printable PDF reports.

Features:

- Clean medical formatting
- Automatic filename generation
- Download-ready
- Suitable for patient documentation

---

## 📊 Assessment History

Each patient maintains:

- Complete assessment timeline
- Historical DN4 scores
- Medication review history
- Recommendations
- Follow-up records

No previous assessments are overwritten.

---

# 🧠 Clinical Workflow

```
New Patient
        │
        ▼
Patient Registration
        │
        ▼
Clinical Information
        │
        ▼
DN4 Assessment
        │
        ▼
Medication Review
        │
        ▼
Pharmacist Recommendation
        │
        ▼
Save Assessment
        │
        ▼
Generate Clinical Report
        │
        ▼
Export PDF
```

---

# 🏥 Clinical Decision Support Philosophy

Rather than storing only a DN4 score, the system stores every individual questionnaire response.

Example:

```json
{
  "burning": true,
  "painfulCold": false,
  "electricShock": true,
  "tingling": true,
  "pricking": false,
  "numbness": true,
  "itching": false,
  "touchHypoesthesia": true,
  "prickingHypoesthesia": false,
  "brushing": true
}
```

This approach enables:

- Accurate audit trails
- Assessment editing
- Longitudinal symptom analysis
- Clinical research
- Future AI integration
- Advanced analytics

The DN4 score is calculated dynamically whenever an assessment is viewed or a report is generated.

---

# 💻 Technology Stack

## Frontend

- React 19
- TypeScript
- Vite
- TanStack Router
- Tailwind CSS
- Radix UI
- React Hook Form
- Zod

## UI & Visualization

- Lucide Icons
- Framer Motion
- Recharts

## Document Generation

- jsPDF

## Data Storage

Current:

- Browser Local Storage

Planned:

- PostgreSQL
- Supabase
- Firebase
- Hospital Information System Integration

---

# 📂 Project Structure

```
src/
│
├── components/
│
├── features/
│   ├── patients/
│   ├── assessments/
│   ├── medication-review/
│   ├── reports/
│
├── lib/
│   ├── db/
│   ├── pdf/
│   └── utils/
│
├── hooks/
│
├── routes/
│
└── app/
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/Kifayat-Sayed/NeuroPharm-Assist.git
```

---

## Install Dependencies

```bash
npm install
```

---

## Run Development Server

```bash
npm run dev
```

---

## Production Build

```bash
npm run build
```

---

## Preview Production Build

```bash
npm run preview
```

---

# 📊 Current Development Status

| Module | Status |
|---------|--------|
| Dashboard | ✅ Complete |
| Patient Registration | ✅ Complete |
| DN4 Assessment | ✅ Complete |
| Medication Review | ✅ Complete |
| Recommendations | ✅ Complete |
| Patient Profiles | ✅ Complete |
| Assessment History | ✅ Complete |
| Clinical Reports | ✅ Complete |
| PDF Export | ✅ Complete |
| Local Persistence | ✅ Complete |
| Authentication | 🚧 Planned |
| Backend Database | 🚧 Planned |
| AI Recommendation Engine | 🚧 Planned |

---

# 🔮 Future Roadmap

## Version 1.1

- Authentication
- Role-based access
- Improved patient search

## Version 2.0

- PostgreSQL backend
- Secure cloud storage
- Multi-user support
- REST API

## Version 3.0

- AI-powered Clinical Decision Support
- Medication interaction detection
- Guideline-based recommendations
- Predictive risk stratification
- Clinical analytics dashboard

---

# 🎓 Academic Purpose

This software has been developed to support academic research in:

- Clinical Pharmacy
- Medication Optimisation
- Neuropathic Pain Assessment
- Clinical Decision Support Systems (CDSS)
- Digital Health
- Healthcare Informatics

---

# ⚠️ Disclaimer

This software is developed for **research, educational, and clinical workflow evaluation purposes**.

It is **not intended to replace clinical judgment** or be used as a standalone medical decision-making system.

Healthcare professionals should always follow institutional protocols and current clinical guidelines.

---

# 👨‍💻 Developer

**Kifayat Sayed**

M.Sc. Artificial Intelligence & Machine Learning  
PharmD Research Collaboration

GitHub:

https://github.com/Kifayat-Sayed

---

# ⭐ Support

If you find this project useful,

⭐ Star the repository to support future development.

---

<p align="center">

**NeuroPharm Assist**  
*Digitizing Pharmacist-Led Clinical Decision Support for Neuropathic Pain Management*

</p>
