# Benchmarks

Last run in version 1.4.0 on 01/25/2018 @ 01:38:44

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
time                 5.873 ms   (5.643 ms .. 6.141 ms)
                     0.993 R²   (0.990 R² .. 0.998 R²)
mean                 6.425 ms   (6.299 ms .. 6.646 ms)
std dev              453.1 μs   (296.9 μs .. 760.0 μs)
variance introduced by outliers: 42% (moderately inflated)

benchmarking bench/npm run baseline
time                 361.5 ms   (348.8 ms .. 379.2 ms)
                     1.000 R²   (0.999 R² .. 1.000 R²)
mean                 357.8 ms   (352.8 ms .. 360.7 ms)
std dev              4.500 ms   (0.0 s .. 5.076 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp baseline
time                 114.5 ms   (111.9 ms .. 119.0 ms)
                     0.998 R²   (0.993 R² .. 1.000 R²)
mean                 115.0 ms   (112.7 ms .. 117.0 ms)
std dev              3.262 ms   (2.183 ms .. 5.057 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run serial:single
time                 737.6 ms   (687.6 ms .. 788.7 ms)
                     0.999 R²   (0.998 R² .. 1.000 R²)
mean                 732.1 ms   (722.0 ms .. 739.5 ms)
std dev              11.26 ms   (0.0 s .. 12.84 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:single
time                 113.0 ms   (111.4 ms .. 114.4 ms)
                     1.000 R²   (0.999 R² .. 1.000 R²)
mean                 116.2 ms   (115.2 ms .. 117.6 ms)
std dev              1.684 ms   (1.103 ms .. 2.143 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run serial:double
time                 1.251 s    (1.102 s .. 1.378 s)
                     0.998 R²   (0.994 R² .. 1.000 R²)
mean                 1.268 s    (1.249 s .. 1.284 s)
std dev              26.07 ms   (0.0 s .. 28.28 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:double
time                 122.3 ms   (119.7 ms .. 124.7 ms)
                     0.999 R²   (0.999 R² .. 1.000 R²)
mean                 126.7 ms   (124.8 ms .. 128.8 ms)
std dev              3.027 ms   (2.169 ms .. 3.758 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run serial:triple
time                 1.616 s    (1.605 s .. 1.638 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 1.611 s    (1.608 s .. 1.615 s)
std dev              4.143 ms   (272.4 as .. 4.436 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:triple
time                 131.4 ms   (128.8 ms .. 133.3 ms)
                     1.000 R²   (0.999 R² .. 1.000 R²)
mean                 136.1 ms   (134.2 ms .. 140.3 ms)
std dev              3.946 ms   (1.159 ms .. 5.986 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run serial:nested
time                 2.218 s    (2.178 s .. 2.291 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 2.254 s    (2.235 s .. 2.270 s)
std dev              24.10 ms   (0.0 s .. 26.79 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:nested
time                 118.9 ms   (114.8 ms .. 123.9 ms)
                     0.998 R²   (0.995 R² .. 1.000 R²)
mean                 119.5 ms   (117.8 ms .. 120.9 ms)
std dev              2.142 ms   (1.350 ms .. 2.920 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:single
time                 894.9 ms   (882.2 ms .. 921.1 ms)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 903.2 ms   (897.4 ms .. 907.7 ms)
std dev              6.951 ms   (0.0 s .. 7.805 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:single
time                 108.4 ms   (103.1 ms .. 111.2 ms)
                     0.998 R²   (0.994 R² .. 1.000 R²)
mean                 114.4 ms   (111.9 ms .. 116.8 ms)
std dev              3.879 ms   (2.989 ms .. 4.986 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:double
time                 908.3 ms   (880.4 ms .. 920.7 ms)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 909.8 ms   (905.3 ms .. 912.5 ms)
std dev              4.181 ms   (0.0 s .. 4.785 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:double
time                 117.4 ms   (113.8 ms .. 119.0 ms)
                     0.999 R²   (0.998 R² .. 1.000 R²)
mean                 119.6 ms   (118.1 ms .. 122.0 ms)
std dev              2.777 ms   (706.7 μs .. 4.499 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:triple
time                 976.2 ms   (943.8 ms .. 1.004 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 983.0 ms   (976.3 ms .. 988.5 ms)
std dev              8.489 ms   (0.0 s .. 9.386 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:triple
time                 122.7 ms   (117.9 ms .. 126.2 ms)
                     0.999 R²   (0.998 R² .. 1.000 R²)
mean                 125.4 ms   (123.8 ms .. 127.3 ms)
std dev              2.592 ms   (1.940 ms .. 3.475 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:nested
time                 2.886 s    (2.808 s .. 2.986 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 2.908 s    (2.893 s .. 2.922 s)
std dev              25.05 ms   (0.0 s .. 25.26 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:nested
time                 109.3 ms   (97.79 ms .. 120.3 ms)
                     0.993 R²   (0.990 R² .. 0.999 R²)
mean                 118.6 ms   (114.0 ms .. 122.0 ms)
std dev              5.705 ms   (4.080 ms .. 7.703 ms)
variance introduced by outliers: 11% (moderately inflated)
```
