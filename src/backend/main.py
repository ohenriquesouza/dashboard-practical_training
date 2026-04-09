from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import data

app = FastAPI(title="AgroSyntech API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1316"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api")