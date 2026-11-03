/* eslint-disable @typescript-eslint/no-explicit-any */

export function buildHTML(groups: any[]) {
  let total = 0;
  let pass = 0;
  let fail = 0;
  let dropout = 0;

  const rows = groups
    .flatMap((g: any) =>
      g.students?.map((s: any) => {
        const r = s.diplomaResults?.[0];
        if (!r) return "";

        const failed = r.failedSubjects || [];
        const referred = r.referredSubjects || [];
        const allSubjects = [...failed, ...referred];

        // ✅ Dropout logic
        const isDropout = failed.length >= 4;

        // ✅ Status normalize
        const status = (r.status || "").toLowerCase().trim();

        // ================================
        // ✅ 8 SEMESTER GPA HANDLING
        // ================================
        const semesterGpas = Array.from({ length: 8 }, (_, i) => {
          const key = `gpa${i + 1}` as keyof typeof r;
          return r?.[key] ?? "-";
        });

        const gpaHtml = semesterGpas
          .map((gpa, idx) => {
            const isLast = idx === semesterGpas.length - 1;

            return `
              <span style="
                display:inline-block;
                margin:2px;
                padding:2px 6px;
                border-radius:4px;
                font-size:10px;
                background:${isLast ? "#4f46e5" : "#f3f4f6"};
                color:${isLast ? "#ffffff" : "#111827"};
              ">
                S${idx + 1}: ${gpa}
              </span>
            `;
          })
          .join("");

        total++;

        if (isDropout) {
          dropout++;
        } else if (status === "passed" || status === "pass") {
          pass++;
        } else {
          fail++;
        }

        return `
          <tr>
            <td>${s.name ?? "-"}</td>
            <td>${s.roll ?? "-"}</td>

            <!-- GPA COLUMN (ALL 8 SEMESTERS) -->
            <td>${gpaHtml}</td>

            <td>${allSubjects.length ? allSubjects.join(", ") : "None"}</td>

            <td>${isDropout ? "DROPOUT" : status || "unknown"}</td>
          </tr>
        `;
      })
    )
    .join("");

  // ================================
  // ✅ STATS
  // ================================
  const passPct = total ? ((pass / total) * 100).toFixed(2) : "0";
  const failPct = total ? ((fail / total) * 100).toFixed(2) : "0";
  const dropPct = total ? ((dropout / total) * 100).toFixed(2) : "0";

  return `
  <html>
    <head>
      <style>
        body {
          font-family: Arial;
          padding: 30px;
          background: #ffffff;
        }

        h1 {
          text-align: center;
          color: #4f46e5;
          margin-bottom: 5px;
        }

        .subtitle {
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 20px;
        }

        .stats {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 12px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          vertical-align: top;
        }

        th {
          background: #f3f4f6;
          font-weight: bold;
        }
      </style>
    </head>

    <body>
      <h1>Dinajpur Polytechnic Institute</h1>
      <div class="subtitle">Student Result Transcript Report (8 Semesters)</div>

      <div class="stats">
        <div>Total: ${total}</div>
        <div>Pass: ${pass} (${passPct}%)</div>
        <div>Fail: ${fail} (${failPct}%)</div>
        <div>Dropout: ${dropout} (${dropPct}%)</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Roll</th>
            <th>8 Semester GPA</th>
            <th>Referred Subjects</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
  </html>
  `;
}