from fastapi import APIRouter, Query
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
    from services.bigquery import get_client, tb, clean
    
    client = get_client()
    filtro_anos = ""
    if ano_inicio:
        filtro_anos += f" AND EXTRACT(YEAR FROM cq.DT_FIM_Ensaios) >= {ano_inicio}"
    if ano_fim:
        filtro_anos += f" AND EXTRACT(YEAR FROM cq.DT_FIM_Ensaios) <= {ano_fim}"
    
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
            ROUND(AVG(SAFE_CAST(cq.O AS FLOAT64)), 2) AS O,
            ROUND(AVG(SAFE_CAST(cq.Ca AS FLOAT64)), 2) AS Ca,
            ROUND(AVG(SAFE_CAST(cq.Mg AS FLOAT64)), 2) AS Mg,
            ROUND(AVG(SAFE_CAST(cq.Na AS FLOAT64)), 2) AS Na,
            ROUND(AVG(SAFE_CAST(cq.Al AS FLOAT64)), 2) AS Al,
            ROUND(AVG(SAFE_CAST(cq.H_Al AS FLOAT64)), 2) AS H_Al,
            ROUND(AVG(SAFE_CAST(cq.S AS FLOAT64)), 2) AS S,
            ROUND(AVG(SAFE_CAST(cq.CTC AS FLOAT64)), 2) AS CTC,
            ROUND(AVG(SAFE_CAST(cq.Soma_Bases AS FLOAT64)), 2) AS Soma_Bases,
            ROUND(AVG(SAFE_CAST(cq.Sat_Bases AS FLOAT64)), 2) AS Sat_Bases,
            ROUND(AVG(SAFE_CAST(cq.Sat_Al AS FLOAT64)), 2) AS Sat_Al,
            COUNT(DISTINCT up.idUnidadeProducao) AS total_amostras
        FROM {tb('TB_CULTURA_QUIMICA_FULL')} cq
        LEFT JOIN {tb('TB_UNIDADE_PRODUCAO')} up
            ON cq.idUnidadeProducao = up.idUnidadeProducao
        WHERE up.idPropriedade = {idPropriedade}
        {filtro_anos}
        GROUP BY ano, mes, data_analise
        ORDER BY ano ASC, mes ASC, data_analise ASC
    """
    
    df = client.query(query).to_dataframe()
    data = clean(df)
    
    return {
        "idPropriedade": idPropriedade,
        "parametros": ["pH_H2O", "pH_kcl", "pH_CaCl2", "P", "K", "M_O", "O", "Ca", "Mg", "Na", "Al", "H_Al", "S", "CTC", "Soma_Bases", "Sat_Bases", "Sat_Al"],
        "total_registros": len(data),
        "dados": data
    }


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