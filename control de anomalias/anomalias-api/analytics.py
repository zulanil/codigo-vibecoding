import math
import pandas as pd
import numpy as np
from io import StringIO


def _safe(val: float) -> float:
    """Convierte nan/inf a 0 para serialización JSON segura."""
    f = float(val)
    return 0.0 if (math.isnan(f) or math.isinf(f)) else f

MAX_DISPLAY_POINTS = 3_000  # puntos máximos enviados al frontend


def limpiar_datos(contenido: str) -> pd.DataFrame:
    """Detecta separador (coma o punto y coma), parsea CSV, elimina duplicados."""
    separador = ";" if contenido.count(";") > contenido.count(",") else ","
    df = pd.read_csv(StringIO(contenido), sep=separador)
    df = df.drop_duplicates()
    df = df.reset_index(drop=True)
    return df


def calcular_anomalias_shewhart(
    df: pd.DataFrame,
    col_x: str,
    col_y: str,
    sigma: float = 3.0,
    max_display: int = MAX_DISPLAY_POINTS,
) -> dict:
    """
    Shewhart sobre el dataset COMPLETO para precisión estadística exacta.
    Downsample solo los puntos normales para reducir el payload al frontend.
    Todos los puntos anómalos se preservan e inyectan de vuelta.
    """
    # ── 1. Calcular estadísticos sobre dataset ORIGINAL completo ─────────────
    df_trabajo = df[[col_x, col_y]].copy()
    df_trabajo[col_y] = pd.to_numeric(df_trabajo[col_y], errors="coerce")
    df_trabajo = df_trabajo.dropna(subset=[col_y])

    serie = df_trabajo[col_y]
    media = _safe(serie.mean())
    desv  = _safe(serie.std()) if len(serie) > 1 else 0.0
    lcs   = media + sigma * desv
    lci   = media - sigma * desv

    # ── 2. Etiquetar anomalías sobre dataset completo ────────────────────────
    df_trabajo["anomalia"] = (df_trabajo[col_y] > lcs) | (df_trabajo[col_y] < lci)

    df_anomalias = df_trabajo[df_trabajo["anomalia"]].copy()
    df_normales  = df_trabajo[~df_trabajo["anomalia"]].copy()

    total_puntos   = len(df_trabajo)
    total_anomalias = len(df_anomalias)

    # ── 3. Downsample normales — anomalías siempre completas ─────────────────
    budget_normales = max(max_display - total_anomalias, 100)

    if len(df_normales) > budget_normales:
        step = max(1, len(df_normales) // budget_normales)
        df_normales_red = df_normales.iloc[::step].head(budget_normales)
    else:
        df_normales_red = df_normales

    # ── 4. Combinar y ordenar para mantener continuidad visual ───────────────
    df_display = (
        pd.concat([df_normales_red, df_anomalias])
        .sort_values(col_x)
        .reset_index(drop=True)
    )

    return {
        "media":                    round(_safe(media), 6),
        "desviacion_std":           round(_safe(desv),  6),
        "limite_control_superior":  round(_safe(lcs),   6),
        "limite_control_inferior":  round(_safe(lci),   6),
        "total_puntos":             total_puntos,       # conteo REAL del dataset
        "total_anomalias":          total_anomalias,
        "puntos_display":           len(df_display),    # puntos enviados al front
        "downsampled":              len(df_normales) > budget_normales,
        "anomalias":                df_anomalias.to_dict(orient="records"),
        "serie":                    df_display.to_dict(orient="records"),
    }


# =============================================================================
# MODELOS AVANZADOS DE MACHINE LEARNING — agregar aquí
# =============================================================================
#
# def calcular_anomalias_isolation_forest(df, col_x, col_y, contaminacion=0.05):
#     """IsolationForest de sklearn para detección no paramétrica."""
#     pass
#
# def calcular_anomalias_lof(df, col_x, col_y, n_neighbors=20):
#     """Local Outlier Factor (sklearn)."""
#     pass
#
# def calcular_anomalias_autoencoder(df, col_x, col_y):
#     """Autoencoder con Keras para series temporales largas."""
#     pass
#
# =============================================================================
