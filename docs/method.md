# How the verdict is reached

## The range around each rate

The rate is actions divided by visitors. The range around it is the Wilson score interval at the chosen confidence (90, 95 or 99 percent). It is used instead of the textbook "rate plus or minus" interval because it stays between 0 and 1 and stays reliable when there are few actions, which is where most landing page tests are.

## The verdict

| Verdict | When |
|---|---|
| passes | the low end of the range is above the success line |
| fails | the high end of the range is below the success line |
| undecided | the line falls inside the range |

## Visitors still needed

For an undecided variant, the tool finds the smallest total number of visitors at which the same rate would give a range that clears the line, and reports how many more that is. It is an estimate: if the rate moves as more visitors arrive, the number moves too. When the rate sits exactly on the line, no number of visitors decides it, and the report says so.

## Comparing variants

Every pair of variants is compared with Newcombe's hybrid score interval for the difference of two shares, built from the two Wilson intervals. A variant is "ahead" only when that range does not include zero; otherwise the report says there is no clear winner yet.

## Cost per action

When the file gives a cost for a variant, the cost per action is the cost divided by the actions. With no actions it is reported as "no actions" rather than a division by zero.
