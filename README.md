# 🔬 DataWise

> A scientifically-validated, questionnaire-guided interactive data analysis tool.  
> **Stack:** React + Vite (frontend) · FastAPI (backend) · scipy / statsmodels / pingouin

---

## Repo Structure

```
datawise-app/
├── backend/                    # FastAPI Python API
│   ├── main.py                 # App entry point + CORS
│   ├── routers/
│   │   ├── questionnaire.py    # POST /api/questionnaire/recommend
│   │   ├── upload.py           # POST /api/upload/file
│   │   ├── assumptions.py      # POST /api/assumptions/check
│   │   └── analysis.py         # POST /api/analysis/run
│   ├── core/
│   │   ├── decision_tree.py    # ★ Questionnaire → test recommendation
│   │   ├── assumptions.py      # Normality, Levene's, outliers, linearity
│   │   └── statistical_tests.py # t-tests, ANOVA, chi², correlations
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── api/client.js       # axios API wrapper
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Questionnaire.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Assumptions.jsx
│   │   │   ├── Analysis.jsx
│   │   │   ├── Visualisation.jsx
│   │   │   └── Report.jsx
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Custom React hooks
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js          # Proxy: /api → localhost:8000
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Quickstart

### Option A — Docker (recommended)
```bash
git clone <your-repo>
cd datawise-app
docker compose up --build
# Frontend: http://localhost:5173
# API docs: http://localhost:8000/docs
```

### Option B — Manual

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend** (new terminal)
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/questionnaire/recommend` | Submit profile → get recommended test |
| POST | `/api/upload/file` | Upload CSV/Excel → get column summaries |
| POST | `/api/assumptions/check` | Run formal assumption checks |
| POST | `/api/analysis/run` | Execute statistical test |
| GET  | `/docs` | Interactive Swagger UI |

---

## Statistical Tests Supported

| Design | Parametric | Non-parametric |
|--------|-----------|----------------|
| 2 independent groups | t-test / Welch's t | Mann-Whitney U |
| 2 paired groups | Paired t-test | Wilcoxon signed-rank |
| 3+ independent groups | One-way ANOVA / Welch's | Kruskal-Wallis |
| 3+ repeated conditions | RM-ANOVA | Friedman |
| Categorical association | Chi-square | Fisher's exact |
| Correlation | Pearson's r | Spearman's ρ / Kendall's τ |
| Prediction (1 IV) | Simple linear regression | — |
| Prediction (n IVs) | Multiple linear regression | — |
| Binary outcome | Logistic regression | — |

---

## Deployment Options

| Platform | Free tier | Notes |
|----------|-----------|-------|
| **Railway** | ✅ | Deploy backend from `backend/` folder |
| **Vercel** | ✅ | Deploy frontend, set `VITE_API_URL` env var |
| **Render** | ✅ | Works for both services |
| **Hugging Face Spaces** | ✅ | Good for ML-adjacent tools |
| **Fly.io** | ✅ | Full Docker stack, generous free tier |

See `docs/deployment.md` for step-by-step guides (coming soon).

---

## Roadmap

- [x] Core decision tree (15+ tests)
- [x] Formal assumption checkers
- [x] FastAPI backend with typed endpoints
- [x] React + Vite frontend skeleton
- [ ] Post-hoc tests (Tukey, Dunn's)
- [ ] Power analysis / sample size calculator
- [ ] PDF report export
- [ ] Bayesian alternatives (via pingouin)
- [ ] Claude API integration for AI-assisted interpretation
- [ ] Survival analysis (Kaplan-Meier)
