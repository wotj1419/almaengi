# Frontend Performance Measurement Report

## Summary

This report tracks measured frontend performance results for Almaengi. The current dataset contains Mobile after measurements for the public routes `/`, `/login`, and `/signup`.

| Target | Main Metric | Before | After | Delta | Result |
| --- | --- | ---: | ---: | ---: | --- |
| chunk-splitting | Mobile Performance average | TBD | 63 | TBD | After measured |
| pwa-cache | Repeat visit transferred size | TBD | TBD | TBD | Pending |

## Chunk Splitting Result

### Mobile After Runs

| Page | Run 1 | Run 2 | Run 3 | Average |
| --- | ---: | ---: | ---: | ---: |
| `/` Performance | 61 | 63 | 61 | 62 |
| `/login` Performance | 67 | 68 | 67 | 67 |
| `/signup` Performance | 61 | 62 | 61 | 61 |

### Mobile After Average Metrics

| Page | Device | Performance | FCP | LCP | TBT | CLS | Speed Index | Total Bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | Mobile | 62 | 5.09s | 8.85s | 127ms | 0.000 | 5.09s | 3.09MiB |
| `/login` | Mobile | 67 | 5.08s | 5.23s | 91ms | 0.000 | 5.08s | 2.97MiB |
| `/signup` | Mobile | 61 | 5.08s | 23.41s | 105ms | 0.000 | 5.08s | 4.76MiB |

### Raw Files

```txt
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_landing_after_1.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_landing_after_2.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_landing_after_3.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_login_after_1.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_login_after_2.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_login_after_3.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_signup_after_1.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_signup_after_2.json
performance-reports/measurements/after/chunk-splitting/lighthouse_mobile_signup_after_3.json
```

## Interpretation

The current measurements are useful as the `after` Mobile baseline for public routes. `/login` is the strongest route in this set, with the lowest transfer size and the highest average Performance score.

The `/signup` route has a much higher LCP average than the other two pages. Lighthouse did not include a detailed LCP element audit in the saved JSON files, so this should be treated as a follow-up analysis item. Its total transferred bytes are also higher than the other measured routes.

## Limitations

The backend server from the original SSAFY deployment is not available, so this measurement intentionally excludes login-required API pages. The current comparison isolates frontend static asset loading, bundle behavior, and public route rendering on Vercel Preview.

Before/after comparison is not complete yet. The before commit must still be deployed under the same Vercel settings, including the same SPA rewrite behavior, before improvement percentages can be calculated.

## Next Steps

1. Deploy the chunk-splitting before commit with equivalent Vercel settings.
2. Measure the same public routes 3 times each on Mobile.
3. Add Desktop measurements for after and before if needed.
4. Calculate before/after deltas in this report.
