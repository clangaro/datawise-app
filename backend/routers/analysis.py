"""routers/analysis.py — POST /api/analysis/run"""

import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from core.statistical_tests import TEST_RUNNERS

router = APIRouter()


class AnalysisRequest(BaseModel):
    test_id: str
    alpha: float = 0.05
    dv: Optional[List[float]] = None
    iv: Optional[List[float]] = None
    groups: Optional[Dict[str, List[float]]] = None
    contingency_table: Optional[Dict[str, Any]] = None   # {row: {col: count}}


@router.post("/run")
def run_analysis(req: AnalysisRequest):
    runner = TEST_RUNNERS.get(req.test_id)
    if runner is None:
        raise HTTPException(status_code=404,
                            detail=f"No runner implemented for test_id: {req.test_id}")

    try:
        if req.test_id in ("independent_t", "welch_t", "mann_whitney", "paired_t"):
            if not req.groups or len(req.groups) < 2:
                raise ValueError("Need exactly 2 groups.")
            g1, g2 = [pd.Series(v) for v in list(req.groups.values())[:2]]
            result = runner(g1, g2, alpha=req.alpha)

        elif req.test_id in ("one_way_anova", "kruskal_wallis"):
            if not req.groups or len(req.groups) < 3:
                raise ValueError("Need ≥ 3 groups.")
            groups = [pd.Series(v) for v in req.groups.values()]
            result = runner(*groups, alpha=req.alpha)

        elif req.test_id == "chi_square":
            if not req.contingency_table:
                raise ValueError("Need a contingency table.")
            ct = pd.DataFrame(req.contingency_table)
            result = runner(ct, alpha=req.alpha)

        elif req.test_id in ("pearson_r", "spearman_rho"):
            if req.iv is None or req.dv is None:
                raise ValueError("Need both iv and dv.")
            result = runner(pd.Series(req.iv), pd.Series(req.dv), alpha=req.alpha)

        else:
            raise HTTPException(status_code=501,
                                detail=f"Runner for {req.test_id} not yet implemented.")

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {
        "test_name":         result.test_name,
        "statistic_name":    result.statistic_name,
        "statistic":         result.statistic,
        "p_value":           result.p_value,
        "effect_size":       result.effect_size,
        "effect_size_name":  result.effect_size_name,
        "df":                str(result.df) if result.df is not None else None,
        "significant":       result.significant,
        "interpretation":    result.interpretation,
        "alpha":             req.alpha,
    }
