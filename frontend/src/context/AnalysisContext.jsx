import { createContext, useContext, useState, useCallback, useMemo } from "react";

const AnalysisContext = createContext(null);

const INITIAL_STATE = {
  profile: null,
  recommendation: null,
  fileData: null,
  columnRoles: { dv: null, iv: null, group: null, covariates: [] },
  assumptionResults: [],
  selectedTestId: null,
  testResult: null,
  alpha: 0.05,
};

export function AnalysisProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);

  const setProfile          = useCallback((profile)         => setState(s => ({ ...s, profile })), []);
  const setRecommendation   = useCallback((recommendation)  => setState(s => ({ ...s, recommendation, selectedTestId: recommendation?.primary?.id ?? s.selectedTestId })), []);
  const setFileData         = useCallback((fileData)        => setState(s => ({ ...s, fileData })), []);
  const setColumnRoles      = useCallback((columnRoles)     => setState(s => ({ ...s, columnRoles: { ...s.columnRoles, ...columnRoles } })), []);
  const setAssumptionResults = useCallback((assumptionResults) => setState(s => ({ ...s, assumptionResults })), []);
  const setSelectedTestId   = useCallback((selectedTestId)  => setState(s => ({ ...s, selectedTestId })), []);
  const setTestResult       = useCallback((testResult)      => setState(s => ({ ...s, testResult })), []);
  const setAlpha            = useCallback((alpha)           => setState(s => ({ ...s, alpha })), []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const value = useMemo(() => ({
    ...state,
    setProfile,
    setRecommendation,
    setFileData,
    setColumnRoles,
    setAssumptionResults,
    setSelectedTestId,
    setTestResult,
    setAlpha,
    reset,
  }), [state, setProfile, setRecommendation, setFileData, setColumnRoles, setAssumptionResults, setSelectedTestId, setTestResult, setAlpha, reset]);

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used inside <AnalysisProvider>");
  return ctx;
}
