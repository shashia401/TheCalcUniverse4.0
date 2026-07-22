import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const GRADE_OPTIONS = [
  'A+', 'A', 'A-',
  'B+', 'B', 'B-',
  'C+', 'C', 'C-',
  'D+', 'D', 'D-',
  'F',
];

const WEIGHT_OPTIONS = [
  { label: 'Regular', value: 'Regular' },
  { label: 'Honors', value: 'Honors' },
  { label: 'AP/IB', value: 'AP/IB' },
];

interface CourseRow {
  name: string;
  grade: string;
  credits: string;
  weight: string;
}

const EMPTY_ROW = (): CourseRow => ({ name: '', grade: '', credits: '', weight: 'Regular' });

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  errors?: Record<string, string>;
}

export default function GPACoursesInput({ id, value, onChange, errors }: Props) {
  const [courses, setCourses] = useState<CourseRow[]>(() => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* fall through */ }
    return [EMPTY_ROW(), EMPTY_ROW()];
  });
  const initialized = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    if (!value || value === '[]') {
      setCourses([EMPTY_ROW(), EMPTY_ROW()]);
    }
  }, [value]);

  useEffect(() => {
    onChangeRef.current(JSON.stringify(courses));
  }, [courses]);

  const updateRow = useCallback((index: number, field: keyof CourseRow, val: string) => {
    setCourses((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, [field]: val } : r));
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setCourses((prev) => [...prev, EMPTY_ROW()]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setCourses((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }, []);

  const baseInput =
    'w-full rounded-lg border text-slate-900 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 bg-white focus-visible:ring-brand-500/40';
  const baseBorder = 'border-slate-200 hover:border-slate-300 focus:border-brand-400 focus:ring-brand-100';

  return (
    <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0" id={id}>
      <legend className="text-sm font-semibold text-slate-700 tracking-tight dark:text-slate-200">
        Courses
        <span className="text-slate-500 ml-1 font-normal dark:text-slate-500">*</span>
      </legend>

      <div className="space-y-2">
        {courses.map((row, i) => (
          <div
            key={`course-${i}`}
            className="flex flex-wrap sm:flex-nowrap items-start gap-1.5 sm:gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50"
          >
            {/* Course Name */}
            <div className="flex-1 min-w-[80px] sm:min-w-0 basis-full sm:basis-auto">
              <input
                type="text"
                placeholder="Course name"
                value={row.name}
                onChange={(e) => updateRow(i, 'name', e.target.value)}
                className={`${baseInput} ${baseBorder} px-2.5 py-2 text-xs`}
                autoComplete="off"
              />
            </div>

            {/* Grade */}
            <div className="flex-1 sm:flex-none sm:w-24 min-w-[70px]">
              <select
                value={row.grade}
                onChange={(e) => updateRow(i, 'grade', e.target.value)}
                className={`${baseInput} ${baseBorder} px-2 py-2 text-xs`}
                aria-label="Grade"
                required
              >
                <option value="">Grade *</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Credits */}
            <div className="flex-1 sm:flex-none sm:w-20 min-w-[60px]">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Credits *"
                value={row.credits}
                onChange={(e) => updateRow(i, 'credits', e.target.value)}
                className={`${baseInput} ${baseBorder} px-2 py-2 text-xs`}
                autoComplete="off"
                required
              />
            </div>

            {/* Weight */}
            <div className="flex-1 sm:flex-none sm:w-24 min-w-[70px]">
              <select
                value={row.weight}
                onChange={(e) => updateRow(i, 'weight', e.target.value)}
                className={`${baseInput} ${baseBorder} px-2 py-2 text-xs`}
                aria-label="Weight"
              >
                {WEIGHT_OPTIONS.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={courses.length <= 1}
              className="flex-shrink-0 self-center sm:self-start p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Remove course"
              title="Remove course"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center justify-center gap-1.5 w-full mt-1 py-2 rounded-lg border border-dashed border-slate-300 bg-white text-sm font-semibold text-brand-600 hover:text-white hover:bg-brand-500 hover:border-brand-500 transition-all duration-200"
      >
        <Plus size={15} strokeWidth={2.5} />
        Add Course
      </button>

      {errors?.[id] && (
        <p id={`${id}-error`} className="text-xs text-red-500" role="alert">{errors[id]}</p>
      )}
      {!errors?.[id] && <div className="min-h-[1.25rem]" />}
    </fieldset>
  );
}
