# Benchmarks

Last run in version 1.5.0 on 01/25/2018 @ 02:39:39

## Table of Contents

* [Specs of the runner](#specs-of-the-runner)
* [What was run](#what-was-run)
  * [npm-preset scripts](#npm-preset-scripts)
  * [npm scripts](#npm-scripts)
* [Results](#results)

## Specs of the runner

* Arch: x64
* Platform: darwin
* Memory: 17179869184 bytes
* CPU Info:
  * 1 Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz - 2200
  * 2 Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz - 2200
  * 3 Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz - 2200
  * 4 Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz - 2200
  * 5 Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz - 2200
  * 6 Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz - 2200
  * 7 Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz - 2200
  * 8 Intel(R) Core(TM) i7-4770HQ CPU @ 2.20GHz - 2200

## What was run

### npm-preset scripts

```json
{
  "baseline": "echo hello world",
  "serial:single": "npmp baseline",
  "serial:double": "npmp baseline baseline",
  "serial:triple": "npmp baseline baseline baseline",
  "serial:nested": "npmp serial:nested1",
  "serial:nested1": "npmp serial:nested2",
  "serial:nested2": "npmp serial:nested3",
  "serial:nested3": "npmp serial:nested4",
  "serial:nested4": "npmp baseline",
  "parallel:single": "npmp -p baseline",
  "parallel:double": "npmp -p baseline baseline",
  "parallel:triple": "npmp -p baseline baseline baseline",
  "parallel:nested": "npmp -p parallel:nested1",
  "parallel:nested1": "npmp -p parallel:nested2",
  "parallel:nested2": "npmp -p parallel:nested3",
  "parallel:nested3": "npmp -p parallel:nested4",
  "parallel:nested4": "npmp -p baseline"
}
```

### npm scripts

```json
{
  "baseline": "echo hello world",
  "serial:single": "npm run baseline",
  "serial:double": "npm-run-all baseline baseline",
  "serial:triple": "npm-run-all baseline baseline baseline",
  "serial:nested": "npm run serial:nested1",
  "serial:nested1": "npm run serial:nested2",
  "serial:nested2": "npm run serial:nested3",
  "serial:nested3": "npm run serial:nested4",
  "serial:nested4": "npm run baseline",
  "parallel:single": "npm-run-all -p baseline",
  "parallel:double": "npm-run-all -p baseline baseline",
  "parallel:triple": "npm-run-all -p baseline baseline baseline",
  "parallel:nested": "npm-run-all -p parallel:nested1",
  "parallel:nested1": "npm-run-all -p parallel:nested2",
  "parallel:nested2": "npm-run-all -p parallel:nested3",
  "parallel:nested3": "npm-run-all -p parallel:nested4",
  "parallel:nested4": "npm-run-all -p baseline"
}
```

## Results

```sh
benchmarking bench/echo hello world
time                 5.468 ms   (5.416 ms .. 5.516 ms)
                     0.999 R²   (0.999 R² .. 1.000 R²)
mean                 5.463 ms   (5.434 ms .. 5.505 ms)
std dev              106.5 μs   (77.47 μs .. 162.5 μs)

benchmarking bench/npm run baseline
time                 329.8 ms   (325.4 ms .. 336.4 ms)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 327.4 ms   (325.6 ms .. 329.2 ms)
std dev              2.281 ms   (1.059 ms .. 2.898 ms)
variance introduced by outliers: 16% (moderately inflated)

benchmarking bench/npmp baseline
time                 106.9 ms   (104.2 ms .. 109.2 ms)
                     0.999 R²   (0.997 R² .. 1.000 R²)
mean                 106.1 ms   (105.2 ms .. 107.4 ms)
std dev              1.669 ms   (1.158 ms .. 2.208 ms)

benchmarking bench/npm run serial:single
time                 695.3 ms   (655.9 ms .. 767.3 ms)
                     0.999 R²   (0.998 R² .. 1.000 R²)
mean                 670.3 ms   (658.9 ms .. 689.0 ms)
std dev              16.34 ms   (0.0 s .. 17.37 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:single
time                 110.5 ms   (106.1 ms .. 116.4 ms)
                     0.997 R²   (0.992 R² .. 1.000 R²)
mean                 109.4 ms   (107.1 ms .. 111.1 ms)
std dev              3.162 ms   (2.390 ms .. 4.211 ms)

benchmarking bench/npm run serial:double
time                 1.221 s    (1.180 s .. 1.257 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 1.187 s    (1.165 s .. 1.199 s)
std dev              19.08 ms   (0.0 s .. 20.25 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:double
time                 120.5 ms   (115.9 ms .. 125.0 ms)
                     0.999 R²   (0.997 R² .. 1.000 R²)
mean                 122.5 ms   (120.4 ms .. 125.0 ms)
std dev              3.353 ms   (2.543 ms .. 4.196 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run serial:triple
time                 1.566 s    (NaN s .. 1.602 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 1.554 s    (1.539 s .. 1.562 s)
std dev              12.83 ms   (0.0 s .. 13.54 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:triple
time                 131.4 ms   (127.9 ms .. 133.0 ms)
                     0.999 R²   (0.998 R² .. 1.000 R²)
mean                 132.6 ms   (131.1 ms .. 134.1 ms)
std dev              2.129 ms   (1.412 ms .. 3.146 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run serial:nested
time                 2.117 s    (2.046 s .. 2.156 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 2.103 s    (2.095 s .. 2.115 s)
std dev              10.99 ms   (0.0 s .. 11.72 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:nested
time                 115.9 ms   (112.7 ms .. 118.9 ms)
                     0.999 R²   (0.999 R² .. 1.000 R²)
mean                 116.4 ms   (115.1 ms .. 117.6 ms)
std dev              1.874 ms   (1.235 ms .. 2.537 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:single
time                 863.7 ms   (810.1 ms .. 893.4 ms)
                     1.000 R²   (0.999 R² .. 1.000 R²)
mean                 869.6 ms   (860.9 ms .. 875.2 ms)
std dev              8.479 ms   (0.0 s .. 9.780 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:single
time                 111.7 ms   (109.7 ms .. 114.3 ms)
                     0.999 R²   (0.998 R² .. 1.000 R²)
mean                 113.7 ms   (112.4 ms .. 114.9 ms)
std dev              1.867 ms   (1.359 ms .. 2.309 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:double
time                 921.3 ms   (897.5 ms .. 936.7 ms)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 919.0 ms   (916.7 ms .. 923.4 ms)
std dev              3.788 ms   (0.0 s .. 3.846 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:double
time                 119.9 ms   (117.5 ms .. 121.4 ms)
                     1.000 R²   (0.999 R² .. 1.000 R²)
mean                 120.7 ms   (119.6 ms .. 121.2 ms)
std dev              1.154 ms   (782.9 μs .. 1.604 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:triple
time                 989.9 ms   (894.5 ms .. 1.046 s)
                     0.999 R²   (0.997 R² .. 1.000 R²)
mean                 1.011 s    (992.6 ms .. 1.022 s)
std dev              16.71 ms   (0.0 s .. 18.89 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:triple
time                 121.5 ms   (114.0 ms .. 130.1 ms)
                     0.997 R²   (0.994 R² .. 1.000 R²)
mean                 129.3 ms   (126.3 ms .. 132.6 ms)
std dev              4.867 ms   (3.733 ms .. 6.093 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:nested
time                 2.923 s    (2.840 s .. 2.978 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 2.923 s    (2.914 s .. 2.931 s)
std dev              13.04 ms   (0.0 s .. 14.16 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:nested
time                 107.4 ms   (94.64 ms .. 113.1 ms)
                     0.990 R²   (0.970 R² .. 1.000 R²)
mean                 119.0 ms   (113.8 ms .. 127.4 ms)
std dev              9.962 ms   (4.545 ms .. 14.29 ms)
variance introduced by outliers: 23% (moderately inflated)
```
