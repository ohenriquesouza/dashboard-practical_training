# AgroSyntech - Funcional DashBoard

## O DESAFIO 🚀

Desenvolver um dashboard funcional capaz de apresentar informações relevantes para o negócio, propor análises úteis para o cliente final e raciocinar sobre qualidade de dados e evolução analítica da solução.

---
## ANÁLISE DOS DADOS OBTIDOS 📊

Para que essa sessão fique bem definida, foram considerados para a análise os dados obtidos através das propriedas de `id 16` e `id 17`. Foi utilizado, para condensar os dados, o relatório gerado das propriedades em questão.

### I- OVERVIEW
Ao abrir os relatórios gerados das propriedades `id 16`(Lotes 11-13) e `id 17` (Lotes 38-39-40), o que vemos é um retrato de como a digitalização do campo transforma dados brutos em estratégia.

Em análise, os aproximadamente 1.337 hectares (ao todo), revelam cenários diferentes. Enquanto a propriedade 1 (Lotes 11-13) apresentam uma complexidade maior, com número maior de talhões em estado crítico (neste projeto, classificados como vermelho, são aqueles com valores muito acima, ou muito abaxio do nr. de referência) aqueles que precisam de intervenção imediata, a propriedade 2 (Lotes 38-40) mostram uma gestão de fertilidade mais homogênea, embora ainda possua desafios pontuais como flutuações nos níveis de Fósforo e Potássio, o que se não tratado, certamente irão prejudicar o desenvolvimento da cultura.

### II- NÚMEROS

Na última página de cada relatório, é exibido ao leitor os indicadores, bem como os gráficos das análises químicas de forma geral (propriedade). A tabela abaixo mostra de forma condesanda um resumo do que foi tirado do relatório quanto aos status da propriedade:

| Propriedade  | Área Total | Última Análise | Status Dominante        | Principal Gargalo               |
|--------------|-----------:|----------------|--------------------------|--------------------------------|
| Lotes 11-13  | 661.0 ha   | 19/03/2026     | Crítico (Vermelho)       | Acidez e Fertilidade Geral     |
| Lotes 38-40  | 676.0 ha   | 24/02/2026     | Estável (Amarelo/Verde)  | Fósforo e Potássio             |


O principal problema identificado está na distribuição dos nutrientes no solo, especialmente na superfície. Isso acaba criando uma espécie de armadilha para o crescimento das plantas, dificultando o desenvolvimento da lavoura. Nos Lotes 11 a 13 (propriedade 1), por exemplo, a quantidade de Fósforo (P) cai de 46,0 mg/dm³ na camada de 0-20 cm para apenas 7,9 mg/dm³ na profundidade de 80-100 cm. Já nos Lotes 38 a 40 (propriedade 2), o Potássio (K) diminui de 81,2 mmolc/dm³ para 37,2 mmolc/dm³ conforme vai mais fundo no solo. 

Acredita-se que como resultado, o solo fica muito vulnerável durante períodos de seca e a produtividade fica bastante limitada, já que as plantas ficam dependentes apenas dos primeiros centímetros do solo para sobreviver.

* Os relatórios utilizados para essa curta análise podem ser acessados via gDrive:

[📄 Relatório Prop 11-13](https://drive.google.com/file/d/1YVjz_L_HCmKnTHH24jDf7Tp8Vqx4dyym/view?usp=sharing)

[📄 Relatório Prop 38-39-40](https://drive.google.com/file/d/1ma6LoWAHLu_toW52I8Dx0jnONbzXr-cJ/view?usp=sharing)

---
## INSTRUÇÃO DE EXECUÇÃO 💻

### Pré-requisitos

Certifique-se de ter instalado:
- **Node.js** (para o frontend)
- **Python 3.8+** (para o backend)

---

### Backend

```bash
# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
cd src/backend
python -m uvicorn main:app 
```

---

### Frontend

```bash
# Instale as dependências e inicie o servidor de desenvolvimento
cd src/frontend
npm install
npm run dev
```
---
## Machine Learning com Potencial de agregar 🤖

Com os dados disponíveis no projeto (análises químicas do solo por talhão/grid e sua evolução temporal)  duas abordagens com **redes neurais** do tipo  **MLP** se mostram especialmente promissoras.

---
### Abordagem 1 — Previsão de Indicadores Químicos por Talhão

**Problema que resolve:**  
Hoje, o produtor só sabe o estado do solo *depois* de pagar por uma análise laboratorial. A previsão busca antecipar os valores dos principais indicadores químicos (pH, P, K, MO, etc.) em um range de **6 a 8 meses** — uma janela de tempo que se mostra longa o suficiente para
planejar o manejo e curta o suficiente para evitar problemas com a RNA.

**Metodologia:**  
MLP seria treinada sobre a base histórica de cada talhão
para prever os valores futuros. Quanto mais coletas acumuladas, melhor o desempenho do modelo.

**Qual benefício pode gerar?**  
Redução de análises laboratoriais desnecessárias, planejamento antecipado de correção e tomada de decisão melhor informada.

---
### Abordagem 2 — Previsão de Tempo até Estado Crítico por Grid

**Problema que resolve:**  
Tomando de base que a Abordagem 1 é realidade, teremos uma previsão do **que** vai acontecer, mas não **quando**. Essa segunda abordagem
estima, para cada grid, **daqui a quanto tempo** algum indicador químico vai atingir um nível
crítico, permitindo priorizar intervenções antes que o problema se instale.

**Metodologia:**  
MLP de regressão vai ser treinada para prever o tempo residual até que um ou mais indicadores cruzem um nível definido como crítico (muito alto, ou muito baixo). O treinamento poderia ser feito a partir do histórico já existente: para cada ponto no passado, é possível saber
exatamente quanto tempo levou até o próximo estado crítico.

**Qual benefício pode gerar?**  
Em vez de tratar todos os talhões igualmente, o produtor passa a ter uma **fila de prioridades** otimizando recursos, reduzindo perdas e focando seu investimento onde realmente é necessário agora.

---
### Por que MLP?
As duas abordagens propostas se beneficiam devido as características do conjunto de dados que possui: volumoso e rico. Múltiplas variáveis contínuas e padrões **não lineares** de degradação do
solo, o que coloca a MLP na frente de outras RNAs por sua capacidade classificativa em cenários não lineares.

MLP é uma escolha honesta também por sua boa capacidade de generalização, interpretação satisfatória dos
resultados e implementação extremamente acessível. Além da experiência direta com a arquitetura: o modelo foi recentemente utilizado no meu TCC, voltado à identificação de autoria de código-fonte a partir de fingerprints estruturais, portanto, suas características, usabilidade e capacidade estão bem frescas na memória.





