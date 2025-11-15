/**
 * Export utilities for generating reports and downloads
 */

import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions {key, label}
 * @param {string} filename - Output filename
 */
export function exportToCSV(data, columns, filename = "export.csv") {
  if (!data || data.length === 0) {
    alert("אין נתונים לייצוא");
    return;
  }

  // Create CSV header
  const headers = columns.map(col => col.label);
  let csvContent = headers.join(",") + "\n";

  // Add data rows
  data.forEach(row => {
    const values = columns.map(col => {
      let value = col.key.split('.').reduce((obj, key) => obj?.[key], row) || '';

      // Handle special formatting
      if (col.formatter) {
        value = col.formatter(value, row);
      }

      // Escape and quote values that contain commas, quotes, or newlines
      value = String(value).replace(/"/g, '""');
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value}"`;
      }

      return value;
    });

    csvContent += values.join(",") + "\n";
  });

  // Add BOM for proper Hebrew encoding
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

/**
 * Export shifts to CSV
 * @param {Array} shifts - Array of shift objects
 * @param {Array} employees - Array of employee objects for lookup
 * @param {Object} jobRoles - Object mapping role IDs to role objects
 */
export function exportShiftsToCSV(shifts, employees, jobRoles) {
  const columns = [
    { key: 'date', label: 'תאריך', formatter: (val) => format(parseISO(val), 'dd/MM/yyyy') },
    { key: 'title', label: 'שם משמרת' },
    { key: 'start_time', label: 'שעת התחלה' },
    { key: 'end_time', label: 'שעת סיום' },
    {
      key: 'required_job_role_id',
      label: 'תפקיד נדרש',
      formatter: (val) => jobRoles[val]?.name || 'לא זמין'
    },
    { key: 'required_number_of_employees', label: 'מספר עובדים נדרש' },
    {
      key: 'assigned_employee_ids',
      label: 'עובדים משובצים',
      formatter: (ids) => {
        if (!ids || ids.length === 0) return 'ללא';
        return ids.map(id => {
          const emp = employees.find(e => e.id === id);
          return emp ? `${emp.first_name} ${emp.last_name}` : 'לא ידוע';
        }).join('; ');
      }
    },
    { key: 'status', label: 'סטטוס' },
    { key: 'location', label: 'מיקום' },
    { key: 'difficulty_level', label: 'רמת קושי' },
    { key: 'notes', label: 'הערות' }
  ];

  const filename = `shifts_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  exportToCSV(shifts, columns, filename);
}

/**
 * Export employees to CSV
 * @param {Array} employees - Array of employee objects
 * @param {Array} jobRoles - Array of job role objects
 */
export function exportEmployeesToCSV(employees, jobRoles) {
  const columns = [
    { key: 'first_name', label: 'שם פרטי' },
    { key: 'last_name', label: 'שם משפחה' },
    { key: 'email', label: 'אימייל' },
    { key: 'phone', label: 'טלפון' },
    {
      key: 'job_role_ids',
      label: 'תפקידים',
      formatter: (roleIds) => {
        if (!roleIds || roleIds.length === 0) return 'ללא תפקיד';
        return roleIds.map(id => {
          const role = jobRoles.find(r => r.id === id);
          return role ? role.name : 'לא ידוע';
        }).join('; ');
      }
    },
    { key: 'hourly_rate', label: 'שכר לשעה' },
    { key: 'status', label: 'סטטוס' },
    {
      key: 'hire_date',
      label: 'תאריך תחילת עבודה',
      formatter: (val) => val ? format(parseISO(val), 'dd/MM/yyyy') : ''
    }
  ];

  const filename = `employees_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  exportToCSV(employees, columns, filename);
}

/**
 * Generate HTML for schedule print/export
 * @param {Array} shifts - Array of shifts
 * @param {Array} employees - Array of employees
 * @param {Object} jobRoles - Job roles mapping
 * @param {Object} options - Options like startDate, endDate, title
 */
export function generateScheduleHTML(shifts, employees, jobRoles, options = {}) {
  const { startDate, endDate, title = "לוח משמרות" } = options;

  // Group shifts by date
  const shiftsByDate = {};
  shifts.forEach(shift => {
    if (!shiftsByDate[shift.date]) {
      shiftsByDate[shift.date] = [];
    }
    shiftsByDate[shift.date].push(shift);
  });

  // Sort dates
  const sortedDates = Object.keys(shiftsByDate).sort();

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            padding: 20mm;
            background: white;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #1e40af;
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header .subtitle {
            color: #64748b;
            font-size: 16px;
        }
        .date-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        .date-header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 18px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .shifts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
            margin-right: 10px;
        }
        .shift-card {
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            background: #f8fafc;
            transition: all 0.2s;
        }
        .shift-card.status-assigned {
            border-color: #10b981;
            background: #f0fdf4;
        }
        .shift-card.status-partial {
            border-color: #f59e0b;
            background: #fffbeb;
        }
        .shift-card.status-unassigned {
            border-color: #ef4444;
            background: #fef2f2;
        }
        .shift-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 8px;
        }
        .shift-time {
            color: #6366f1;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .shift-detail {
            font-size: 13px;
            color: #475569;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
        }
        .shift-detail-label {
            font-weight: 600;
            margin-left: 8px;
            color: #334155;
        }
        .shift-employees {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
        }
        .employee-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            margin: 2px;
            font-weight: 500;
        }
        .no-shifts {
            text-align: center;
            color: #94a3b8;
            padding: 40px;
            font-style: italic;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #94a3b8;
            font-size: 12px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
        }
        @media print {
            body {
                padding: 10mm;
            }
            .shift-card {
                page-break-inside: avoid;
            }
            @page {
                margin: 15mm;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <div class="subtitle">
            ${startDate && endDate ? `${format(parseISO(startDate), 'd MMMM yyyy', { locale: he })} - ${format(parseISO(endDate), 'd MMMM yyyy', { locale: he })}` : ''}
        </div>
        <div class="subtitle">נוצר בתאריך: ${format(new Date(), 'd MMMM yyyy, HH:mm', { locale: he })}</div>
    </div>

    ${sortedDates.length === 0 ? '<div class="no-shifts">אין משמרות להצגה</div>' : ''}

    ${sortedDates.map(date => {
      const dateShifts = shiftsByDate[date].sort((a, b) =>
        (a.start_time || '').localeCompare(b.start_time || '')
      );

      return `
      <div class="date-section">
          <div class="date-header">
              ${format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: he })}
          </div>
          <div class="shifts-grid">
              ${dateShifts.map(shift => {
                const statusClass =
                  shift.status === 'מאויש' ? 'status-assigned' :
                  shift.status === 'מאויש חלקית' ? 'status-partial' :
                  'status-unassigned';

                const assignedEmployees = shift.assigned_employee_ids?.map(id => {
                  const emp = employees.find(e => e.id === id);
                  return emp ? `${emp.first_name} ${emp.last_name}` : null;
                }).filter(Boolean) || [];

                const roleName = jobRoles[shift.required_job_role_id]?.name || 'לא צוין';

                return `
                <div class="shift-card ${statusClass}">
                    <div class="shift-title">${shift.title}</div>
                    <div class="shift-time">🕐 ${shift.start_time} - ${shift.end_time}</div>
                    <div class="shift-detail">
                        <span class="shift-detail-label">תפקיד:</span>
                        ${roleName}
                    </div>
                    <div class="shift-detail">
                        <span class="shift-detail-label">נדרש:</span>
                        ${shift.required_number_of_employees} עובדים
                    </div>
                    ${shift.location ? `
                    <div class="shift-detail">
                        <span class="shift-detail-label">מיקום:</span>
                        ${shift.location}
                    </div>
                    ` : ''}
                    ${assignedEmployees.length > 0 ? `
                    <div class="shift-employees">
                        ${assignedEmployees.map(name => `
                            <span class="employee-badge">${name}</span>
                        `).join('')}
                    </div>
                    ` : `
                    <div class="shift-employees" style="color: #ef4444; font-weight: 600;">
                        ⚠️ טרם שובצו עובדים
                    </div>
                    `}
                    ${shift.notes ? `
                    <div class="shift-detail" style="margin-top: 8px; font-style: italic; color: #64748b;">
                        ${shift.notes}
                    </div>
                    ` : ''}
                </div>
                `;
              }).join('')}
          </div>
      </div>
      `;
    }).join('')}

    <div class="footer">
        נוצר על ידי ShiftWise MC - מערכת ניהול משמרות
    </div>
</body>
</html>
  `;

  return html;
}

/**
 * Export schedule to HTML file and open in new window for printing
 * @param {Array} shifts - Array of shifts
 * @param {Array} employees - Array of employees
 * @param {Object} jobRoles - Job roles mapping
 * @param {Object} options - Export options
 */
export function exportScheduleToHTML(shifts, employees, jobRoles, options = {}) {
  const html = generateScheduleHTML(shifts, employees, jobRoles, options);

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Open in new window for printing
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = function() {
      // Auto-print after a short delay to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }

  return url;
}

/**
 * Download a blob as a file
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename
 */
function downloadBlob(blob, filename) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    // Fallback method
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err2) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}
