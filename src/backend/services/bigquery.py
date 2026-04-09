from google.cloud import bigquery
from functools import lru_cache
import pandas as pd
import math
import hashlib
import time

PROJECT_ID = "analytics-428911"
DATASET = "AGRO_TECHNICAL_TEST"

TABLES = [
    "TB_PROPRIETARIO",
    "TB_PROPRIEDADE",
    "TB_UNIDADE_PRODUCAO",
    "TB_GRID_FULL",
    "VW_TB_CULTURA_QUIMICA",
    "VW_DASH_FERTILIDADE_SOLO",
]

# Cache simples em memória — TTL de 5 minutos
_cache: dict = {}
CACHE_TTL = 300

@lru_cache(maxsize=1)
def get_client() -> bigquery.Client:
    return bigquery.Client(project=PROJECT_ID)

def clean(df: pd.DataFrame) -> list:
    records = df.to_dict(orient="records")
    cleaned = []
    for row in records:
        cleaned.append({
            k: (None if (isinstance(v, float) and math.isnan(v)) else
                str(v) if hasattr(v, 'isoformat') else v)
            for k, v in row.items()
        })
    return cleaned

def tb(name: str) -> str:
    return f"`{PROJECT_ID}.{DATASET}.{name}`"

def build_where(*clauses):
    active = [c for c in clauses if c]
    return f"WHERE {' AND '.join(active)}" if active else ""

def _cache_key(table_name, ano, idProprietario):
    raw = f"{table_name}|{ano}|{idProprietario}"
    return hashlib.md5(raw.encode()).hexdigest()

def query_table(table_name: str, ano: int = None, idProprietario: int = None) -> list:
    key = _cache_key(table_name, ano, idProprietario)
    now = time.time()

    if key in _cache and (now - _cache[key]['ts']) < CACHE_TTL:
        return _cache[key]['data']

    client = get_client()
    w_prop = f"idProprietario = {idProprietario}" if idProprietario else None
    w_ano  = f"ano = {ano}" if ano else None

    if table_name == "TB_PROPRIETARIO":
        query = f"SELECT * FROM {tb('TB_PROPRIETARIO')}"

    elif table_name == "TB_PROPRIEDADE":
        query = f"SELECT * FROM {tb('TB_PROPRIEDADE')} {build_where(w_prop)}"

    elif table_name == "TB_UNIDADE_PRODUCAO":
        if idProprietario:
            query = f"""
                SELECT up.*
                FROM {tb('TB_UNIDADE_PRODUCAO')} up
                INNER JOIN {tb('TB_PROPRIEDADE')} pr
                    ON up.idProriedade = pr.idPropriedade
                WHERE pr.idProprietario = {idProprietario}
            """
        else:
            query = f"SELECT * FROM {tb('TB_UNIDADE_PRODUCAO')}"

    elif table_name == "TB_GRID_FULL":
        ano_clause = f"AND g.ano = {ano}" if ano else ""
        if idProprietario:
            query = f"""
                SELECT g.*
                FROM {tb('TB_GRID_FULL')} g
                INNER JOIN {tb('TB_UNIDADE_PRODUCAO')} up
                    ON g.idUnidadeProducao = up.idUnidadeProducao
                INNER JOIN {tb('TB_PROPRIEDADE')} pr
                    ON up.idProriedade = pr.idPropriedade
                WHERE pr.idProprietario = {idProprietario}
                {ano_clause}
            """
        else:
            query = f"SELECT * FROM {tb('TB_GRID_FULL')} {build_where(w_ano)}"

    elif table_name == "TB_CULTURA_QUIMICA_FULL":
        ano_clause = f"AND cq.ano = {ano}" if ano else ""
        if idProprietario:
            query = f"""
                SELECT cq.*
                FROM {tb('TB_CULTURA_QUIMICA_FULL')} cq
                INNER JOIN {tb('TB_UNIDADE_PRODUCAO')} up
                    ON cq.idUnidadeProducao = up.idUnidadeProducao
                INNER JOIN {tb('TB_PROPRIEDADE')} pr
                    ON up.idProriedade = pr.idPropriedade
                WHERE pr.idProprietario = {idProprietario}
                {ano_clause}
            """
        else:
            query = f"SELECT * FROM {tb('TB_CULTURA_QUIMICA_FULL')} {build_where(w_ano)}"

    elif table_name == "VW_TB_CULTURA_QUIMICA":
        ano_clause = f"AND vq.ano = {ano}" if ano else ""
        if idProprietario:
            query = f"""
                SELECT vq.*
                FROM {tb('VW_TB_CULTURA_QUIMICA')} vq
                INNER JOIN {tb('TB_UNIDADE_PRODUCAO')} up
                    ON vq.idUnidadeProducao = up.idUnidadeProducao
                INNER JOIN {tb('TB_PROPRIEDADE')} pr
                    ON up.idProriedade = pr.idPropriedade
                WHERE pr.idProprietario = {idProprietario}
                {ano_clause}
            """
        else:
            query = f"SELECT * FROM {tb('VW_TB_CULTURA_QUIMICA')} {build_where(w_ano)}"

    elif table_name == "VW_DASH_FERTILIDADE_SOLO":
        clauses = []
        if idProprietario:
            clauses.append(f"idProprietario = {idProprietario}")
        if ano:
            clauses.append(f"ano = {ano}")
        query = f"SELECT * FROM {tb('VW_DASH_FERTILIDADE_SOLO')} {build_where(*clauses)}"

    else:
        query = f"SELECT * FROM {tb(table_name)}"

    df = client.query(query).to_dataframe()
    result = clean(df)
    _cache[key] = {'data': result, 'ts': now}
    return result