"""routers/assumptions.py — POST /api/assumptions/check"""

import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from core.assumptions import (
    check_normality, check_homogeneity_of_variance,
    check_outliers, check_linearity, check_independence_runs,
)
from core.decision_tree import TESTS

router = APIRouter()


class AssumptionRequest(BaseModel):
    test_id: str
    alpha: float = 0.05
    # Data columns as lists (serialised from the frontend)
    dv: Optional[List[float]] = None
    iv: Optional[List[float]] = None
    groups: Optional[Dict[str, List[float]]] = None   # {"A": [...], "B": [...]}
    differences: Optional[List[float]] = None


def _result_dict(r) -> dict:
    return {
        "name":           r.name,
        "passed":         bool(r.passed) if r.passed is not None else None,
        "statistic":      float(r.statistic) if r.statistic is not None else None,
        "p_value":        float(r.p_value) if r.p_value is not None else None,
        "interpretation": r.interpretation,
        "recommendation": r.recommendation,
        "severity":       r.severity,
    }


@router.post("/check")
def check_assumptions(req: AssumptionRequest):
    test = TESTS.get(req.test_id)
    if test is None:
        raise HTTPException(status_code=404, detail=f"Unknown test_id: {req.test_id}")

    results = []
    dv = pd.Series(req.dv) if req.dv else None
    iv = pd.Series(req.iv) if req.iv else None

    if "normality" in test.assumptions and dv is not None:
        r = check_normality(dv, req.alpha)
        results.append(_result_dict(r))

    if "normality_of_differences" in test.assumptions and req.differences:
        r = check_normality(pd.Series(req.differences), req.alpha)
        r2 = _result_dict(r)
        r2["name"] = "Normality of Differences"
        results.append(r2)

    if "homogeneity_of_variance" in test.assumptions and req.groups:
        group_series = [pd.Series(v) for v in req.groups.values()]
        if len(group_series) >= 2:
            r = check_homogeneity_of_variance(*group_series, alpha=req.alpha)
            results.append(_result_dict(r))

    if "no_significant_outliers" in test.assumptions and dv is not None:
        r = check_outliers(dv)
        results.append(_result_dict(r))

    if "linearity" in test.assumptions and iv is not None and dv is not None:
        r = check_linearity(iv, dv)
        results.append(_result_dict(r))

    if "independence" in test.assumptions and dv is not None:
        r = check_independence_runs(dv, req.alpha)
        results.append(_result_dict(r))

    return {"test_id": req.test_id, "results": results}
