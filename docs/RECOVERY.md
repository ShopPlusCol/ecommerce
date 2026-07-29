# RECOVERY

## SQLite / Node

Backup en caliente, verificado y con checksum:

```bash
npm run db:backup
```

Exportación lógica adicional:

```bash
npm run db:export
```

Restauración:

1. Activa mantenimiento y detén todas las instancias que escriben.
2. Conserva el archivo `.sqlite` y su `.sha256`.
3. Prueba primero en otro destino:

```bash
npm run db:restore -- --from .data/backups/<archivo>.sqlite \
  --to .data/restore-check.db --confirm RESTORE
```

4. Ejecuta `SQLITE_PATH=.data/restore-check.db npm run db:migrate` y el smoke.
5. Solo entonces restaura el destino real. El script exige que el destino esté
   dentro de `.data`, valida integridad/checksum y crea
   `*.before-restore-*.sqlite`.

Respalda por separado `public/uploads`; el JSON solo contiene sus metadatos.

## D1/R2

Antes de cada migración o release, usa el backup/time travel/export oficial de
D1 y registra el identificador. Exporta también el bucket R2 o habilita una
política de replicación/versionado adecuada. La restauración remota requiere
ventana de mantenimiento y autorización del propietario.

## Objetivos operativos iniciales

- RPO propuesto: 24 horas para pedidos y configuración.
- RTO propuesto: 4 horas.
- Retención propuesta: 7 copias diarias, 4 semanales y 6 mensuales.

Son objetivos operativos pendientes de aprobación, no garantías actuales.
Programa un ejercicio trimestral y registra tiempo, checksum y smoke.
