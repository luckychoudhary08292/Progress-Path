import { useState, useEffect } from 'react';
import {
  FileCode,
  BookOpen,
  Code,
  Copy,
  Check,
  Info,
  Terminal,
  Layers,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Video,
  Loader2,
  Upload,
  ArrowRight,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { SubjectSummary } from '../types.ts';

type ImportType = 'lectures' | 'problems';

interface ValidatedLecture {
  title: string;
  videoUrl?: string;
}

interface ValidatedProblem {
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  link?: string;
}

export interface ImportConsoleProps {
  onNavigateToSubject?: (subjectId: string) => void;
  onNavigateToCoding?: () => void;
}

interface ImportResultData {
  success: boolean;
  insertedCount: number;
  failedCount: number;
  insertedItems: any[];
  failedItems: Array<{ index: number; title?: string; name?: string; error: string }>;
  targetSubjectName?: string;
  targetSubjectId?: string;
  entityType: 'lectures' | 'problems';
}

const LECTURES_SCHEMA = `[
  {
    "title": "string (required, e.g. 'Arrays basics')",
    "videoUrl": "string (optional, URL or empty string '')"
  }
]`;

const LECTURES_EXAMPLE = `[
  { "title": "Arrays basics", "videoUrl": "https://youtube.com/..." },
  { "title": "Two pointer technique", "videoUrl": "" }
]`;

const PROBLEMS_SCHEMA = `[
  {
    "name": "string (required, e.g. 'Two Sum')",
    "difficulty": "'Easy' | 'Medium' | 'Hard' (required)",
    "category": "string (required, e.g. 'Array & Hashing')",
    "link": "string (optional, problem URL or empty '')"
  }
]`;

const PROBLEMS_EXAMPLE = `[
  { "name": "Two Sum", "difficulty": "Easy", "category": "Array & Hashing", "link": "https://leetcode.com/problems/two-sum/" }
]`;

export function ImportConsole({ onNavigateToSubject, onNavigateToCoding }: ImportConsoleProps) {
  const [importType, setImportType] = useState<ImportType>('lectures');
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');

  // Validation & Preview States
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [previewLectures, setPreviewLectures] = useState<ValidatedLecture[] | null>(null);
  const [previewProblems, setPreviewProblems] = useState<ValidatedProblem[] | null>(null);

  // Ingestion Execution States
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  // Fetch subjects for the dropdown when targeting Lectures
  useEffect(() => {
    const fetchSubjects = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      setIsLoadingSubjects(true);
      try {
        const res = await fetch('/api/subjects', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const list: SubjectSummary[] = data.subjects || [];
          setSubjects(list);
          if (list.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch subjects for import dropdown:', err);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleTypeChange = (newType: ImportType) => {
    setImportType(newType);
    setSyntaxError(null);
    setValidationErrors([]);
    setPreviewLectures(null);
    setPreviewProblems(null);
    setImportResult(null);
  };

  const handleCopySchema = async () => {
    const textToCopy = importType === 'lectures' ? LECTURES_SCHEMA : PROBLEMS_SCHEMA;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    } catch {
      setCopiedSchema(false);
    }
  };

  const handleCopyExample = async () => {
    const textToCopy = importType === 'lectures' ? LECTURES_EXAMPLE : PROBLEMS_EXAMPLE;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedExample(true);
      setTimeout(() => setCopiedExample(false), 2000);
    } catch {
      setCopiedExample(false);
    }
  };

  const handleLoadSample = () => {
    const sample = importType === 'lectures' ? LECTURES_EXAMPLE : PROBLEMS_EXAMPLE;
    setRawJsonText(sample);
    setSyntaxError(null);
    setValidationErrors([]);
    setPreviewLectures(null);
    setPreviewProblems(null);
    setImportResult(null);
  };

  const handleValidate = () => {
    // Reset any previous feedback
    setSyntaxError(null);
    setValidationErrors([]);
    setPreviewLectures(null);
    setPreviewProblems(null);
    setImportResult(null);

    const trimmed = rawJsonText.trim();
    if (!trimmed) {
      setSyntaxError('The textarea is empty. Please paste a JSON array before validating.');
      return;
    }

    // 1. Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Invalid JSON syntax';
      setSyntaxError(`Invalid JSON syntax: ${errMsg}. Please ensure correct brackets, quotes, and commas.`);
      return;
    }

    // 2. Check if array
    if (!Array.isArray(parsed)) {
      setSyntaxError('Payload must be a JSON array (enclosed in square brackets [...]).');
      return;
    }

    // 3. Check 500 items cap
    if (parsed.length > 500) {
      setSyntaxError(`Single import is capped at 500 items. Your payload contains ${parsed.length} items. Please reduce the batch size.`);
      return;
    }

    if (parsed.length === 0) {
      setSyntaxError('The JSON array is empty. Please include at least one item.');
      return;
    }

    // 4. Validate every item against schema
    const errors: string[] = [];

    if (importType === 'lectures') {
      const validated: ValidatedLecture[] = [];

      parsed.forEach((item, index) => {
        const itemNumber = index + 1;

        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          errors.push(`Item ${itemNumber}: must be a JSON object`);
          return;
        }

        const record = item as Record<string, unknown>;

        // Lectures needs "title"
        if (!record.title || typeof record.title !== 'string' || !record.title.trim()) {
          errors.push(`Item ${itemNumber}: missing 'title'`);
        }

        if (record.videoUrl !== undefined && record.videoUrl !== null && typeof record.videoUrl !== 'string') {
          errors.push(`Item ${itemNumber}: 'videoUrl' must be a string`);
        }

        if (record.title && typeof record.title === 'string' && record.title.trim()) {
          validated.push({
            title: record.title.trim(),
            videoUrl: typeof record.videoUrl === 'string' ? record.videoUrl.trim() : undefined,
          });
        }
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setPreviewLectures(validated);
      }
    } else {
      // Problems type
      const validated: ValidatedProblem[] = [];

      parsed.forEach((item, index) => {
        const itemNumber = index + 1;

        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          errors.push(`Item ${itemNumber}: must be a JSON object`);
          return;
        }

        const record = item as Record<string, unknown>;

        // Problems needs "name"
        if (!record.name || typeof record.name !== 'string' || !record.name.trim()) {
          errors.push(`Item ${itemNumber}: missing 'name'`);
        }

        // Problems needs valid "difficulty" of Easy/Medium/Hard
        const validDifficulties = ['Easy', 'Medium', 'Hard'];
        if (!record.difficulty || typeof record.difficulty !== 'string' || !validDifficulties.includes(record.difficulty)) {
          errors.push(`Item ${itemNumber}: difficulty must be Easy/Medium/Hard`);
        }

        const category = typeof record.category === 'string' && record.category.trim()
          ? record.category.trim()
          : 'General';

        if (
          record.name &&
          typeof record.name === 'string' &&
          record.name.trim() &&
          record.difficulty &&
          typeof record.difficulty === 'string' &&
          validDifficulties.includes(record.difficulty)
        ) {
          validated.push({
            name: record.name.trim(),
            difficulty: record.difficulty as 'Easy' | 'Medium' | 'Hard',
            category,
            link: typeof record.link === 'string' ? record.link.trim() : undefined,
          });
        }
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setPreviewProblems(validated);
      }
    }
  };

  const handleResetImport = () => {
    setImportResult(null);
    setRawJsonText('');
    setSyntaxError(null);
    setValidationErrors([]);
    setPreviewLectures(null);
    setPreviewProblems(null);
  };

  const handleConfirmImport = async () => {
    if (isImporting) return;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setSyntaxError('Authentication session not found. Please log in again.');
      return;
    }

    if (importType === 'lectures') {
      if (!selectedSubjectId) {
        setSyntaxError('Please select a target subject before confirming import.');
        return;
      }
      if (!previewLectures || previewLectures.length === 0) {
        return;
      }

      setIsImporting(true);
      setImportResult(null);
      try {
        const res = await fetch(`/api/subjects/${selectedSubjectId}/lectures/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: previewLectures }),
        });

        const data = await res.json();
        if (res.ok || res.status === 207) {
          setImportResult({
            success: !!data.success,
            insertedCount: data.insertedCount || 0,
            failedCount: data.failedCount || 0,
            insertedItems: data.insertedItems || [],
            failedItems: data.failedItems || [],
            targetSubjectName: targetSubject?.name || 'Subject',
            targetSubjectId: selectedSubjectId,
            entityType: 'lectures',
          });
          if (data.success) {
            setRawJsonText('');
            setPreviewLectures(null);
          }
        } else {
          setImportResult({
            success: false,
            insertedCount: 0,
            failedCount: previewLectures.length,
            insertedItems: [],
            failedItems: previewLectures.map((l, i) => ({
              index: i + 1,
              title: l.title,
              error: data.message || 'Database write failure',
            })),
            targetSubjectName: targetSubject?.name || 'Subject',
            targetSubjectId: selectedSubjectId,
            entityType: 'lectures',
          });
        }
      } catch (err) {
        setImportResult({
          success: false,
          insertedCount: 0,
          failedCount: previewLectures.length,
          insertedItems: [],
          failedItems: previewLectures.map((l, i) => ({
            index: i + 1,
            title: l.title,
            error: err instanceof Error ? err.message : 'Network error occurred during import',
          })),
          targetSubjectName: targetSubject?.name || 'Subject',
          targetSubjectId: selectedSubjectId,
          entityType: 'lectures',
        });
      } finally {
        setIsImporting(false);
      }
    } else {
      // Problems
      if (!previewProblems || previewProblems.length === 0) {
        return;
      }

      setIsImporting(true);
      setImportResult(null);
      try {
        const res = await fetch('/api/problems/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: previewProblems }),
        });

        const data = await res.json();
        if (res.ok || res.status === 207) {
          setImportResult({
            success: !!data.success,
            insertedCount: data.insertedCount || 0,
            failedCount: data.failedCount || 0,
            insertedItems: data.insertedItems || [],
            failedItems: data.failedItems || [],
            entityType: 'problems',
          });
          if (data.success) {
            setRawJsonText('');
            setPreviewProblems(null);
          }
        } else {
          setImportResult({
            success: false,
            insertedCount: 0,
            failedCount: previewProblems.length,
            insertedItems: [],
            failedItems: previewProblems.map((p, i) => ({
              index: i + 1,
              name: p.name,
              error: data.message || 'Database write failure',
            })),
            entityType: 'problems',
          });
        }
      } catch (err) {
        setImportResult({
          success: false,
          insertedCount: 0,
          failedCount: previewProblems.length,
          insertedItems: [],
          failedItems: previewProblems.map((p, i) => ({
            index: i + 1,
            name: p.name,
            error: err instanceof Error ? err.message : 'Network error occurred during import',
          })),
          entityType: 'problems',
        });
      } finally {
        setIsImporting(false);
      }
    }
  };

  const activeSchema = importType === 'lectures' ? LECTURES_SCHEMA : PROBLEMS_SCHEMA;
  const activeExample = importType === 'lectures' ? LECTURES_EXAMPLE : PROBLEMS_EXAMPLE;
  const targetSubject = subjects.find((s) => s.id === selectedSubjectId);

  const previewItemCount =
    importType === 'lectures' ? previewLectures?.length ?? 0 : previewProblems?.length ?? 0;

  return (
    <div id="import-console-page" className="w-full space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Import Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Batch import curriculum lectures or coding problems using standardized JSON payloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Pipeline:</span>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-800 border border-slate-200">
            {importType === 'lectures' ? 'Subject Lectures' : 'Coding Problems'}
          </span>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-6">
        {/* Step 1: Type Selector */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              1. Target Entity Type
            </label>
            <span className="text-xs text-slate-400">Choose destination collection</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Subjects & Lectures Option */}
            <button
              id="import-type-lectures-btn"
              type="button"
              onClick={() => handleTypeChange('lectures')}
              className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                importType === 'lectures'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div
                className={`p-2 rounded-md shrink-0 ${
                  importType === 'lectures' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">Subjects & Lectures</span>
                  {importType === 'lectures' && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200 text-slate-800">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bulk append topics, lecture checklists, and study video links to an existing subject.
                </p>
              </div>
            </button>

            {/* Coding Repository Option */}
            <button
              id="import-type-problems-btn"
              type="button"
              onClick={() => handleTypeChange('problems')}
              className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                importType === 'problems'
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div
                className={`p-2 rounded-md shrink-0 ${
                  importType === 'problems' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Code className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">Coding Repository</span>
                  {importType === 'problems' && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-200 text-slate-800">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Batch add DSA questions with difficulty levels, categories, and practice links.
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Step 2: Target Subject Dropdown (Only visible if "Subjects & Lectures" is selected) */}
        {importType === 'lectures' && (
          <section className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label htmlFor="target-subject-select" className="text-xs font-semibold text-slate-700">
                2. Target Subject
              </label>
              <span className="text-xs text-slate-400">Lectures will append to this subject</span>
            </div>

            <div className="relative">
              <select
                id="target-subject-select"
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setPreviewLectures(null);
                }}
                disabled={isLoadingSubjects || subjects.length === 0}
                className="w-full bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm rounded-lg p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors appearance-none cursor-pointer"
              >
                {isLoadingSubjects ? (
                  <option value="">Loading your subjects...</option>
                ) : subjects.length === 0 ? (
                  <option value="">No subjects found. Create a subject in Subjects Hub first.</option>
                ) : (
                  subjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.name} {subj.isGlobal ? '(Global Curriculum)' : '(My Subject)'} — Current topics: {subj.totalTopics}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Imported lectures will automatically receive sequential session numbers starting after existing topics.
              </span>
            </p>
          </section>
        )}

        {/* Step 3: Exact JSON Schema & Filled Example */}
        <section className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-slate-700">
              {importType === 'lectures' ? '3' : '2'}. JSON Specification & Live Example
            </h2>

            <div className="flex items-center gap-2">
              <button
                id="copy-schema-btn"
                type="button"
                onClick={handleCopySchema}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                title="Copy schema specification"
              >
                {copiedSchema ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Schema</span>
                  </>
                )}
              </button>

              <button
                id="copy-example-btn"
                type="button"
                onClick={handleCopyExample}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
                title="Copy sample JSON data"
              >
                {copiedExample ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Example</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Schema & Example cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Schema Card */}
            <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="px-3.5 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Expected JSON Schema
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  Array of Objects
                </span>
              </div>
              <pre className="p-3.5 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed whitespace-pre select-all">
                {activeSchema}
              </pre>
            </div>

            {/* Filled Example Card */}
            <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="px-3.5 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  Sample Payload
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  Ready to test
                </span>
              </div>
              <pre className="p-3.5 text-xs font-mono text-sky-300 overflow-x-auto leading-relaxed whitespace-pre select-all">
                {activeExample}
              </pre>
            </div>
          </div>

          {/* Field Details Clarification Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
            <h3 className="text-xs font-semibold text-slate-700">
              {importType === 'lectures' ? 'Lectures Field Guide' : 'Coding Problems Field Guide'}
            </h3>
            {importType === 'lectures' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="font-mono font-medium text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    title
                  </span>
                  <span>
                    <strong className="text-slate-800">Required</strong> (string). The lecture topic name.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono font-medium text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    videoUrl
                  </span>
                  <span>
                    <strong className="text-slate-500">Optional</strong> (string). Link to YouTube or class video. Can be omitted.
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="font-mono font-medium text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    name
                  </span>
                  <span>
                    <strong className="text-slate-800">Required</strong> (string). Problem name.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono font-medium text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    difficulty
                  </span>
                  <span>
                    <strong className="text-slate-800">Required</strong>. "Easy", "Medium", or "Hard".
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono font-medium text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    category
                  </span>
                  <span>
                    <strong className="text-slate-800">Required</strong> (string). DSA category.
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Step 4: Textarea for Raw JSON */}
        <section className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label htmlFor="raw-json-textarea" className="text-xs font-semibold text-slate-700">
              {importType === 'lectures' ? '4' : '3'}. Paste JSON Array Payload
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
              >
                Insert Sample Data
              </button>
              <span className="text-xs font-mono text-slate-400">
                {rawJsonText.length} chars {rawJsonText ? `· ${rawJsonText.split('\n').length} lines` : ''}
              </span>
            </div>
          </div>

          <div className="relative">
            <textarea
              id="raw-json-textarea"
              value={rawJsonText}
              onChange={(e) => {
                setRawJsonText(e.target.value);
                setSyntaxError(null);
                setValidationErrors([]);
              }}
              placeholder={
                importType === 'lectures'
                  ? '[\n  {\n    "title": "Arrays basics",\n    "videoUrl": "https://youtube.com/..."\n  },\n  {\n    "title": "Two pointer technique",\n    "videoUrl": ""\n  }\n]'
                  : '[\n  {\n    "name": "Two Sum",\n    "difficulty": "Easy",\n    "category": "Array & Hashing",\n    "link": "https://leetcode.com/problems/two-sum/"\n  }\n]'
              }
              rows={11}
              className="w-full bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm p-3.5 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors leading-relaxed resize-y placeholder:text-slate-600"
              spellCheck={false}
            />
          </div>

          {/* Action Bar with Validate Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                id="validate-json-btn"
                type="button"
                onClick={handleValidate}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validate JSON</span>
              </button>

              {rawJsonText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawJsonText('');
                    setSyntaxError(null);
                    setValidationErrors([]);
                    setPreviewLectures(null);
                    setPreviewProblems(null);
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <span className="text-xs text-slate-400">
              Validation is performed locally before sending data to the server.
            </span>
          </div>

          {/* Syntax / Global Error Display */}
          {syntaxError && (
            <div
              id="import-syntax-error-banner"
              className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-semibold text-xs text-rose-900">Validation Error</h4>
                <p className="text-xs text-rose-700 leading-relaxed font-mono">{syntaxError}</p>
              </div>
            </div>
          )}

          {/* Detailed Item Errors List */}
          {validationErrors.length > 0 && (
            <div
              id="import-validation-errors-banner"
              className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 space-y-2"
            >
              <div className="flex items-center gap-2 text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <h4 className="font-semibold text-xs">
                  Validation Failed ({validationErrors.length} {validationErrors.length === 1 ? 'issue' : 'issues'} found)
                </h4>
              </div>
              <p className="text-xs text-rose-700">
                Fix the following line items in your JSON array and click <strong>Validate JSON</strong> again:
              </p>
              <ul className="space-y-1 max-h-52 overflow-y-auto pr-2">
                {validationErrors.map((err, idx) => (
                  <li
                    key={idx}
                    className="text-xs font-mono bg-white border border-rose-200 text-rose-800 px-2.5 py-1 rounded flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ingestion Result Banner */}
          {importResult && (
            <div
              id="import-result-banner"
              className={`p-4 rounded-xl border space-y-3 ${
                importResult.success && importResult.failedCount === 0
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : importResult.insertedCount > 0
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  {importResult.success && importResult.failedCount === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm">
                      {importResult.success && importResult.failedCount === 0
                        ? 'Import Successful'
                        : importResult.insertedCount > 0
                        ? 'Partial Import Notice'
                        : 'Import Failed'}
                    </h4>
                    <p className="text-xs leading-relaxed">
                      {importResult.success && importResult.failedCount === 0
                        ? `Successfully inserted all ${importResult.insertedCount} ${
                            importResult.entityType === 'lectures'
                              ? `lectures into "${importResult.targetSubjectName}"`
                              : 'problems into the Coding Repository'
                          }.`
                        : `Successfully inserted ${importResult.insertedCount} items; ${importResult.failedCount} items had errors.`}
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {importResult.insertedCount > 0 && (
                    <>
                      {importResult.entityType === 'lectures' && onNavigateToSubject && (
                        <button
                          id="view-imported-subject-btn"
                          type="button"
                          onClick={() => onNavigateToSubject(importResult.targetSubjectId || '')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>View {importResult.targetSubjectName || 'Subject'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {importResult.entityType === 'problems' && onNavigateToCoding && (
                        <button
                          id="view-imported-coding-btn"
                          type="button"
                          onClick={() => onNavigateToCoding()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span>View Coding Repository</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}

                  <button
                    id="import-another-batch-btn"
                    type="button"
                    onClick={handleResetImport}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Import Another Batch</span>
                  </button>
                </div>
              </div>

              {/* Partial Failure Items Detail */}
              {importResult.failedCount > 0 && importResult.failedItems.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <span className="text-xs font-semibold text-rose-900 block">
                    Failed Items ({importResult.failedCount})
                  </span>
                  <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {importResult.failedItems.map((fail, idx) => (
                      <li
                        key={idx}
                        className="text-xs font-mono bg-white border border-rose-200 text-rose-900 px-2.5 py-1 rounded flex items-center justify-between gap-2"
                      >
                        <span className="font-medium">
                          Item #{fail.index} ({fail.title || fail.name || 'Untitled'})
                        </span>
                        <span className="text-rose-700 text-[11px]">{fail.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Step 5: Preview Table */}
        {((importType === 'lectures' && previewLectures && previewLectures.length > 0) ||
          (importType === 'problems' && previewProblems && previewProblems.length > 0)) && (
          <section
            id="import-preview-section"
            className="space-y-3 pt-5 border-t border-slate-100"
          >
            {/* Header with Item Count & Confirm Import Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {previewItemCount} {previewItemCount === 1 ? 'item' : 'items'} validated
                  </span>
                  <span className="text-xs text-slate-500">
                    Ready to import
                  </span>
                </div>
                {importType === 'lectures' && targetSubject && (
                  <p className="text-xs text-slate-600 mt-1">
                    Target Subject:{' '}
                    <strong className="text-slate-900">{targetSubject.name}</strong> (topics will start at #
                    {targetSubject.totalTopics + 1})
                  </p>
                )}
              </div>

              {/* Confirm Import Action Button */}
              <button
                id="confirm-import-btn"
                type="button"
                disabled={isImporting}
                onClick={handleConfirmImport}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Confirm Import ({previewItemCount} {importType === 'lectures' ? 'Lectures' : 'Problems'})</span>
                  </>
                )}
              </button>
            </div>

            {/* Lectures Preview Table */}
            {importType === 'lectures' && previewLectures && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto overflow-x-auto">
                  <table className="w-full min-w-[460px] text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3.5 w-14 text-center">#</th>
                        <th className="py-2.5 px-3.5">Lecture Title</th>
                        <th className="py-2.5 px-3.5">Video Resource</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {previewLectures.map((lecture, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3.5 font-medium text-slate-900">
                            {lecture.title}
                          </td>
                          <td className="py-2.5 px-3.5">
                            {lecture.videoUrl ? (
                              <a
                                href={lecture.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline max-w-md truncate"
                              >
                                <Video className="w-3 h-3 shrink-0 text-slate-400" />
                                <span className="truncate">{lecture.videoUrl}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Problems Preview Table */}
            {importType === 'problems' && previewProblems && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3.5 w-14 text-center">#</th>
                        <th className="py-2.5 px-3.5">Problem Name</th>
                        <th className="py-2.5 px-3.5 w-24">Difficulty</th>
                        <th className="py-2.5 px-3.5">Category</th>
                        <th className="py-2.5 px-3.5">Practice Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {previewProblems.map((prob, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3.5 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3.5 font-medium text-slate-900">
                            {prob.name}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium uppercase tracking-wider ${
                                prob.difficulty === 'Easy'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : prob.difficulty === 'Medium'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {prob.difficulty}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-700">
                              {prob.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5">
                            {prob.link ? (
                              <a
                                href={prob.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline max-w-xs truncate"
                              >
                                <span className="truncate">{prob.link}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

