# Benchmarks

Last run in version 1.4.0 on 01/24/2018 @ 03:00:37

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

### npm scripts

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

## Results

benchmarking bench/echo hello world
time                 5.397 ms   (5.290 ms .. 5.517 ms)
                     0.998 R²   (0.997 R² .. 1.000 R²)
mean                 5.292 ms   (5.260 ms .. 5.332 ms)
std dev              114.8 μs   (90.49 μs .. 165.0 μs)

benchmarking bench/npm run baseline
time                 355.7 ms   (327.6 ms .. 379.8 ms)
                     0.999 R²   (0.997 R² .. 1.000 R²)
mean                 343.8 ms   (333.2 ms .. 349.2 ms)
std dev              9.191 ms   (0.0 s .. 9.399 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp baseline
time                 107.5 ms   (103.6 ms .. 111.4 ms)
                     0.997 R²   (0.993 R² .. 1.000 R²)
mean                 105.0 ms   (102.7 ms .. 107.4 ms)
std dev              3.712 ms   (2.430 ms .. 5.447 ms)

benchmarking bench/npm run serial:single
time                 676.6 ms   (622.6 ms .. NaN s)
                     0.999 R²   (0.998 R² .. 1.000 R²)
mean                 687.5 ms   (676.4 ms .. 693.4 ms)
std dev              9.675 ms   (0.0 s .. 10.36 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:single
time                 109.2 ms   (106.9 ms .. 112.0 ms)
                     0.999 R²   (0.996 R² .. 1.000 R²)
mean                 109.2 ms   (107.9 ms .. 110.8 ms)
std dev              2.184 ms   (1.559 ms .. 3.204 ms)

benchmarking bench/npm run serial:double
time                 1.150 s    (1.118 s .. 1.201 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 1.165 s    (1.152 s .. 1.173 s)
std dev              12.67 ms   (0.0 s .. 14.60 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:double
time                 123.4 ms   (118.5 ms .. 132.3 ms)
                     0.996 R²   (0.990 R² .. 1.000 R²)
mean                 117.4 ms   (114.5 ms .. 121.1 ms)
std dev              4.922 ms   (3.478 ms .. 6.506 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run serial:triple
time                 1.593 s    (1.550 s .. 1.643 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 1.541 s    (1.516 s .. 1.557 s)
std dev              24.89 ms   (0.0 s .. 28.74 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:triple
time                 131.3 ms   (125.1 ms .. 134.1 ms)
                     0.998 R²   (0.993 R² .. 1.000 R²)
mean                 133.4 ms   (130.5 ms .. 135.2 ms)
std dev              3.320 ms   (1.611 ms .. 5.030 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run serial:nested
time                 2.094 s    (1.916 s .. 2.268 s)
                     0.999 R²   (0.996 R² .. 1.000 R²)
mean                 2.179 s    (2.138 s .. 2.203 s)
std dev              37.54 ms   (0.0 s .. 42.89 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp serial:nested
time                 119.8 ms   (114.7 ms .. 126.6 ms)
                     0.997 R²   (0.992 R² .. 1.000 R²)
mean                 117.6 ms   (115.2 ms .. 119.9 ms)
std dev              3.485 ms   (2.340 ms .. 4.831 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:single
time                 850.1 ms   (824.0 ms .. NaN s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 854.5 ms   (848.2 ms .. 858.6 ms)
std dev              6.066 ms   (0.0 s .. 6.991 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:single
time                 109.2 ms   (104.5 ms .. 111.4 ms)
                     0.998 R²   (0.995 R² .. 1.000 R²)
mean                 115.5 ms   (112.7 ms .. 118.8 ms)
std dev              4.348 ms   (3.532 ms .. 5.219 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:double
time                 938.9 ms   (845.2 ms .. 1.012 s)
                     0.999 R²   (0.996 R² .. 1.000 R²)
mean                 923.6 ms   (898.4 ms .. 936.2 ms)
std dev              21.80 ms   (0.0 s .. 21.94 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:double
time                 116.9 ms   (111.9 ms .. 121.2 ms)
                     0.999 R²   (0.997 R² .. 1.000 R²)
mean                 123.9 ms   (121.2 ms .. 126.5 ms)
std dev              3.908 ms   (2.768 ms .. 5.501 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:triple
time                 1.014 s    (972.0 ms .. 1.065 s)
                     1.000 R²   (0.999 R² .. 1.000 R²)
mean                 1.014 s    (1.006 s .. 1.021 s)
std dev              10.05 ms   (0.0 s .. 11.37 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:triple
time                 125.9 ms   (122.1 ms .. 131.4 ms)
                     0.999 R²   (0.997 R² .. 1.000 R²)
mean                 129.7 ms   (127.7 ms .. 131.2 ms)
std dev              2.378 ms   (1.751 ms .. 3.216 ms)
variance introduced by outliers: 11% (moderately inflated)

benchmarking bench/npm run parallel:nested
time                 2.968 s    (2.936 s .. 2.994 s)
                     1.000 R²   (1.000 R² .. 1.000 R²)
mean                 2.937 s    (2.931 s .. 2.943 s)
std dev              9.477 ms   (544.7 as .. 9.983 ms)
variance introduced by outliers: 19% (moderately inflated)

benchmarking bench/npmp parallel:nested
time                 124.2 ms   (117.1 ms .. 135.2 ms)
                     0.992 R²   (0.973 R² .. 1.000 R²)
mean                 123.5 ms   (121.0 ms .. 128.1 ms)
std dev              4.771 ms   (2.654 ms .. 6.909 ms)
variance introduced by outliers: 11% (moderately inflated)
