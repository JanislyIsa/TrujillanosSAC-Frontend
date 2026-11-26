# Análisis de calidad del frontend

El análisis usa Vitest, el reporte LCOV y SonarScanner for NPM. La clave del proyecto está en `sonar-project.properties`; el token se mantiene solo en la variable de entorno de la terminal.

## Pruebas y cobertura

Desde la raíz del frontend:

```powershell
npm ci
npm run test:coverage
```

El informe visual se genera bajo `coverage/`; SonarQube lee `coverage/inventario/lcov.info`.

## Análisis

Con SonarQube iniciado según `backend/docs/calidad/README.md`, crea el token desde **My Account → Security → Generate Token** y asígnalo solo a la terminal de PowerShell:

```powershell
$env:SONAR_TOKEN = "TU_TOKEN_LOCAL"
npx @sonar/scan "-Dsonar.host.url=http://localhost:9000" "-Dsonar.token=$env:SONAR_TOKEN"
```

No incluyas el token en `sonar-project.properties`, comandos guardados, capturas o commits.
