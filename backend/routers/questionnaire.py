"""routers/questionnaire.py — POST /api/questionnaire/recommend"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from core.decision_tree import recommend_tests, StatisticalTest

router = APIRouter()


class QuestionnairePayload(BaseModel):
    research_question_type: str          # comparison | correlation | prediction | description
    research_question_text: Optional[str] = ""
    measurement_level: str               # nominal | ordinal | interval_ratio
    binary_outcome: bool = False
    n_groups: int = 2
    n_predictors: int = 1
    design: str = "independent"          # independent | paired | mixed
    sample_size: int = 30
    sampling_method: str = "random"
    normality_known: Optional[bool] = None
    equal_variances_known: Optional[bool] = None
    has_covariates: bool = False
    covariates: str = ""
    alpha: float = 0.05
    multiple_comparisons: bool = False
    mc_method: Optional[str] = None


def _serialise_test(t: StatisticalTest) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "assumptions": t.assumptions,
        "parametric": t.parametric,
        "references": t.references,
        "notes": t.notes,
    }


@router.post("/recommend")
def recommend(payload: QuestionnairePayload):
    profile = payload.model_dump()
    rec = recommend_tests(profile)
    return {
        "primary": _serialise_test(rec.primary),
        "alternatives": [_serialise_test(a) for a in rec.alternatives],
        "rationale": rec.rationale,
    }
