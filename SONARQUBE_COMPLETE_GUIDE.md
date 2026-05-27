# 📊 SonarQube - Guía Completa de Instalación y Uso

## 📋 Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Rápida](#instalación-rápida)
3. [Instalación Manual Paso a Paso](#instalación-manual-paso-a-paso)
4. [Configuración Inicial](#configuración-inicial)
5. [Ejecutar Análisis](#ejecutar-análisis)
6. [Interpretar Resultados](#interpretar-resultados)
7. [Comandos Útiles](#comandos-útiles)
8. [Solución de Problemas](#solución-de-problemas)

---

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Docker Desktop** (incluye Docker Engine y Docker Compose)
  - [Descargar para Windows](https://www.docker.com/products/docker-desktop)
  - [Descargar para Mac](https://www.docker.com/products/docker-desktop)
  - [Descargar para Linux](https://docs.docker.com/engine/install/)

- **Node.js 18+** (debe estar en tu PATH)
  - [Descargar Node.js](https://nodejs.org/en/download/)

- **npm 9+** (incluido con Node.js)

### Verificar instalación:
```bash
docker --version
docker-compose --version
node --version
npm --version
```

---

## 🚀 Instalación Rápida

### En Windows (PowerShell):
```powershell
# Abrir PowerShell en la carpeta RutaSegura_Backend

# Opción 1: Automático con interfaz interactiva
.\setup-sonarqube.ps1 -Interactive

# Opción 2: Con token conocido
.\setup-sonarqube.ps1 -Token "sqa_tu_token_aqui"
```

### En Linux/Mac (Terminal):
```bash
# Navega a la carpeta RutaSegura_Backend

# Hacer el script ejecutable
chmod +x setup-sonarqube.sh

# Opción 1: Automático con interfaz interactiva
./setup-sonarqube.sh --interactive

# Opción 2: Con token conocido
./setup-sonarqube.sh --token "sqa_tu_token_aqui"
```

---

## 📝 Instalación Manual Paso a Paso

### Paso 1: Iniciar Servicios de Docker

```bash
# En la carpeta RutaSegura_Backend

docker-compose -f docker-compose.sonarqube.yml up -d
```

Esto inicia:
- **SonarQube**: en http://localhost:9000
- **PostgreSQL**: en localhost:5433 (puerto interno: 5432)

Verificar que está listo:
```bash
docker ps --filter "name=rutasegura"
```

Deberías ver algo como:
```
CONTAINER ID   IMAGE                    NAMES                    STATUS
xxx            sonarqube:10.5-community rutasegura-sonarqube     Up 2 minutes (healthy)
yyy            postgres:16-alpine       rutasegura-sonarqube-db  Up 3 minutes (healthy)
```

---

### Paso 2: Acceder a SonarQube

1. Abre tu navegador en: http://localhost:9000

2. Inicia sesión con credenciales por defecto:
   - **Usuario**: `admin`
   - **Contraseña**: `admin`

3. Se te pedirá cambiar la contraseña (elige una segura)

---

### Paso 3: Crear un Proyecto

1. En la página de bienvenida, haz clic en "Create a local project"

2. Completa el formulario:
   - **Project display name**: `RutaSegura Backend`
   - **Project key**: `rutasegura-backend`
   - **Main branch name**: `main`

3. Haz clic en "Next"

4. Selecciona "Use the global setting" para la definición de código nuevo

5. Haz clic en "Create project"

---

### Paso 4: Generar Token de Autenticación

1. Haz clic en tu perfil (esquina superior derecha) → "My Account"

2. Ve a la pestaña "Security"

3. En "Generate Tokens":
   - **Name**: `backend-analyzer`
   - **Type**: `Global Analysis Token`
   - **Expires in**: `30 days`

4. Haz clic en "Generate"

5. **⚠️ IMPORTANTE**: Copia el token (aparece una sola vez)
   - Ejemplo: `sqa_f286b6a99978e2f78fd7993744d380e500f673d6`

---

### Paso 5: Guardar Credenciales Locales

1. En la carpeta `RutaSegura_Backend`, copia `.env.sonarqube.example` a `.sonarqube-env`:

```bash
# Windows (PowerShell):
Copy-Item .env.sonarqube.example .sonarqube-env

# Linux/Mac:
cp .env.sonarqube.example .sonarqube-env
```

2. Edita `.sonarqube-env` y reemplaza:
```properties
SONAR_HOST_URL=http://localhost:9000
SONAR_LOGIN=sqa_tu_token_aqui
```

3. **⚠️ IMPORTANTE**: Este archivo NO debe subirse a Git (ya está en `.gitignore`)

---

### Paso 6: Ejecutar Análisis

```bash
# Desde la carpeta RutaSegura_Backend

# Ejecutar tests + análisis
npm run sonar:analyze

# O por separado:
npm run test:cov      # Solo tests con cobertura
npm run sonar         # Solo análisis de SonarQube
```

**Primera ejecución**: puede tardar 1-2 minutos

---

### Paso 7: Ver Resultados

1. Abre: http://localhost:9000/dashboard?id=rutasegura-backend

2. Verás métricas como:
   - **Coverage**: % de código cubierto por tests
   - **Duplications**: % de código duplicado
   - **Issues**: Bugs, Code Smells, Vulnerabilities
   - **Quality Gate**: Cumplimiento de criterios de calidad

---

## ⚙️ Configuración Inicial

### Archivos de Configuración

- **sonar-project.properties**: Propiedades del proyecto (NO editar)
- **.sonarqube-env**: Credenciales locales (gitignore, local only)
- **.env.sonarqube.example**: Plantilla de credenciales
- **docker-compose.sonarqube.yml**: Configuración de Docker

---

## 🔍 Ejecutar Análisis

### Con Credenciales en Archivo
```bash
npm run sonar:analyze
```

### Con Credenciales Directas
```bash
# Windows (PowerShell):
$env:SONAR_TOKEN="sqa_tu_token"
npx sonar-scanner -D sonar.token=$env:SONAR_TOKEN

# Linux/Mac:
export SONAR_TOKEN="sqa_tu_token"
npx sonar-scanner -D sonar.token=$SONAR_TOKEN
```

### Análisis Solo de Nuevos Cambios
```bash
npm run sonar:analyze -- -Dsonar.projectVersion=2.0
```

---

## 📊 Interpretar Resultados

### Métricas Principales

| Métrica | Qué Mide | Objetivo |
|---------|----------|----------|
| **Coverage** | % de código cubierto por tests | > 70% |
| **Duplications** | % de código duplicado | < 10% |
| **Code Smells** | Problemas de mantenibilidad | Mínimo |
| **Bugs** | Posibles errores | 0 |
| **Vulnerabilities** | Riesgos de seguridad | 0 |

### Quality Gate
- ✅ **Passed**: El proyecto cumple criterios de calidad
- ⚠️ **Warning**: Algunos problemas a revisar
- ❌ **Failed**: No cumple mínimos

---

## 🛠️ Comandos Útiles

### Docker
```bash
# Iniciar SonarQube
docker-compose -f docker-compose.sonarqube.yml up -d

# Detener SonarQube
docker-compose -f docker-compose.sonarqube.yml down

# Ver logs
docker-compose -f docker-compose.sonarqube.yml logs -f sonarqube

# Ver logs de la BD
docker-compose -f docker-compose.sonarqube.yml logs -f sonarqube-db

# Reiniciar servicios
docker-compose -f docker-compose.sonarqube.yml restart

# Eliminar volúmenes (CUIDADO: borra datos)
docker-compose -f docker-compose.sonarqube.yml down -v
```

### npm
```bash
# Verificar setup completo
npm run verify:sonar

# Solo tests
npm run test

# Tests con cobertura
npm run test:cov

# Solo análisis
npm run sonar

# Tests + Análisis
npm run sonar:analyze
```

---

## 🆘 Solución de Problemas

### SonarQube no inicia
```bash
# Verificar que Docker está corriendo
docker ps

# Ver logs de error
docker-compose -f docker-compose.sonarqube.yml logs sonarqube

# Reiniciar
docker-compose -f docker-compose.sonarqube.yml restart
```

### Error: "Not authorized"
```
ERROR: Not authorized. Analyzing this project requires authentication.
```

**Solución**:
1. Verifica que tu token es válido en `.sonarqube-env`
2. El token debe empezar con `sqa_`
3. Regenera el token si no está seguro

### Error: "Node.js executable file does not exist"
**Solución**: 
1. Elimina la línea `sonar.nodejs.executable=node` de `sonar-project.properties`
2. SonarQube usará su Node.js integrado

### Puerto 9000 ya está en uso
```bash
# Buscar qué proceso usa el puerto
# Windows:
netstat -ano | findstr :9000

# Linux/Mac:
lsof -i :9000

# Cambiar puerto en docker-compose.sonarqube.yml:
# De: "9000:9000"
# A:  "9001:9000"  (acceder en http://localhost:9001)
```

### Base de datos corrupta
```bash
# Eliminar volúmenes y reiniciar (⚠️ borra datos)
docker-compose -f docker-compose.sonarqube.yml down -v
docker-compose -f docker-compose.sonarqube.yml up -d
```

---

## 📚 Recursos Adicionales

- [Documentación SonarQube](https://docs.sonarsource.com/sonarqube/10.5/)
- [SonarScanner para CLI](https://docs.sonarsource.com/sonarqube/10.5/analyzing-source-code/scanners/sonarscanner/)
- [Análisis de Coverage](https://docs.sonarsource.com/sonarqube/10.5/analyzing-source-code/test-coverage/)
- [Quality Gates](https://docs.sonarsource.com/sonarqube/10.5/user-guide/quality-gates/)

---

## 🎯 Próximos Pasos

1. **Integración CI/CD**: Configurar GitHub Actions, GitLab CI, etc.
2. **Custom Rules**: Crear reglas personalizadas para tu equipo
3. **Branch Analysis**: Analizar diferentes ramas (main, develop, etc.)
4. **Notifications**: Configurar alertas en Slack, Teams, etc.
5. **Project Permissions**: Controlar acceso al proyecto

---

## ⚠️ Notas Importantes

- **Credenciales**: Nunca subas `.sonarqube-env` a Git
- **Tokens**: Regenera si se comprometen
- **Espacio en disco**: SonarQube puede usar 2-5GB dependiendo del análisis
- **Memoria RAM**: Requiere al menos 2GB disponible
- **Primera ejecución**: Toma más tiempo, las siguientes son más rápidas

---

**¡Hecho! Ahora puedes analizar tu código con SonarQube. 🎉**

Cualquier duda, revisa los logs o consulta la documentación oficial.
