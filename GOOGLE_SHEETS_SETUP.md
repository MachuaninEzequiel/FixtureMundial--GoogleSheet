# Configuración de Google Sheets — FixtureMundial 2026

## Estructura de hojas requeridas

### Hoja `matches` — Partidos
| A: id | B: team_a | C: flag_a | D: team_b | E: flag_b | F: phase | G: group_name | H: match_date | I: real_score_a | J: real_score_b | K: status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Argentina | AR | España | ES | groups | A | 1750000000 | | | scheduled |

- `match_date`: timestamp UNIX en segundos
- `status`: `scheduled` / `live` / `finished`
- `real_score_a/b`: vacío hasta que el partido termine; luego ingresar el resultado real

---

### Hoja `predictions` — Pronósticos de usuarios
| A: email | B: match_id | C: score_a | D: score_b | E: timestamp |
|---|---|---|---|---|
| user@gmail.com | 1 | 2 | 1 | 2026-06-11T20:00:00Z |

> ⚠️ Esta hoja es **escrita automáticamente** por la API. No modificar manualmente.

---

### Hoja `ranking` — Tabla de posiciones

| A: email | B: username | C: total_points | D: total_predictions | E: correct_predictions |
|---|---|---|---|---|
| user@gmail.com | Juan García | *(fórmula)* | *(fórmula)* | *(fórmula)* |

> Las columnas A y B son escritas por la API (`/api/sync-user`).  
> Las columnas C, D y E deben tener **fórmulas de Google Sheets** para el cálculo automático.

---

## Fórmulas para la hoja `ranking`

### Lógica de puntos
- **3 puntos** si el pronóstico del marcador exacto coincide con el resultado real
- **0 puntos** si no coincide o el partido no terminó

### Cómo ingresar las fórmulas

Para la **fila 2** (primer usuario). Copiar hacia abajo para cada fila nueva:

#### Columna C — `total_points`
```
=SUMPRODUCT(
  (predictions!A$2:A$5000=A2)*
  (predictions!C$2:C$5000=IFERROR(INDEX(matches!I$2:I$5000,MATCH(predictions!B$2:B$5000,matches!A$2:A$5000,0)),-999))*
  (predictions!D$2:D$5000=IFERROR(INDEX(matches!J$2:J$5000,MATCH(predictions!B$2:B$5000,matches!A$2:A$5000,0)),-999))*
  3
)
```

#### Columna D — `total_predictions`
```
=COUNTIF(predictions!A$2:A$5000, A2)
```

#### Columna E — `correct_predictions`
```
=SUMPRODUCT(
  (predictions!A$2:A$5000=A2)*
  (predictions!C$2:C$5000=IFERROR(INDEX(matches!I$2:I$5000,MATCH(predictions!B$2:B$5000,matches!A$2:A$5000,0)),-999))*
  (predictions!D$2:D$5000=IFERROR(INDEX(matches!J$2:J$5000,MATCH(predictions!B$2:B$5000,matches!A$2:A$5000,0)),-999))
)
```

> **Cómo funcionan:** comparan el email del usuario en el ranking con cada fila de `predictions`, luego buscan el marcador real en `matches` (via `MATCH`+`INDEX`) y comparan. El `-999` es un valor imposible que evita falsos positivos cuando el partido todavía no tiene resultado.

---

## Pasos de configuración

### 1. Google Cloud Console
1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un proyecto nuevo (ej. `fixture-mundial-2026`)
3. En **APIs y servicios** → **Biblioteca**, habilitar:
   - Google Sheets API
   - Google Drive API
4. Ir a **Credenciales** → **Crear credenciales** → **Cuenta de servicio**
5. Descargar el JSON de la cuenta de servicio

### 2. Google Sheets
1. Crear un Google Sheet nuevo
2. Copiar el **ID** del URL: `https://docs.google.com/spreadsheets/d/**{SHEET_ID}**/edit`
3. Compartir el Sheet con el **email de la cuenta de servicio** (`*@*.iam.gserviceaccount.com`) con rol **Editor**
4. Crear las tres hojas: `matches`, `predictions`, `ranking`
5. Escribir los encabezados (o usar `node scripts/seed-sheets.js`)
6. Ingresar las fórmulas de ranking en la hoja `ranking` (columnas C, D, E)

### 3. Firebase Console
1. Ir a [console.firebase.google.com](https://console.firebase.google.com)
2. Crear un proyecto (puede vincularse al mismo de Google Cloud)
3. **Authentication** → **Método de inicio de sesión** → Habilitar **Google**
4. **Configuración del proyecto** → **Aplicaciones web** → Registar app → copiar config
5. **Configuración del proyecto** → **Cuentas de servicio** → **Generar nueva clave privada** → Descargar JSON

### 4. Variables de entorno
#### Frontend (`frontend/.env`)
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
```

#### Vercel Dashboard (Serverless functions)
| Variable | Valor |
|---|---|
| `SHEET_ID` | ID del Google Sheet |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Contenido completo del JSON (minificado, en una sola línea) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Contenido completo del JSON de Firebase Admin (minificado) |
| `VITE_FIREBASE_API_KEY` | API Key de Firebase (también necesaria en build) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain de Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Project ID de Firebase |

> 💡 Para minificar el JSON en una línea: `cat service-account.json | python -c "import json,sys; print(json.dumps(json.load(sys.stdin)))"`

---

## Carga de datos de partidos

### Opción A: Script automático
```bash
# 1. Crear .env en la raíz con SHEET_ID y GOOGLE_SERVICE_ACCOUNT_JSON
# 2. Editar MATCHES en scripts/seed-sheets.js con los 104 partidos reales
node scripts/seed-sheets.js
```

### Opción B: Manual en Google Sheets
Completar la hoja `matches` con los datos de partidos del Mundial 2026 siguiendo el formato de columnas.

---

## Actualizar resultados de partidos
Cuando un partido termina, simplemente **editar la celda** del resultado real en la hoja `matches` (columnas I y J) y cambiar `status` a `finished`. Las fórmulas de la hoja `ranking` recalculan automáticamente.
