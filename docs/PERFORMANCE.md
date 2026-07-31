# PERFORMANCE

## Presupuesto

- Lighthouse móvil local: Performance ≥ 90 en inicio y producto.
- LCP objetivo staging ≤ 2,5 s; tolerancia local inicial ≤ 3,5 s.
- CLS ≤ 0,1; TBT ≤ 200 ms.
- Sin simulador/MediaPipe en primera carga.
- Imágenes reales optimizadas y sin video automático.

## Resultados 2026-07-29

| Ruta | Perf. | A11y | Best | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 92 | 100 | 100 | 100 | 1,0 s | 3,3 s | 70 ms | 0 |
| `/productos/amazon-brown` | 93 | 100 | 100 | 100 | 0,8 s | 3,2 s | 40 ms | 0 |

Medición real sobre `next start` local con Chrome headless y throttling de
Lighthouse. Los resultados de staging pueden cambiar por red/CDN/contenido.

`next build --experimental-analyze` generó estadísticas: primera carga sin
comprimir aproximada de 623 KB en inicio y 632 KB en producto. Los dos chunks
con MediaPipe no aparecen en `firstLoadChunkPaths` de producto.

## Comandos

```bash
npm run build -- --experimental-analyze
npm run test:lighthouse
```

Los JSON quedan en `test-results/` y no se versionan. Repite después de cargar
fotografías reales y en staging; si LCP supera 2,5 s, optimiza primero el activo
LCP y caché/CDN antes de añadir más JavaScript.
