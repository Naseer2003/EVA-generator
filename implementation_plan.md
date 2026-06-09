# Aligning EVA Calculations and High-Precision EOL Dates

This plan addresses the mathematical discrepancies between the dashboard results and the user's Excel sheet when analyzing the same dataset of 366 tubes. It explains the core causes of the differences and proposes code changes to correct the EOL dates and warn the user of limitations in their Excel template.

## Findings & Root Cause Analysis

We performed a deep-dive inspection of the user's Excel sheet (`Copy of Copy of SI Version of EVA v2 3 1-2007 with AD Test.xlsm`) and identified three major reasons for the discrepancies:

### 1. Excel Template Drag Bug (Critical Safety Concern)
- The Excel sheet has **366 remaining thickness values** in Column B of the `Main` sheet.
- However, the formulas in Column A (`Rank`) and Column C (`Maximum Wall Loss`) were **only dragged down to Row 301** (Rank 300).
- As a result, the Excel calculations only analyzed the first 300 rows. Row 302 was read as `0.0` (because it was blank) and included as a dummy 301st data point. The remaining **66 worst cases** (which represent the deepest corrosion, up to `0.4097` mm wall loss) were **completely ignored** in the Excel Gumbel fit.
- By ignoring these worst cases, the Excel Gumbel model under-predicted corrosion, yielding a dangerously optimistic remaining thickness of **1.727 mm** (99% confidence). 
- Our python engine correctly analyzes **all 366 rows**, including the worst corrosion cases at the bottom of the table, leading to a conservative and correct remaining thickness of **1.664 mm** (under N=366).

### 2. Rounded CSV Data
- The CSV files uploaded to the dashboard (e.g. `1780686531304-500867563.csv`) contain remaining thickness values rounded to **2 decimal places** (e.g. `2.34`, `2.31`, `2.29`), whereas the Excel sheet performs calculations on the underlying **unrounded** values (e.g. `2.3377`, `2.3136`, `2.2895`).

### 3. Population Size (N)
- The dashboard run from the screenshot used a default population size $N = 2000$, whereas the Excel sheet was run with $N = 366$.

### 4. JavaScript EOL Calculation Bug (Backend & Frontend)
- The NestJS backend and Next.js frontend calculated EOL using the JavaScript `setFullYear(insDate.getFullYear() + remainingLife)` method.
- Since `setFullYear` truncates fractional years, it discarded the decimal part of the remaining life (e.g., `3.597` years became `3` years), and kept the month/day matching the inspection date (always outputting October).
- In contrast, the Excel sheet uses high-precision day-level arithmetic relative to the Service Start Date: `Date_S + (Original Thickness - Min Required Thickness) / Corrosion Rate * 365.25` days.

---

## User Review Required

> [!WARNING]
> **Safety Warning**: The reference Excel sheet has a formula drag bug that ignores the 66 worst corrosion readings. Relying on the Excel values for mechanical integrity decisions is unsafe. The dashboard calculations are mathematically correct because they analyze the entire dataset.

---

## Proposed Changes

### Backend Service

#### [MODIFY] [eva.service.ts](file:///e:/saddam/backend/src/modules/eva/eva.service.ts)
- Replace the buggy `setFullYear` year addition with high-precision day-level date arithmetic using milliseconds.
- EOL Date will be calculated relative to `serviceStartDate` using `totalLifeDays = ((Original Thickness - Min Required Thickness) / Corrosion Rate) * 365.25`.
- If `serviceStartDate` is missing, it will fallback to `inspectionDate` using `remainingLifeDays = ((Remaining Thickness - Min Required Thickness) / Corrosion Rate) * 365.25`.

### Frontend Components

#### [MODIFY] [page.tsx](file:///e:/saddam/frontend/app/dashboard/analysis/[id]/page.tsx)
- Update the EOL date fallback calculation to use high-precision date arithmetic.
- Add an explanatory information card/alert near the **Reliability Forecasting** table to inform the user about the Excel drag-limit bug and why the dashboard's results differ (and why they are safer).

#### [MODIFY] [page.tsx](file:///e:/saddam/frontend/app/dashboard/analysis/[id]/report/page.tsx)
- Update the EOL date fallback calculation to use high-precision date arithmetic.

---

## Verification Plan

### Automated Verification
- We will run a script comparing the corrected backend EOL calculation with Excel's output date `2021-05-06` for the 99% Category A level to verify perfect alignment.

### Manual Verification
- Re-run the analysis in the web browser and inspect the Results Page and printed PDF Report.
- Confirm that the EOL months/years are now calculated with high precision and that the informative warning banner explains the Excel formula truncation.
