# Buried Object Detection Using Goodness-of-fit to Gumbel Distribution

**Ahmet B. Yoldemir and Mehmet Sezgin**

*TÜBİTAK Marmara Research Center, Information Technologies Research
Institute, PK: 21, 41470, Gebze, Kocaeli, Turkey*

**E-mail:** burak.yoldemir@bte.mam.gov.tr

In this study, we propose a novel model-based buried object detection
method using ground penetrating radar. The method is based on
statistical hypothesis testing, where the null distribution is Gumbel
distribution, which is also known as the extreme value type-1
distribution. An extensive analysis of this distribution is given in
\[1\]. The motivation of such a test is the difference in the histograms
of A-scans in the presence and absence of buried objects, as shown in
Fig. 1. In this figure, each curve corresponds to the mean histogram of
100 A-scans, in the presence and absence of a buried object,
respectively. It is clear that existence of an underground object causes
the histogram to skew from normal distribution. This skewed histogram
resembles a Gumbel distribution, which is governed by the following
probability density function:

## (1)

\[ f(x)=`\frac{1}{\sigma}`{=tex}`\exp`{=tex}(-z-`\exp`{=tex}(-z)) \]

where

\[ z=`\frac{x-\mu}{\sigma}`{=tex}, \]

(`\mu`{=tex}) and (`\sigma`{=tex}) being the mean and standard deviation
of the data set, respectively. A plot of this distribution is provided
in Fig. 2.

Due to the change in the histogram of the signals, one can decide on the
existence of a buried object in the inspected region, if a Gumbel
distribution can be successfully fitted to the histogram of the A-scan
received at that point.

To measure the goodness-of-fit to Gumbel distribution, we use the
following test statistic, which is also used in many renowned hypothesis
tests, such as Kolmogorov-Smirnov test and Lilliefors test:

## (2)

\[
`\xi`{=tex}=`\max`{=tex}\_x`\left`{=tex}\|`\widehat{CDF}`{=tex}(x)-CDF(x)`\right`{=tex}\|
\]

where (`\widehat{CDF}`{=tex}(x)) is the empirical estimate of the
cumulative distribution function (CDF) of the input vector, (CDF(x)) is
the CDF of an extreme value type-1 distribution with the same location
and scale parameters as the input vector, and (`\xi`{=tex}) is the test
statistic.

A low value of this test statistic indicates a good fit to Gumbel
distribution. A typical plot of the test statistic is given in Fig. 3,
where the smallest value of the test statistic corresponds to the buried
object location.

This test statistic is normalized, which allows us to decide on the
existence of an underground object using a single threshold value. In
short, we reduce the detection problem into a binary hypothesis test,
where the aforementioned test statistic is compared to a constant
threshold.

The proposed method is tested on a real terrain. The terrain includes a
total of 346 metallic and nonmetallic disks (AP and AT mine equivalents
and clutter), diameters of which range from 90 mm to 330 mm and heights
of which range from 40 mm to 120 mm. The burial depth of the objects
varies from 7 cm to 30 cm.

In total, we reach a detection rate of **94.3%** with a false alarm rate
of only **0.9%**. This algorithm works very fast, which makes it
convenient for practical applications. As the tests were carried out on
real terrain, given detection and false alarm rates are expected to hold
in real-time applications.

------------------------------------------------------------------------

## Figure 1: Histograms of A-scans

The figure shows two histograms:

-   **No buried object**
-   **Buried object present**

The horizontal axis is **Bins** (0--50), and the vertical axis is
**Frequency**. The histograms illustrate the change in the A-scan signal
distribution when a buried object is present.

------------------------------------------------------------------------

## Figure 2: Gumbel Distribution

The figure plots the Gumbel probability density function (f(x)).

-   Horizontal axis: (x), approximately from (-4) to (6)
-   Vertical axis: (f(x)), approximately from (0) to (0.4)

The curve illustrates the characteristic skewed shape of the Gumbel
distribution.

------------------------------------------------------------------------

## Figure 3: Test Statistic

The figure shows the test statistic as a function of coordinate index.

-   Horizontal axis: **Coordinate index**, approximately 0--250
-   Vertical axis: **Test statistic**, approximately 0.20--0.34

The smallest value of the test statistic occurs around the buried-object
location, illustrating how the proposed goodness-of-fit statistic can be
used to locate buried objects.

------------------------------------------------------------------------

# References

**\[1\]** Rolf-Dieter Reiss and Michael Thomas. *Statistical analysis of
extreme values*. Birkhauser Verlag, Basel, Switzerland, 1997.
