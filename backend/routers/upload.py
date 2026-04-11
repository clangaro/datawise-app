"""routers/upload.py — POST /api/upload/file"""

import io
import json
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()


@router.post("/file")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported.")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse file: {e}")

    # Summary statistics for each column
    columns_info = []
    for col in df.columns:
        col_data = df[col]
        info = {
            "name": col,
            "dtype": str(col_data.dtype),
            "n_unique": int(col_data.nunique()),
            "n_missing": int(col_data.isna().sum()),
            "pct_missing": round(col_data.isna().mean() * 100, 1),
        }
        if pd.api.types.is_numeric_dtype(col_data):
            info.update({
                "mean":   round(float(col_data.mean()), 4),
                "std":    round(float(col_data.std()), 4),
                "min":    round(float(col_data.min()), 4),
                "max":    round(float(col_data.max()), 4),
                "median": round(float(col_data.median()), 4),
            })
        columns_info.append(info)

    # Return first 100 rows as JSON for the frontend preview table
    preview = json.loads(df.head(100).to_json(orient="records"))

    return {
        "filename":    file.filename,
        "n_rows":      int(df.shape[0]),
        "n_cols":      int(df.shape[1]),
        "columns":     columns_info,
        "preview":     preview,
    }
