# Extreme Value Analysis - Part 1 Fundamentals for MechanicalIntegrity Applications


---
## Page 1

Extreme Value Analysis
Part 1: Fundamentals for Mechanical Integrity 
Applications
Featured Article
VOLUME 32, ISSUE 2
MARCH | APRIL 2026
ASS E T  I N T E G R I T Y  I N T E L L I G E N C E
W. David Wang, Ph.D., P.E., Founder and Principal Consultant at Asset Integrity Global LLC


### Embedded Images OCR


---
## Page 2

2      Inspectioneering Journal     MARCH | APRIL 2026
Introduction
A persistent challenge in assuring mechanical integrity is that 
inspection data rarely capture the true minimum remaining wall 
thickness. The traditional practice of selecting the lowest measured 
value from an inspection dataset is fundamentally inadequate; sta-
tistically, the observed minimum is almost always greater than the 
true minimum. This discrepancy creates uncertainty in equipment 
life assessment when making run/repair/replace decisions.
The inability to find the true minimum wall thickness can be mit-
igated by increasing the inspection scope: greater coverage makes 
it more likely that the true minimum will be found. However, this 
brute force approach leads to increased cleaning and inspection 
costs, higher resource demands, and potentially longer equipment 
downtime and associated loss of production.
Statistical extreme value analysis (EVA) offers an alternative way 
to overcome the challenge. Instead of relying solely on raw min-
ima, EVA statistically models the behavior of extreme values within 
defined populations. This enables a conservative estimation of the 
lowest values, accompanied by explicit confidence bounds. These 
estimated values provide a defensible basis to assure mechan-
ical integrity without resorting to the brute force of increased 
inspection scope. 
This article is the first in a three-part series on EVA, focusing on 
the statistical, practical, and engineering foundations of EVA for all 
mechanical integrity applications. Part 2 will present detailed appli-
cations of EVA on heat exchanger tube inspections, and Part 3 will 
cover EVA applications on inspections of piping, pressure vessels, 
and aboveground storage tanks. 
Why EVA is Needed and How Populations are 
Defined 
Inspection programs have traditionally used measured minima 
as the lowest thickness values for mechanical integrity assess-
ments of inspected equipment. This approach suffers from three 
major limitations:
1. The measured minimum is sample-dependent and is almost 
always non-conservative and non-representative of the true 
minimum.
2. The result becomes increasingly non-conservative as inspection 
coverage decreases.
3. To reduce this non-conservatism, inspection coverage must 
be increased; however, this also increases execution costs and 
logistical difficulties.
With the traditional approach, organizations often face the 
dilemma of having to balance equipment reliability and execution 
cost. This is considered linear thinking, and attempting to find a 
perfect balance is often an impossible task, as any move becomes 
a compromise that fails to fully achieve either objective. As illus-
trated in Figure 1, one must break away from the linear thinking to 
have a real chance of achieving both objectives (i.e., high reliability 
and low cost). 
EVA resolves those limitations by treating minimum thickness 
values as a statistical distribution governed by extreme value 
behavior. The effectiveness of the analysis is affected by how the 
population is defined and treated. Ideally, a population should 
Extreme Value Analysis
Part 1: Fundamentals for Mechanical Integrity 
Applications
W. David Wang, Ph.D., P.E., Founder and Principal Consultant at Asset Integrity Global LLC
Figure 1. The reliability-cost dilemma.


### Embedded Images OCR


#### Image 1

Reliability

U(

9 Cost

e Need to get out of the
linear thinking and find
a different way of doing
things to succeed
Trying to find the sweet spot High . ( Ci
but never succeed? Reliability “NG za
¢

Low Cost


---
## Page 3

MARCH | ARPIL 2026   Inspectioneering Journal      3 
consist of units of the same design, subjected to the same or 
similar environments, and thus affected by the same degradation 
mechanisms. For example:
• An entire tube bundle may be treated as one population. If 
different passes of the tube bundle are subjected to distinctly 
different degradation mechanisms, each pass may be treated as a 
population.  
• A piping system may be treated as several populations, with  
each population covering a corrosion loop or circuit. Primary  
piping, deadlegs, and injection points should be treated as  
different populations.   
•. Similarly, pressure vessels may be divided by shell courses, 
heads, and nozzles, etc., as separate populations.   
Mixing populations subjected to distinctly different damage mech-
anisms will likely lead to a thickness data distribution that cannot 
fit any mathematical model. Separating them allows cleaner, more 
effective treatment of each population for EVA prediction. 
In addition, dividing a large population into smaller groups reduces 
the extrapolation required, thereby reducing the errors in EVA esti-
mates caused by this extrapolation. Further discussion on this 
point is provided in the following sections. 
Unit Minimum Method and NDE 
Requirements 
As noted previously, EVA is based on inspecting a sample of units 
within the population and using the measured minima (one from 
each inspected unit) to estimate the most likely lowest value of 
the population. For application on heat exchanger tube bundle 
inspection, a tube is normally treated as a single unit. For piping 
applications, a single unit may be a unit length of piping (e.g., a 1 
ft long section, a one-diameter length, or other lengths appropri-
ate for the analysis). Similarly, for pressure vessel and tank bot-
tom inspection applications, a unit may be a unit area, such as a 
1 ft by 1 ft area on a pressure vessel or tank bottom. Use of these 
measured minima within the sample set for EVA is termed the unit 
minimum method. This method aligns naturally with inspection 
procedures and serves as the cornerstone of EVA for mechanical 
integrity applications. 
Choosing suitable NDE methods is essential for determining the 
minimum thickness value within each inspected unit. EVA requires 
accurate, quantitative wall thickness measurements. Ultrasonic 
testing (UT) is best suited for this purpose. Using heat exchanger 
tube inspection as an example, the internal rotary inspection sys-
tem (IRIS) is ideal for measuring tube thickness with high accu-
racy and is thus the tool of choice for EVA on heat exchanger tube 
inspection data. Other NDE methods, such as remote field eddy 
current, magnetic flux leakage, saturation eddy current, and even 
conventional eddy current, rely on comparing signal responses to 
calibration standards rather than measuring true thickness. Data 
from these other techniques tend to be clustered and have lower 
accuracy, making them unsuitable for EVA. Just like the principle 
of "garbage in, garbage out" applies, EVA cannot fix inaccuracies 
in the input data. Similarly, for EVA applications on inspection of 
piping, pressure vessels, or tank bottoms, UT scanning should be 
performed to get the minimum thickness value from each unit 
in the sample set, and the measured minimum values from the 
inspected units used as input data to EVA.  
Statistical Foundation and Confidence 
Intervals 
There are three basic steps in extreme value analysis:
1. Assume:
	 a.) the population follows a certain data distribution, and
	 b.) the data distribution of the population is the same as the data 
distribution of the sample.
2. Determine the data distribution of the sample.
3. Extrapolate, using the distribution determined from the sample 
data, to estimate the lowest thickness value of the population.
Gumbel distribution, a double exponential distribution, has been 
widely used and accepted for corrosion-related applications. There 
are other distributions that can be used (e.g., Weibull and general-
ized extreme value (GEV) distributions). However, in the author's 
experience, the Gumbel distribution yields better results than the 
others for mechanical integrity assessment, in terms of provid-
ing sufficiently conservative but not overly conservative results. 
Hence, in the following discussions, the focus will be placed on use 
of the Gumbel distribution.   
The mathematical model using the Gumbel distribution to calcu-
late the extreme values is described in detail in a paper presented 
at the 2006 ASME Pressure Vessels and Piping Conference [1]. The 
essential information is provided below. 
Gumbel distribution has two parameters defining the data distri-
bution: a location parameter λ and a scale parameter δ. The distri-
bution can be expressed in terms of a probability density function 
f(x) and a cumulative distribution function F(x), as defined by 
Equations 1 and 2, respectively. 
The two functions are also presented graphically in Figure 2. 
…where x is the minimum thickness of any unit in the population. 
In the case of n units inspected, there are n minimum values, 
one from each inspected unit. With the n number of x values and 
using the Maximum Likelihood Method, the location and scale 
parameters, λ and δ, can be calculated and thus the sample data 
distribution determined, which also determines the population 
data distribution, since it is assumed to be the same as the sample 
data distribution. 
For a population that has a total of N units, the extreme value of the 
population can then be calculated by using Equation 3:


### Embedded Images OCR


#### Image 1

x-A.

xa

F(x) = 5: exp (

oe exp (— exp exp (

6

))

Eq. 1


#### Image 2

F(x) = exp (— exp exp (-**))

Eq. 2


#### Image 3

Eq. 3


---
## Page 4

4      Inspectioneering Journal     MARCH | APRIL 2026
Note that the above steps only provide the best estimated extreme 
value of the population, but they have not quantified uncertain-
ties in the estimated value. The uncertainties can be quantified by 
using confidence intervals (e.g., at 80%, 90%, 95%, and 99% confi-
dence levels). While the interval at each confidence level has its 
upper-bound and lower-bound values, for inspection applications 
where mechanical integrity must be assured, the lower-bound 
value must be used. 
EVA confidence interval, C(x), can be calculated by using 
Equation 4.
…where t is the Student’s t-test value and S(x) is the standard error 
based on the maximum likelihood method [1]. 
The standard error is inversely proportional to the square root of 
the sample size, √n. The Student’s t-test value is governed by the 
sample size and the selected confidence level, as shown in Figure 
3, where the t-test value is plotted as a function of sample size, n, 
at 80%, 90%, 95%, and 99% confidence levels. As shown, the t-test 
value decreases sharply with the increase of sample size, but the 
decrease then tapers off quickly; further decrease is relatively insig-
nificant as the sample size goes above 30. Since both the standard 
error and the t-test value decrease with the sample size, so does the 
confidence interval. The reduction of the confidence interval with 
an increase in the sample size is an important point to recognize. 
Its implications on mechanical integrity applications are further 
discussed in the sample size section below.
Figure 3. Student’s t-test value as a function of sample size at 80%, 90%, 95%, 
and 99% confidence levels. 
It is also important to recognize that the assumption that the pop-
ulation and sample data distribution follow the Gumbel double 
exponential distribution is just that: an assumption. The real popu-
lation data distribution may have a longer tail than modeled by the 
Gumbel distribution, and in such a case, EVA may give non-conser-
vative results [1]. This issue can be addressed by proper selection of 
the sample size and use of the lower-bound value of the confidence 
interval as the minimum value of the population for mechanical 
integrity assessment, as further discussed below.
Sample Size 
A common question regarding the use of EVA is What is the best 
sample size? Intuitively, especially for those accustomed to using 
the measured minimum without EVA, it may seem that a larger 
sample size leads to a more accurate result and better mechanical 
integrity assurance. This, however, is not always true, as demon-
strated with real inspection data [1].
There are two primary considerations for choosing a sample size: 
1. The sample size should be large enough to include sufficient 
units to adequately represent the population.
2. Conversely, a large sample size defeats the purpose of using EVA 
to reduce the inspection scope. Furthermore, as the sample size 
increases, the confidence interval reduces, making the low-
er-bound value less conservative. This can lead to a non-conser-
vative result when the population data distribution has a longer 
tail than that of the Gumbel double exponential distribution [1].
For the first consideration, a good rule of thumb is to sample 5% of 
the population. The sampled units should be distributed evenly and 
sufficiently to adequately represent the population, and no bias 
should be introduced in the sampling. That is, do not simply select 
Figure 2. Gumbel probability density function and cumulative 
distribution function.


### Embedded Images OCR


#### Image 1

C(x) = +t+S(x)

Eq. 4


#### Image 3

Probability Density Function

x-

A x-Aa
3 Pano)

f(x)= = -exp(-


#### Image 4

Cumulative Distribution Function

x

F(x)=exp(-exp(-“—4y)


---
## Page 5

MARCH | ARPIL 2026   Inspectioneering Journal      5 
units from the perceived worst locations. If there are locations 
known to be worse than others, they can be treated as separate pop-
ulations, rather than used as the preferred locations for sampling to 
present a larger population. Using the latter approach may actually 
cause non-conservatism, since tightly clustered values in a sample 
lead to a tight confidence interval and, consequently, a less conser-
vative lower-bound value.
For the second consideration, sample size is not just about the 
percentage of the population. It is also about the absolute number 
of units in the sample. This is because the confidence interval is 
a function of the sample size, n, as discussed in the previous sec-
tion. Since the confidence interval shrinks significantly with the 
increase of sample size, a very large sample size offers little real 
benefit. Even worse, a very large sample size may actually cause a 
non-conservative result when the population data distribution has 
a longer tail than the assumed Gumbel distribution, thus failing 
to provide mechanical integrity assurance. Conversely, too small 
a sample size may lead to overly conservative lower-bound values 
that are not useful for engineering applications. An ideal sample 
size, one that avoids the pitfalls of being too large and too small, is 
20 to 30 units [1]. 
To meet both the 5% and the 20-30 units criteria, a large population 
may be divided into groups, with each group having 400-600 units 
for EVA. For example, a population containing 1500 units may be 
divided into three groups of 500 units, and 25 units of each group 
(i.e., 5% of the group population) taken as a sample for EVA. 
As noted previously, the logic used to divide the population may 
also be based on damage mechanisms. For example, a three-pass 
bundle with corrosion closely associated with the passes may be 
divided into three groups corresponding to the three passes. A bun-
dle having corrosion primarily at the bottom may be divided into 
two groups – the top half and the bottom half – and each group 
sampled and analyzed to determine its extreme value.   
Mechanical Integrity Applications 
EVA supports mechanical integrity management in several ways: 
Remaining 
Life 
Assessment 
and 
Run/Repair/Replace 
Decision-making: Confidence interval lower-bound value pro-
vides a conservative, defensible basis for determining whether 
equipment can safely remain in service. This avoids potential 
equipment failure caused by using only measured minima with-
out due consideration of uncertainty, while also avoiding the brute 
force approach of high inspection coverage.
Inspection Interval Setting: EVA integrates naturally with RBI 
for inspection interval setting. This point will be further discussed 
in Part 2 of this three-part series of articles.
Turnaround/Maintenance Scope Optimization: EVA reduces 
unnecessary inspection scope and helps target high‑risk areas. 
For example, EVA of prior inspection data before an upcoming 
turnaround can help identify equipment that will likely need to 
be replaced and equipment that will likely be able to demonstrate 
integrity for continued operation with only a small sample inspec-
tion. In the former case, an organization can be well-prepared for 
the equipment replacement, mitigating the risk of late discovery 
during the turnaround and avoiding the expense of cleaning and 
inspecting equipment that will be replaced anyway. In the latter 
case, equipment integrity can be demonstrated for continued safe 
operation with minimal cleaning and inspection required. There 
are also situations where EVA results may show that additional 
inspection will be needed to determine the exact scope needed for 
repair or replacement. In those situations, separating the popula-
tion into groups for EVA can help direct the additional inspection to 
areas where it is truly needed.    
EVA is therefore not simply a statistical technique; it is a strategic, 
mechanical integrity decision‑making tool. Proper implementa-
tion requires discipline: ensuring proper population definition and 
sampling-based inspection, consistently using the lower-bound 
values of confidence intervals with EVA, understanding the under-
lying assumptions, and performing follow-up as needed. When 
performed correctly, EVA can serve as a powerful tool for optimiz-
ing inspection programs, assuring mechanical integrity, and reduc-
ing unnecessary maintenance/inspection costs.
Conclusion 
EVA offers a powerful, statistically rigorous foundation for estimat-
ing worst‑case wall thickness across a wide variety of equipment. 
When applied correctly, with appropriate population segmenta-
tion, accurate quantitative NDE, and mechanism‑aware sampling, 
EVA allows organizations to break the traditional reliability‑cost 
dilemma and make better, more informed decisions.
This article establishes the foundation for the next two in this 
series. Part 2 applies EVA to inspection of heat exchanger tubes. 
Part 3 covers EVA applications for inspections of piping, pressure 
vessels, and aboveground storage tank bottoms. n
For more information on this subject or the author, please email 
us at inquiries@inspectioneering.com.
REFERENCES 
1.	 Wang, W. D., 2006, “Extreme Value Analysis of Heat Exchanger Tube Inspection 
Data,” ASME Pressure Vessels and Piping Conference Paper PVP2006-
ICPVT-11-93702.


---
## Page 6

6      Inspectioneering Journal     MARCH | APRIL 2026
W. David Wang, Ph.D., P.E. 
W. David Wang, Ph.D., P.E., is the Founder and Principal Consultant of Asset Integrity Global 
LLC with more than 35 years of experience in asset integrity management, inspection, and 
nondestructive evaluation (NDE) in the oil and gas industry. His career includes frontline 
mechanical integrity experience at Shell Deer Park Refinery and leadership of the Mechanical 
Integrity organization at the Pearl GTL facility in Qatar, along with technical authority and 
R&D leadership roles at Shell. He developed the Extreme Value Analysis (EVA) methodology 
for inspection data analysis and led the development of Shell’s best-practice guidance for 
heat exchanger tube inspection using EVA. He has also contributed to industry codes and 
standards through leadership roles and technical participation in API and other  
professional organizations.
CONTRIBUTING AUTHOR


### Embedded Images OCR
