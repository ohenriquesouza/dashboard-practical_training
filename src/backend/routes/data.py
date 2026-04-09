from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.bigquery import query_table, TABLES
import asyncio

from functools import partial

router = APIRouter()

async def query_async(table_name, ano, idProprietario):
    loop = asyncio.get_event_loop()
    fn = partial(query_table, table_name, ano=ano, idProprietario=idProprietario)
    return table_name, await loop.run_in_executor(None, fn)

@router.get("/tables")
def list_tables():
    return {"tables": TABLES}

@router.get("/table/{table_name}")
def get_table(
    table_name: str,
    ano: Optional[int] = Query(None),
    idProprietario: Optional[int] = Query(None),
):
    if table_name not in TABLES:
        return {"error": f"Tabela '{table_name}' não encontrada."}, 404
    data = query_table(table_name, ano=ano, idProprietario=idProprietario)
    return {"table": table_name, "total": len(data), "data": data}

@router.get("/all")
async def get_all(
    ano: Optional[int] = Query(None),
    idProprietario: Optional[int] = Query(None),
):
    """Roda todas as queries em paralelo."""
    tasks = [query_async(t, ano, idProprietario) for t in TABLES]
    results = await asyncio.gather(*tasks)
    return {name: {"total": len(data), "data": data} for name, data in results}

@router.get("/propriedade/{idPropriedade}/quimica-timeline")
def get_quimica_timeline(
    idPropriedade: int,
    ano_inicio: Optional[int] = Query(None),
    ano_fim: Optional[int] = Query(None),
):
    from services.bigquery import get_client, tb
    import pandas as pd
    import math
    import datetime

    try:
        client = get_client()

        filtro_anos = ""
        if ano_inicio is not None:
            filtro_anos += f" AND EXTRACT(YEAR FROM cq.DT_FIM_Ensaios) >= {int(ano_inicio)}"
        if ano_fim is not None:
            filtro_anos += f" AND EXTRACT(YEAR FROM cq.DT_FIM_Ensaios) <= {int(ano_fim)}"

        query = f"""
            SELECT
                EXTRACT(YEAR FROM cq.DT_FIM_Ensaios) AS ano,
                EXTRACT(MONTH FROM cq.DT_FIM_Ensaios) AS mes,
                cq.DT_FIM_Ensaios AS data_analise,
                ROUND(AVG(SAFE_CAST(cq.pH_H2O AS FLOAT64)), 2) AS pH_H2O,
                ROUND(AVG(SAFE_CAST(cq.pH_kcl AS FLOAT64)), 2) AS pH_kcl,
                ROUND(AVG(SAFE_CAST(cq.pH_CaCl2 AS FLOAT64)), 2) AS pH_CaCl2,
                ROUND(AVG(SAFE_CAST(cq.P AS FLOAT64)), 2) AS P,
                ROUND(AVG(SAFE_CAST(cq.K AS FLOAT64)), 2) AS K,
                ROUND(AVG(SAFE_CAST(cq.M_O AS FLOAT64)), 2) AS M_O,
                ROUND(AVG(SAFE_CAST(cq.Ca AS FLOAT64)), 2) AS Ca,
                ROUND(AVG(SAFE_CAST(cq.Mg AS FLOAT64)), 2) AS Mg,
                ROUND(AVG(SAFE_CAST(cq.Na AS FLOAT64)), 2) AS Na,
                ROUND(AVG(SAFE_CAST(cq.Al AS FLOAT64)), 2) AS Al,
                ROUND(AVG(SAFE_CAST(cq.H_Al AS FLOAT64)), 2) AS H_Al,
                ROUND(AVG(SAFE_CAST(cq.S AS FLOAT64)), 2) AS S,
                ROUND(AVG(SAFE_CAST(cq.CTC AS FLOAT64)), 2) AS CTC,
                ROUND(AVG(SAFE_CAST(cq.Soma_Bases AS FLOAT64)), 2) AS Soma_Bases,
                ROUND(AVG(SAFE_CAST(cq.Sat_Bases AS FLOAT64)), 2) AS Sat_Bases,
               
                COUNT(DISTINCT cq.idGrid) AS total_amostras
            FROM {tb('TB_CULTURA_QUIMICA_FULL')} cq
            INNER JOIN {tb('TB_UNIDADE_PRODUCAO')} up
                ON cq.idUnidadeProducao = up.idUnidadeProducao
            WHERE up.idProriedade = {idPropriedade}
            {filtro_anos}
            GROUP BY 1, 2, 3
            ORDER BY 1 ASC, 2 ASC, 3 ASC
        """

        print("=== quimica-timeline ===")
        print("idPropriedade:", idPropriedade)
        print("query:", query)

        job = client.query(query)
        df = job.to_dataframe()

        print("colunas:", list(df.columns))
        print("linhas:", len(df))

        if df.empty:
            return {
                "idPropriedade": idPropriedade,
                "parametros": [
                    "pH_H2O", "pH_kcl", "pH_CaCl2", "P", "K", "M_O",
                    "Ca", "Mg", "Na", "Al", "H_Al", "S", "CTC",
                    "Soma_Bases", "Sat_Bases"
                ],
                "total_registros": 0,
                "dados": []
            }

        def serialize_value(v):
            if pd.isna(v):
                return None

            if isinstance(v, (pd.Timestamp, datetime.datetime, datetime.date)):
                return v.isoformat()

            if isinstance(v, float):
                if math.isnan(v) or math.isinf(v):
                    return None
                return float(v)

            if isinstance(v, (int, str, bool)):
                return v

            # numpy / decimals / outros tipos
            try:
                return v.item()
            except Exception:
                return str(v)

        dados = []
        for _, row in df.iterrows():
            item = {col: serialize_value(row[col]) for col in df.columns}
            dados.append(item)

        return {
            "idPropriedade": idPropriedade,
            "parametros": [
                "pH_H2O", "pH_kcl", "pH_CaCl2", "P", "K", "M_O",
                "Ca", "Mg", "Na", "Al", "H_Al", "S", "CTC",
                "Soma_Bases", "Sat_Bases", "Sat_Al"
            ],
            "total_registros": len(dados),
            "dados": dados
        }

    except Exception as e:
        print("ERRO em /propriedade/{idPropriedade}/quimica-timeline:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/resumo/proprietarios")
def get_resumo_proprietarios():
    # print("QUERY NOVA EXECUTANDO!!!")
    from services.bigquery import get_client, tb
    import math

    client = get_client()

    query = f"""
        SELECT
            p.idProprietario,
            COALESCE(
                ARRAY_AGG(
                    CASE
                        WHEN pr.proprietario IS NOT NULL
                         AND TRIM(pr.proprietario) <> ''
                         AND TRIM(pr.proprietario) <> '-'
                        THEN pr.proprietario
                        ELSE NULL
                    END
                    IGNORE NULLS
                    LIMIT 1
                )[SAFE_OFFSET(0)],
                p.Nome
            ) AS nome_proprietario,
            COUNT(DISTINCT pr.idPropriedade)        AS total_fazendas,
            COUNT(DISTINCT up.idUnidadeProducao)    AS total_talhoes,
            ROUND(SUM(pr.areaTotal), 1)             AS area_total_ha,
            MAX(cq.DT_FIM_Ensaios)                  AS ultima_analise
        FROM {tb('TB_PROPRIETARIO')} p
        LEFT JOIN {tb('TB_PROPRIEDADE')} pr
            ON pr.idProprietario = p.idProprietario
        LEFT JOIN {tb('TB_UNIDADE_PRODUCAO')} up
            ON up.idProriedade = pr.idPropriedade
        LEFT JOIN {tb('TB_CULTURA_QUIMICA_FULL')} cq
            ON cq.idUnidadeProducao = up.idUnidadeProducao
        WHERE p.Ativo = TRUE
        GROUP BY p.idProprietario, p.Nome
        ORDER BY nome_proprietario
    """

    df = client.query(query).to_dataframe()
    records = df.to_dict(orient="records")
    cleaned = []

    for row in records:
        cleaned.append({
            k: (
                None if (isinstance(v, float) and math.isnan(v))
                else str(v) if hasattr(v, 'isoformat')
                else v
            )
            for k, v in row.items()
        })

    return {"proprietarios": cleaned}


@router.get("/proprietario/{idProprietario}/painel")
def get_painel_proprietario(idProprietario: int):
    """Retorna dados completos do proprietário para o painel."""
    from services.bigquery import get_client, tb, clean
    import math
    client = get_client()

    # Dados do proprietário
    q_prop = f"""
        SELECT idProprietario, Nome, Ativo, tsInclusao
        FROM {tb('TB_PROPRIETARIO')}
        WHERE idProprietario = {idProprietario}
        LIMIT 1
    """

    # Fazendas com área e geom
    q_fazendas = f"""
    SELECT
        pr.idPropriedade,
        pr.nome_Fazenda,
        pr.areaTotal,
        pr.geom,
        pr.proprietario,
        COUNT(DISTINCT up.idUnidadeProducao) AS total_talhoes
        FROM {tb('TB_PROPRIEDADE')} pr
        LEFT JOIN {tb('TB_UNIDADE_PRODUCAO')} up
            ON up.idProriedade = pr.idPropriedade
        WHERE pr.idProprietario = {idProprietario}
        GROUP BY pr.idPropriedade, pr.nome_Fazenda, pr.areaTotal, pr.geom, pr.proprietario
        ORDER BY pr.nome_Fazenda
    """

    df_prop    = client.query(q_prop).to_dataframe()
    df_fazendas = client.query(q_fazendas).to_dataframe()

    if df_prop.empty:
        return {"error": "Proprietário não encontrado"}

    prop = clean(df_prop)[0]
    fazendas = clean(df_fazendas)

    return {
        "proprietario": prop,
        "fazendas": fazendas,
    }