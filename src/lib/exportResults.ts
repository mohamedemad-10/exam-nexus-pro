interface ExportableAttempt {
  student_name: string;
  student_id: string;
  grade: string;
  exam_title: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  date: string;
  time_taken: string;
}

export const exportResultsToCSV = (attempts: ExportableAttempt[], filename: string = 'exam_results') => {
  const headers = [
    'Student Name',
    'Student ID',
    'Grade',
    'Exam',
    'Score',
    'Total Questions',
    'Percentage',
    'Status',
    'Date',
    'Time Taken'
  ];

  const rows = attempts.map(a => [
    `"${a.student_name}"`,
    a.student_id,
    a.grade,
    `"${a.exam_title}"`,
    a.score,
    a.total_questions,
    `${a.percentage}%`,
    a.passed ? 'Passed' : 'Failed',
    a.date,
    a.time_taken
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const formatTimeForExport = (seconds: number | null): string => {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export const formatDateForExport = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};