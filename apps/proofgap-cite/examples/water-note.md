# Draft: Riverton's water crisis (synthetic example, all names fictional)

Working notes for an article. ProofGap Cite checks how independent the cited support really is.

## Claims
- Riverton's water budget rose 40% in 2026. [^pr] [^dp] [^mt] [^ag] [^nb] [^cv]
- Reservoir levels fell below 30% in August. [^gov] [^uni] [^tv]
- Officials knew about the shortfall in March. [^fo] [^wk]
- The new pipeline will cut water losses by half. [^op] [^pod]
- Two outlets confirmed the utility director's resignation. [^wa] [^wb]
- Water rates will not change in 2027.

```text
Example citation syntax (ignored by the parser because it is inside a code block): [^fake]
```

## References
[^pr]: Riverton City Hall press release "Budget 2026" {kind=primary, url=https://riverton.example/press/budget-2026, saved=pr-budget.txt}
[^dp]: Daily Planet "Water budget soars 40%" {kind=secondary, url=https://dailyplanet.example/water-budget, saved=dp-budget.txt, cites=pr}
[^mt]: Metro Times "City water spending up 40 percent" {kind=secondary, url=https://metrotimes.example/news/4471, cites=dp}
[^ag]: NewsHub aggregator summary {kind=secondary, url=https://newshub.example/a/88, saved=ag-summary.txt, cites=mt}
[^nb]: Neighborhood Bulletin blog "Our water bill" {kind=secondary, url=https://bulletin.example/2026/water, saved=nb-budget.txt}
[^cv]: Valley Courier "Riverton budget jump" {kind=secondary, url=https://valleycourier.example/riverton, cites=dp}
[^gov]: State Water Agency reservoir dataset, August 2026 {kind=primary, url=https://water.state.example/data/riverton-aug, saved=gov-reservoir.csv}
[^uni]: Riverton University gauge study {kind=primary, doi=10.5555/riverton.2026.17, saved=uni-gauges.txt}
[^tv]: Channel 9 evening report {kind=secondary, url=https://ch9.example/reservoir, cites=gov}
[^fo]: Community forum thread "They knew" {kind=secondary, url=https://forum.example/t/991, cites=wk}
[^wk]: Wiki-style page "Riverton water crisis" {kind=secondary, url=https://wiki.example/Riverton_water, cites=fo}
[^op]: Opinion column "The pipeline fix" {kind=secondary, url=https://dailyplanet.example/opinion/pipeline}
[^pod]: Local podcast episode 12 transcript {url=https://pod.example/ep12}
[^wa]: Wire service report "Utility director resigns" {kind=primary, url=https://wire.example/story/5521?utm_source=feed}
[^wb]: Wire service report, regional edition {kind=primary, url=https://www.wire.example/story/5521/}
